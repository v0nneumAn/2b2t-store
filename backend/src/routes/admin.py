import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.orm import Session

from .. import auth
from .. import models
from ..limiter import limiter
from ..models import get_db

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


@router.get("/products", dependencies=[Depends(auth.require_admin_key)])
@limiter.limit("60/minute")
def list_products_admin(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.post("/products", dependencies=[Depends(auth.require_admin_key)])
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


@router.get("/orders", dependencies=[Depends(auth.require_admin_key)])
@limiter.limit("30/minute")
def list_orders(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Order).all()


@router.get("/depots", dependencies=[Depends(auth.require_admin_key)])
@limiter.limit("60/minute")
def list_depots(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Depot).all()


@router.post("/depots", dependencies=[Depends(auth.require_admin_key)])
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
