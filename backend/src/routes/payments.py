from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models
from ..models import get_db, OrderStatus
from ..services.monero import get_monero_client
from ..services.depots import assign_depot, reserve_stock
from ..services.delivery_queue import create_delivery_job

router = APIRouter()


class PaymentNotify(BaseModel):
    order_id: str


@router.post("/notify")
def notify_payment(payload: PaymentNotify, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    monero = get_monero_client()
    payment = monero.check_payment(order.xmr_address, order.price_xmr)

    if payment:
        order.confirmations = payment.get("confirmations", 0)
        order.payment_tx_hash = payment.get("tx_hash")

        if order.confirmations >= monero.confirmations_required:
            order.status = OrderStatus.PAID.value
            order.paid_at = payment.get("timestamp")

            # Assign depot and reserve stock
            depot = assign_depot(db, order)
            if depot:
                order.assigned_depot_id = depot.id
                reserve_stock(db, depot, order)
                create_delivery_job(db, order, depot)

    db.commit()
    db.refresh(order)
    return {"status": order.status, "confirmations": order.confirmations}
