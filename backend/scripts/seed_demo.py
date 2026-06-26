#!/usr/bin/env python3
"""
Seed demo products and a depot for the public demo.

Run from the backend directory:
    python scripts/seed_demo.py

Idempotent: skips existing records by primary key, but updates image_url for
existing products so re-running applies new assets.
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
        "price_usd": 9.99,
        "image_url": "/assets/products/demo-starter-kit.png",
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
        "image_url": "/assets/products/demo-totem-box.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 10,
    },
    {
        "id": "demo-pvp-kit",
        "name": "Neth Meta PvP Kit",
        "description": "Netherite gear, mace, wind charges and pots for PvP.",
        "category": "kits",
        "server": "2b2t",
        "price_usd": 14.99,
        "image_url": "/assets/products/demo-pvp-kit.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 3,
    },
    {
        "id": "demo-spawn-kit",
        "name": "Escape Spawn Kit",
        "description": "Elytra, pearls, obsidian and food for getting out of spawn.",
        "category": "kits",
        "server": "2b2t",
        "price_usd": 7.99,
        "image_url": "/assets/products/demo-spawn-kit.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 5,
    },
    {
        "id": "demo-survival-kit",
        "name": "Survival Kit",
        "description": "Tools, armor and food for long-range survival.",
        "category": "kits",
        "server": "2b2t",
        "price_usd": 12.99,
        "image_url": "/assets/products/demo-survival-kit.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 3,
    },
    {
        "id": "demo-egap-box",
        "name": "Shulker of Golden Apples (27x)",
        "description": "Full shulker of Golden Apples.",
        "category": "items",
        "server": "2b2t",
        "price_usd": 8.99,
        "image_url": "/assets/products/demo-egap-box.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 5,
    },
    {
        "id": "demo-travel-kit",
        "name": "Travel Kit",
        "description": "Elytra, fireworks, boats and snacks for traveling the map.",
        "category": "kits",
        "server": "2b2t",
        "price_usd": 4.99,
        "image_url": "/assets/products/demo-travel-kit.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 5,
    },
    {
        "id": "demo-adventure-kit",
        "name": "Adventure Kit",
        "description": "Ranged weapons, tools and provisions for exploring.",
        "category": "kits",
        "server": "2b2t",
        "price_usd": 6.99,
        "image_url": "/assets/products/demo-adventure-kit.png",
        "is_active": True,
        "delivery_types": ["random", "specified"],
        "contents": [],
        "stock_keeping": "depot",
        "min_order_qty": 1,
        "max_order_qty": 5,
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
            "demo-pvp-kit": 30,
            "demo-spawn-kit": 40,
            "demo-survival-kit": 25,
            "demo-egap-box": 60,
            "demo-travel-kit": 40,
            "demo-adventure-kit": 35,
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
                if existing.image_url != data["image_url"]:
                    existing.image_url = data["image_url"]
                    print(f"Updated image_url for {data['id']}.")
                else:
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
