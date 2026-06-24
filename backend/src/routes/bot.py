from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import auth
from .. import models
from ..models import get_db, OrderStatus

router = APIRouter()


class JobUpdate(BaseModel):
    status: str
    payload: dict | None = None


class HandoffReport(BaseModel):
    coords: dict
    bot_id: str


class DropReport(BaseModel):
    proof: dict | None = None


# Map job statuses that should also update the parent order status.
_JOB_STATUS_TO_ORDER_STATUS = {
    "preparing": OrderStatus.PREPARING.value,
    "in_transit": OrderStatus.IN_TRANSIT.value,
    "dropping": OrderStatus.DROPPING.value,
    "delivered": OrderStatus.DELIVERED.value,
    "completed": OrderStatus.COMPLETED.value,
}


@router.get("/jobs/next")
def next_job(db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    job = (
        db.query(models.DeliveryJob)
        .filter(models.DeliveryJob.status == "queued")
        .order_by(models.DeliveryJob.created_at.asc())
        .first()
    )
    if not job:
        return {"job": None}
    return {"job": job}


@router.get("/orders/ready")
def list_ready_orders(db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    """Return orders ready for pickup that have an associated Discord customer."""
    orders = (
        db.query(models.Order)
        .filter(models.Order.status == OrderStatus.READY_FOR_PICKUP.value)
        .filter(models.Order.customer_discord_id.isnot(None))
        .all()
    )
    return {
        "orders": [
            {
                "id": o.id,
                "customer_discord_id": o.customer_discord_id,
                "handoff_coords": o.handoff_coords,
                "assigned_bot": o.assigned_bot,
                "price_usd": str(o.price_usd),
            }
            for o in orders
        ]
    }


@router.post("/jobs/{job_id}/claim")
def claim_job(job_id: str, bot_id: str, db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    job = db.query(models.DeliveryJob).filter(models.DeliveryJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "claimed"
    job.bot_id = bot_id
    db.commit()
    return {"success": True}


@router.post("/jobs/{job_id}/update")
def update_job(job_id: str, payload: JobUpdate, db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    job = db.query(models.DeliveryJob).filter(models.DeliveryJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = payload.status
    if payload.payload:
        job.payload = payload.payload

    # Sync parent order status for well-known job states.
    order = db.query(models.Order).filter(models.Order.id == job.order_id).first()
    if order and payload.status in _JOB_STATUS_TO_ORDER_STATUS:
        order.status = _JOB_STATUS_TO_ORDER_STATUS[payload.status]
        if payload.status in ("delivered", "completed") and not order.delivered_at:
            order.delivered_at = datetime.now(timezone.utc)

    db.commit()
    return {"success": True}


@router.post("/orders/{order_id}/handoff")
def report_handoff(
    order_id: str,
    payload: HandoffReport,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    """Delivery bot reports the EnderChest handoff coordinates near spawn."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed_source_states = {
        OrderStatus.PAID.value,
        OrderStatus.PREPARING.value,
        OrderStatus.IN_TRANSIT.value,
    }
    if order.status not in allowed_source_states:
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be advanced to ready_for_pickup from status {order.status}",
        )

    coords = payload.coords
    if not isinstance(coords, dict) or not all(k in coords for k in ("x", "y", "z")):
        raise HTTPException(
            status_code=422,
            detail="coords must include x, y, z",
        )

    order.handoff_coords = coords
    order.assigned_bot = payload.bot_id
    order.status = OrderStatus.READY_FOR_PICKUP.value
    db.commit()
    db.refresh(order)
    return {
        "id": order.id,
        "status": order.status,
        "handoff_coords": order.handoff_coords,
        "assigned_bot": order.assigned_bot,
    }


@router.post("/orders/{order_id}/dropped")
def report_dropped(
    order_id: str,
    payload: DropReport,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    """Delivery bot reports that items have been dropped for the customer."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed_source_states = {
        OrderStatus.CUSTOMER_ARRIVED.value,
        OrderStatus.DROPPING.value,
    }
    if order.status not in allowed_source_states:
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be marked dropped from status {order.status}",
        )

    order.status = OrderStatus.DELIVERED.value
    order.delivery_proof = payload.proof or {}
    order.delivered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return {
        "id": order.id,
        "status": order.status,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
    }
