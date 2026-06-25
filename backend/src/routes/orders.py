import secrets
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from .. import models
from ..config import get_settings
from ..limiter import limiter
from ..models import get_db, OrderStatus
from ..services.delivery_queue import create_drop_job
from ..services.orders import calculate_order_total

router = APIRouter()


class OrderCreate(BaseModel):
    cart_id: str
    delivery_type: str = Field(..., pattern="^(random|specified|meetup)$")
    delivery_coords: dict | None = None
    delivery_address: str | None = None
    customer_email: EmailStr | None = None
    customer_discord_id: str | None = None

    @field_validator("delivery_coords")
    @classmethod
    def validate_coords(cls, v, info):
        if info.data.get("delivery_type") == "specified" and not v:
            raise ValueError("delivery_coords required for specified delivery")
        return v


def _get_session_id(x_session_id: str | None = Header(None)) -> str | None:
    return x_session_id


@router.post("")
@limiter.limit("10/minute")
def create_order(
    request: Request,
    payload: OrderCreate,
    db: Session = Depends(get_db),
    session_id: str | None = Depends(_get_session_id),
):
    settings = get_settings()
    cart = db.query(models.Cart).filter(models.Cart.id == payload.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    if cart.session_id and cart.session_id != session_id:
        raise HTTPException(status_code=404, detail="Cart not found")

    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate cart items against products
    for item in cart.items:
        product = db.query(models.Product).filter(models.Product.id == item["product_id"]).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item['product_id']} not found")
        if not product.is_active:
            raise HTTPException(status_code=400, detail=f"Product {product.name} is not active")
        qty = item.get("quantity", 1)
        if qty < product.min_order_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum quantity for {product.name} is {product.min_order_qty}",
            )
        if product.max_order_qty and qty > product.max_order_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum quantity for {product.name} is {product.max_order_qty}",
            )
        if payload.delivery_type not in (product.delivery_types or []):
            raise HTTPException(
                status_code=400,
                detail=f"Delivery type {payload.delivery_type} not available for {product.name}",
            )

    total_usd = calculate_order_total(db, cart.items)
    if total_usd < Decimal(str(settings.min_order_usd)):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order is ${settings.min_order_usd}",
        )

    order = models.Order(
        id=secrets.token_urlsafe(16),
        cart_id=cart.id,
        customer_email=payload.customer_email,
        customer_discord_id=payload.customer_discord_id,
        delivery_type=payload.delivery_type,
        delivery_coords=payload.delivery_coords,
        delivery_address=payload.delivery_address,
        price_usd=total_usd,
        status=OrderStatus.AWAITING_PAYMENT.value,
    )
    db.add(order)

    # Create order items
    for item in cart.items:
        product = db.query(models.Product).filter(models.Product.id == item["product_id"]).first()
        if product:
            db.add(models.OrderItem(
                id=secrets.token_urlsafe(16),
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=item.get("quantity", 1),
                unit_price_usd=product.price_usd,
            ))

    db.commit()
    db.refresh(order)
    return order


def _verify_order_ownership(order: models.Order, session_id: str | None, db: Session):
    if order.cart_id:
        cart = db.query(models.Cart).filter(models.Cart.id == order.cart_id).first()
        if cart and cart.session_id and cart.session_id != session_id:
            raise HTTPException(status_code=404, detail="Order not found")


def _order_response(order: models.Order) -> dict:
    return {
        "id": order.id,
        "status": order.status,
        "delivery_type": order.delivery_type,
        "delivery_coords": order.delivery_coords,
        "handoff_coords": order.handoff_coords,
        "assigned_bot": order.assigned_bot,
        "price_usd": str(order.price_usd),
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "customer_arrived_at": order.customer_arrived_at.isoformat() if order.customer_arrived_at else None,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


@router.get("/by-email/{email}")
@limiter.limit("10/minute")
def list_orders_by_email(
    request: Request,
    email: str,
    db: Session = Depends(get_db),
):
    """Allow customers to look up all orders placed with a given email."""
    orders = (
        db.query(models.Order)
        .filter(models.Order.customer_email == email)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [_order_response(o) for o in orders]


@router.get("/{order_id}")
@limiter.limit("30/minute")
def get_order(
    request: Request,
    order_id: str,
    db: Session = Depends(get_db),
    session_id: str | None = Depends(_get_session_id),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _verify_order_ownership(order, session_id, db)
    return _order_response(order)


@router.post("/{order_id}/arrived")
@limiter.limit("10/minute")
def confirm_customer_arrival(
    request: Request,
    order_id: str,
    db: Session = Depends(get_db),
    session_id: str | None = Depends(_get_session_id),
):
    """Customer confirms they are at the handoff location."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _verify_order_ownership(order, session_id, db)

    if order.status != OrderStatus.READY_FOR_PICKUP.value:
        raise HTTPException(
            status_code=400,
            detail=f"Order is not ready for pickup (status: {order.status})",
        )

    order.status = OrderStatus.CUSTOMER_ARRIVED.value
    order.customer_arrived_at = datetime.now(timezone.utc)
    create_drop_job(db, order)
    db.commit()
    db.refresh(order)
    return _order_response(order)


@router.get("/{order_id}/payment")
@limiter.limit("30/minute")
def get_payment_status(
    request: Request,
    order_id: str,
    db: Session = Depends(get_db),
    session_id: str | None = Depends(_get_session_id),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _verify_order_ownership(order, session_id, db)
    return {
        "order_id": order.id,
        "status": order.status,
        "payment_provider": order.payment_provider,
        "payment_status": order.payment_status,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
    }
