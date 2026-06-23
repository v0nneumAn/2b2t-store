from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import models
from ..limiter import limiter
from ..models import get_db, OrderStatus
from ..services.depots import assign_depot, reserve_stock
from ..services.delivery_queue import create_delivery_job
from ..services.stripe_client import get_stripe_client

router = APIRouter()


@router.post("/checkout/{order_id}")
@limiter.limit("10/minute")
def create_checkout_session(
    request: Request,
    order_id: str,
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
    )

    order.payment_checkout_session_id = session.id
    order.payment_intent_id = session.payment_intent
    order.payment_status = "requires_payment"
    db.commit()
    db.refresh(order)

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/webhook")
@limiter.limit("100/minute")
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

    event_id = event.get("id")
    if event_id:
        existing = (
            db.query(models.ProcessedStripeEvent)
            .filter(models.ProcessedStripeEvent.id == event_id)
            .first()
        )
        if existing:
            return {"status": "already processed"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        if not order_id:
            raise HTTPException(status_code=400, detail="Missing order_id in metadata")

        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Validate payment status
        if session.get("payment_status") != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")

        # Validate currency
        session_currency = (session.get("currency") or "").lower()
        if session_currency != stripe_client.currency.lower():
            raise HTTPException(status_code=400, detail="Currency mismatch")

        # Validate amount matches order total in cents
        expected_cents = int((order.price_usd * Decimal("100")).to_integral_value())
        if session.get("amount_total") != expected_cents:
            raise HTTPException(status_code=400, detail="Amount mismatch")

        # Only transition from awaiting_payment to paid (DB-level guard)
        updated = (
            db.query(models.Order)
            .filter(
                models.Order.id == order_id,
                models.Order.status == OrderStatus.AWAITING_PAYMENT.value,
            )
            .update(
                {
                    "status": OrderStatus.PAID.value,
                    "payment_status": "succeeded",
                    "payment_intent_id": session.get("payment_intent"),
                    "payment_checkout_session_id": session.get("id"),
                    "paid_at": datetime.now(timezone.utc),
                },
                synchronize_session=False,
            )
        )

        if updated:
            db.refresh(order)
            # Assign depot and reserve stock
            depot = assign_depot(db, order)
            if depot:
                order.assigned_depot_id = depot.id
                reserve_stock(db, depot, order)
                create_delivery_job(db, order, depot)

    if event_id:
        db.add(models.ProcessedStripeEvent(id=event_id))

    db.commit()
    return {"status": "ok"}
