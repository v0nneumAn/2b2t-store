from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ulid import ULID

from .. import models
from ..config import get_settings
from ..models import get_db, OrderStatus
from ..services.orders import calculate_order_total
from ..services.depots import assign_depot
from ..services.monero import get_monero_client

router = APIRouter()


class OrderCreate(BaseModel):
    cart_id: str
    delivery_type: str
    delivery_coords: dict | None = None
    delivery_address: str | None = None
    customer_email: str | None = None
    customer_discord_id: str | None = None


@router.post("")
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    settings = get_settings()
    cart = db.query(models.Cart).filter(models.Cart.id == payload.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    total_usd = calculate_order_total(db, cart.items)
    if total_usd < Decimal(str(settings.min_order_usd)):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order is ${settings.min_order_usd}",
        )

    # Generate Monero subaddress
    monero = get_monero_client()
    address, subaddress_index = monero.create_address(label=f"order_{ULID()}")
    # TODO: fetch real XMR/USD rate
    price_xmr = total_usd / Decimal("150.0")

    order = models.Order(
        id=str(ULID()),
        customer_email=payload.customer_email,
        customer_discord_id=payload.customer_discord_id,
        delivery_type=payload.delivery_type,
        delivery_coords=payload.delivery_coords,
        delivery_address=payload.delivery_address,
        price_usd=total_usd,
        price_xmr=price_xmr,
        xmr_address=address,
        xmr_subaddress_index=subaddress_index,
        status=OrderStatus.AWAITING_PAYMENT.value,
    )
    db.add(order)

    # Create order items
    for item in cart.items:
        product = db.query(models.Product).filter(models.Product.id == item["product_id"]).first()
        if product:
            db.add(models.OrderItem(
                id=str(ULID()),
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=item.get("quantity", 1),
                unit_price_usd=product.price_usd,
            ))

    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/{order_id}/payment")
def get_payment_status(order_id: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_id": order.id,
        "status": order.status,
        "xmr_address": order.xmr_address,
        "price_xmr": str(order.price_xmr),
        "confirmations": order.confirmations,
        "tx_hash": order.payment_tx_hash,
    }
