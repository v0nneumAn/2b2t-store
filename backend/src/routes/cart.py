from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ulid import ULID

from .. import models
from ..models import get_db

router = APIRouter()


class CartItem(BaseModel):
    product_id: str
    quantity: int = 1


class CartCreate(BaseModel):
    session_id: str | None = None
    discord_id: str | None = None
    items: list[CartItem]


@router.post("")
def create_cart(payload: CartCreate, db: Session = Depends(get_db)):
    cart = models.Cart(
        id=str(ULID()),
        session_id=payload.session_id,
        discord_id=payload.discord_id,
        items=[item.model_dump() for item in payload.items],
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


@router.get("/{cart_id}")
def get_cart(cart_id: str, db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    return cart
