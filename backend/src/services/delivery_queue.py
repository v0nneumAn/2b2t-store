from sqlalchemy.orm import Session
from ulid import ULID

from .. import models


def create_delivery_job(db: Session, order: models.Order, depot: models.Depot):
    job = models.DeliveryJob(
        id=str(ULID()),
        order_id=order.id,
        job_type=order.delivery_type,
        depot_id=depot.id,
        status="queued",
        payload={
            "delivery_coords": order.delivery_coords,
            "delivery_address": order.delivery_address,
            "items": [
                {"product_id": item.product_id, "product_name": item.product_name, "quantity": item.quantity}
                for item in order.items
            ],
        },
    )
    db.add(job)
    db.commit()
    return job


def create_drop_job(db: Session, order: models.Order):
    """Create a drop job after the customer confirms arrival at the handoff location."""
    job = models.DeliveryJob(
        id=str(ULID()),
        order_id=order.id,
        job_type="drop",
        depot_id=order.assigned_depot_id,
        status="queued",
        payload={
            "handoff_coords": order.handoff_coords,
            "items": [
                {"product_id": item.product_id, "product_name": item.product_name, "quantity": item.quantity}
                for item in order.items
            ],
        },
    )
    db.add(job)
    db.commit()
    return job
