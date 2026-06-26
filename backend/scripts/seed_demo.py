#!/usr/bin/env python3
"""
Seed demo products and a depot for the public demo.

Run from the backend directory:
    python scripts/seed_demo.py

Idempotent: skips existing records by primary key.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.models import Base, Product, Depot, engine, SessionLocal


DEMO_PRODUCTS = [
    {
        "id": "demo-starter-kit",
        "name": "2b2t Starter Kit",
        "description": "A single shulker box with gear to get started on 2b2t.",
        "category": "kits",
        "server": "2b2t",
        "price_usd": 10.00,
        "image_url": "https://placehold.co/600x400/f97316/ffffff?text=2b2t+Starter+Kit",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 5,
    },
    {
        "id": "demo-totem-box",
        "name": "Shulker of Totems (27x)",
        "description": "Full shulker of Totems of Undying.",
        "category": "items",
        "server": "2b2t",
        "price_usd": 5.99,
        "image_url": "https://placehold.co/600x400/22c55e/ffffff?text=Shulker+of+Totems",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 10,
    },
]

DEMO_DEPOTS = [
    {
        "id": "demo-depot-spawn",
        "name": "Spawn Depot",
        "x": 150,
        "y": 70,
        "z": -280,
        "dimension": "overworld",
        "quadrant": "NW",
        "inventory": {
            "demo-starter-kit": 50,
            "demo-totem-box": 100,
        },
        "is_active": True,
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for data in DEMO_PRODUCTS:
            existing = db.query(Product).filter(Product.id == data["id"]).first()
            if existing:
                print(f"Product {data['id']} already exists; skipping.")
                continue
            product = Product(**data)
            db.add(product)
            print(f"Added product {data['id']}.")

        for data in DEMO_DEPOTS:
            existing = db.query(Depot).filter(Depot.id == data["id"]).first()
            if existing:
                print(f"Depot {data['id']} already exists; skipping.")
                continue
            depot = Depot(**data)
            db.add(depot)
            print(f"Added depot {data['id']}.")

        db.commit()
        print("Demo seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
