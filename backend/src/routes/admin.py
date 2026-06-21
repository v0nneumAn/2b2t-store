from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ulid import ULID

from .. import models
from ..models import get_db

router = APIRouter()


class ProductCreate(BaseModel):
    id: str | None = None
    name: str
    description: str = ""
    category: str
    price_usd: float
    image_url: str | None = None
    delivery_types: list[str] = ["random", "specified", "meetup"]
    contents: list[dict] = []
    stock_keeping: str = "depot"
    min_order_qty: int = 1
    max_order_qty: int | None = None


class DepotCreate(BaseModel):
    id: str | None = None
    name: str
    x: int
    y: int
    z: int
    dimension: str = "overworld"
    quadrant: str | None = None
    inventory: dict = {}


@router.get("/products")
def list_products_admin(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.post("/products")
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = models.Product(
        id=payload.id or str(ULID()),
        **payload.model_dump(exclude={"id"})
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/orders")
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()


@router.get("/depots")
def list_depots(db: Session = Depends(get_db)):
    return db.query(models.Depot).all()


@router.post("/depots")
def create_depot(payload: DepotCreate, db: Session = Depends(get_db)):
    depot = models.Depot(
        id=payload.id or str(ULID()),
        **payload.model_dump(exclude={"id"})
    )
    db.add(depot)
    db.commit()
    db.refresh(depot)
    return depot
