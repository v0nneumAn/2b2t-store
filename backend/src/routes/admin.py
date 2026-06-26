import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.orm import Session

from .. import auth
from .. import models
from ..config import get_settings
from ..limiter import limiter
from ..models import get_db, OrderStatus
from ..services.delivery_queue import create_drop_job

router = APIRouter()


class ProductCreate(BaseModel):
    id: str | None = None
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: str = Field(..., pattern="^(packs|items|ranks|kits)$")
    server: str = Field("2b2t", pattern="^(2b2t|donutsmp|other)$")
    price_usd: float = Field(..., ge=0)
    image_url: HttpUrl | None = None
    delivery_types: list[str] = ["random", "specified", "meetup"]
    contents: list[dict] = []
    stock_keeping: str = "depot"
    min_order_qty: int = Field(1, ge=1)
    max_order_qty: int | None = None


class DepotCreate(BaseModel):
    id: str | None = None
    name: str = Field(..., min_length=1, max_length=64)
    x: int
    y: int
    z: int
    dimension: str = "overworld"
    quadrant: str | None = None
    inventory: dict = {}


class AdminLogin(BaseModel):
    key: str = Field(..., min_length=1)


class DemoAdvance(BaseModel):
    to: str = Field(..., pattern="^(ready_for_pickup|customer_arrived|dropping|delivered|completed)$")


@router.get("/products", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("60/minute")
def list_products_admin(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.post("/products", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("10/minute")
def create_product(request: Request, payload: ProductCreate, db: Session = Depends(get_db)):
    product = models.Product(
        id=payload.id or secrets.token_urlsafe(16),
        **payload.model_dump(exclude={"id"}, mode="json")
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/orders", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("30/minute")
def list_orders(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Order).all()


@router.get("/depots", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("60/minute")
def list_depots(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Depot).all()


@router.get("/bots", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("60/minute")
def list_bots_admin(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Bot).all()


@router.get("/stats", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("60/minute")
def admin_stats(request: Request, db: Session = Depends(get_db)):
    return {
        "orders": db.query(models.Order).count(),
        "products": db.query(models.Product).count(),
        "depots": db.query(models.Depot).count(),
        "bots": db.query(models.Bot).count(),
    }


@router.post("/depots", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("10/minute")
def create_depot(request: Request, payload: DepotCreate, db: Session = Depends(get_db)):
    depot = models.Depot(
        id=payload.id or secrets.token_urlsafe(16),
        **payload.model_dump(exclude={"id"})
    )
    db.add(depot)
    db.commit()
    db.refresh(depot)
    return depot


@router.get("/demo-mode", dependencies=[Depends(auth.require_admin_cookie)])
@limiter.limit("60/minute")
def demo_mode_status(request: Request):
    return {"enabled": get_settings().demo_mode}


@router.post("/login")
@limiter.limit("10/minute")
def admin_login(
    request: Request,
    payload: AdminLogin,
    response: Response,
):
    """Validate the admin API key and start an HttpOnly cookie session."""
    settings = get_settings()
    if not secrets.compare_digest(payload.key, settings.admin_api_key):
        raise HTTPException(status_code=403, detail="Invalid admin key")
    auth.set_admin_cookie(response)
    return {"status": "ok"}


@router.post("/logout")
@limiter.limit("60/minute")
def admin_logout(
    request: Request,
    response: Response,
):
    auth.clear_admin_cookie(response)
    return {"status": "ok"}


@router.post("/orders/{order_id}/demo-advance")
@limiter.limit("60/minute")
def demo_advance_order(
    request: Request,
    order_id: str,
    payload: DemoAdvance,
    db: Session = Depends(get_db),
    _=Depends(auth.require_admin_cookie),
):
    """
    Demo-only: manually advance an order through delivery states as if the bot
    had reported them. This endpoint is NOT for production use.
    """
    if not get_settings().demo_mode:
        raise HTTPException(status_code=403, detail="Demo mode is disabled")

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    target = payload.to

    # Validate state machine progression loosely.
    state_order = [
        OrderStatus.AWAITING_PAYMENT.value,
        OrderStatus.PAID.value,
        OrderStatus.PREPARING.value,
        OrderStatus.IN_TRANSIT.value,
        OrderStatus.READY_FOR_PICKUP.value,
        OrderStatus.CUSTOMER_ARRIVED.value,
        OrderStatus.DROPPING.value,
        OrderStatus.DELIVERED.value,
        OrderStatus.COMPLETED.value,
    ]
    current_index = state_order.index(order.status) if order.status in state_order else -1
    target_index = state_order.index(target)

    if target_index < current_index:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot demo-advance backwards from {order.status} to {target}",
        )

    now = datetime.now(timezone.utc)

    # Fill in synthetic data as we cross milestones.
    if target in (OrderStatus.READY_FOR_PICKUP.value, OrderStatus.CUSTOMER_ARRIVED.value) and not order.handoff_coords:
        order.handoff_coords = {
            "x": 150,
            "y": 70,
            "z": -280,
            "dimension": "overworld",
        }
    if target == OrderStatus.READY_FOR_PICKUP.value and not order.assigned_bot:
        order.assigned_bot = "DeliveryBot-Demo"

    order.status = target

    if target == OrderStatus.CUSTOMER_ARRIVED.value:
        order.customer_arrived_at = order.customer_arrived_at or now
        # Create a drop job if one does not already exist for this state.
        existing_drop = (
            db.query(models.DeliveryJob)
            .filter(
                models.DeliveryJob.order_id == order.id,
                models.DeliveryJob.job_type == "drop",
            )
            .first()
        )
        if not existing_drop:
            create_drop_job(db, order)
    elif target in (OrderStatus.DELIVERED.value, OrderStatus.COMPLETED.value):
        order.delivered_at = order.delivered_at or now
        order.delivery_proof = order.delivery_proof or {"demo": True, "dropped_at": now.isoformat()}

    db.commit()
    db.refresh(order)
    return {
        "id": order.id,
        "status": order.status,
        "handoff_coords": order.handoff_coords,
        "assigned_bot": order.assigned_bot,
        "customer_arrived_at": order.customer_arrived_at.isoformat() if order.customer_arrived_at else None,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
    }
