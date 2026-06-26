#!/usr/bin/env python3
"""
Seed demo bots for the full end-to-end test.

Run from the backend directory or inside the container:
    python scripts/seed_bots.py

Existing bots that do not yet have a per-bot api_key will have one generated.
"""

import os
import secrets
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.models import Base, Bot, engine, SessionLocal


def _api_key():
    return secrets.token_urlsafe(32)


DELIVERY_BOT_ID = os.getenv("DELIVERY_BOT_BOT_ID", "delivery-alpha")
DISCORD_BOT_ID = os.getenv("DISCORD_BOT_ID", "discord-notifier")

DEMO_BOTS = [
    {
        "id": f"bot-{DELIVERY_BOT_ID}",
        "role": DELIVERY_BOT_ID,
        "bot_type": "delivery",
        "account_name": os.getenv("DELIVERY_BOT_USERNAME", "DeliveryAlpha"),
        "status": "active",
        "config": {"api_key": os.getenv("DELIVERY_BOT_API_KEY", _api_key())},
    },
    {
        "id": f"bot-{DISCORD_BOT_ID}",
        "role": DISCORD_BOT_ID,
        "bot_type": "discord",
        "account_name": "DiscordNotifier",
        "status": "active",
        "config": {"api_key": os.getenv("DISCORD_BOT_API_KEY", _api_key())},
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for data in DEMO_BOTS:
            existing = db.query(Bot).filter(Bot.id == data["id"]).first()
            if existing:
                if not existing.config or not existing.config.get("api_key"):
                    existing.config = existing.config or {}
                    existing.config["api_key"] = data["config"]["api_key"]
                    db.commit()
                    print(f"Generated api_key for existing bot {data['id']}.")
                else:
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
