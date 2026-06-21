from decimal import Decimal
from sqlalchemy.orm import Session

from .. import models


def calculate_order_total(db: Session, cart_items: list) -> Decimal:
    total = Decimal("0.00")
    for item in cart_items:
        product = db.query(models.Product).filter(models.Product.id == item["product_id"]).first()
        if product:
            qty = item.get("quantity", 1)
            total += Decimal(str(product.price_usd)) * qty
    return total
