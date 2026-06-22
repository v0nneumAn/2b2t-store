from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models
from ..models import get_db, OrderStatus
from ..services.depots import assign_depot, reserve_stock
from ..services.delivery_queue import create_delivery_job
from ..services.stripe_client import get_stripe_client

router = APIRouter()


class CheckoutSessionRequest(BaseModel):
    success_url: str
    cancel_url: str


@router.post("/checkout/{order_id}")
def create_checkout_session(
    order_id: str,
    payload: CheckoutSessionRequest,
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.AWAITING_PAYMENT.value:
        raise HTTPException(status_code=400, detail="Order is not awaiting payment")

    stripe_client = get_stripe_client()
    session = stripe_client.create_checkout_session(
        order_id=order.id,
        amount_usd=order.price_usd,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
    )

    order.payment_checkout_session_id = session.id
    order.payment_intent_id = session.payment_intent
    order.payment_status = "requires_payment"
    db.commit()
    db.refresh(order)

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    stripe_client = get_stripe_client()

    try:
        event = stripe_client.construct_event(payload, signature)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        if not order_id:
            raise HTTPException(status_code=400, detail="Missing order_id in metadata")

        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status == OrderStatus.AWAITING_PAYMENT.value:
            order.status = OrderStatus.PAID.value
            order.payment_status = "succeeded"
            order.payment_intent_id = session.get("payment_intent")
            order.payment_checkout_session_id = session.get("id")
            order.paid_at = datetime.now(timezone.utc)

            # Assign depot and reserve stock
            depot = assign_depot(db, order)
            if depot:
                order.assigned_depot_id = depot.id
                reserve_stock(db, depot, order)
                create_delivery_job(db, order, depot)

        db.commit()
        db.refresh(order)

    return {"status": "ok"}
