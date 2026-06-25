#!/usr/bin/env python3
"""
Seed demo bots for the full end-to-end test.

Run from the backend directory or inside the container:
    python scripts/seed_bots.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.models import Base, Bot, engine, SessionLocal


DEMO_BOTS = [
    {
        "id": "bot-delivery-alpha",
        "role": "delivery-alpha",
        "bot_type": "delivery",
        "account_name": "DeliveryAlpha",
        "status": "active",
        "config": {},
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for data in DEMO_BOTS:
            existing = db.query(Bot).filter(Bot.id == data["id"]).first()
            if existing:
                print(f"Bot {data['id']} already exists; skipping.")
                continue
            bot = Bot(**data)
            db.add(bot)
            print(f"Added bot {data['id']} ({data['role']}).")
        db.commit()
        print("Bot seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
