from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, Field
import secrets
from sqlalchemy.orm import Session

from .. import models
from ..limiter import limiter
from ..models import get_db

router = APIRouter()


class CartItem(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(1, ge=1)


class CartCreate(BaseModel):
    session_id: str | None = None
    discord_id: str | None = None
    items: list[CartItem]


def _get_session_id(x_session_id: str | None = Header(None)) -> str | None:
    return x_session_id


@router.post("")
@limiter.limit("10/minute")
def create_cart(request: Request, payload: CartCreate, db: Session = Depends(get_db)):
    cart = models.Cart(
        id=secrets.token_urlsafe(16),
        session_id=payload.session_id,
        discord_id=payload.discord_id,
        items=[item.model_dump() for item in payload.items],
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


@router.get("/{cart_id}")
@limiter.limit("30/minute")
def get_cart(
    cart_id: str,
    request: Request,
    db: Session = Depends(get_db),
    session_id: str | None = Depends(_get_session_id),
):
    cart = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    if cart.session_id and cart.session_id != session_id:
        raise HTTPException(status_code=404, detail="Cart not found")
    return cart
