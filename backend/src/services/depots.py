import math
from decimal import Decimal
from sqlalchemy.orm import Session

from .. import models


def distance(depot: models.Depot, coords: dict | None) -> float:
    if not coords:
        return 0.0
    dx = depot.x - coords.get("x", 0)
    dz = depot.z - coords.get("z", 0)
    return math.sqrt(dx * dx + dz * dz)


def assign_depot(db: Session, order: models.Order) -> models.Depot | None:
    """Find nearest depot with all required items in stock."""
    required = {}
    for item in order.items:
        required[item.product_id] = required.get(item.product_id, 0) + item.quantity

    candidates = []
    for depot in db.query(models.Depot).filter(models.Depot.is_active == True).all():
        inventory = depot.inventory or {}
        reserved = depot.reserved_inventory or {}
        available = {
            pid: inventory.get(pid, 0) - reserved.get(pid, 0)
            for pid in inventory
        }
        if all(available.get(pid, 0) >= qty for pid, qty in required.items()):
            candidates.append(depot)

    if not candidates:
        return None

    return min(candidates, key=lambda d: distance(d, order.delivery_coords))


def reserve_stock(db: Session, depot: models.Depot, order: models.Order):
    """Reserve stock at depot when order is paid."""
    reserved = depot.reserved_inventory or {}
    for item in order.items:
        reserved[item.product_id] = reserved.get(item.product_id, 0) + item.quantity
    depot.reserved_inventory = reserved
    db.commit()


def consume_stock(db: Session, depot: models.Depot, order: models.Order):
    """Move reserved stock to consumed after successful delivery."""
    inventory = depot.inventory or {}
    reserved = depot.reserved_inventory or {}
    for item in order.items:
        pid = item.product_id
        qty = item.quantity
        inventory[pid] = max(0, inventory.get(pid, 0) - qty)
        reserved[pid] = max(0, reserved.get(pid, 0) - qty)
    depot.inventory = inventory
    depot.reserved_inventory = reserved
    db.commit()


def release_stock(db: Session, depot: models.Depot, order: models.Order):
    """Release reserved stock if delivery fails."""
    reserved = depot.reserved_inventory or {}
    for item in order.items:
        pid = item.product_id
        reserved[pid] = max(0, reserved.get(pid, 0) - item.quantity)
    depot.reserved_inventory = reserved
    db.commit()
