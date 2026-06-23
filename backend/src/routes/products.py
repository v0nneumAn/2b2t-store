from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import models
from ..limiter import limiter
from ..models import get_db

router = APIRouter()


@router.get("")
@limiter.limit("100/minute")
def list_products(request: Request, db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(models.Product.is_active == True).all()
    return products


@router.get("/{product_id}")
@limiter.limit("100/minute")
def get_product(request: Request, product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
