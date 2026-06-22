#!/usr/bin/env python3
"""
Seed the backend with test data for advert-bot local testing.

Usage:
    cd backend
    source .venv/bin/activate
    python scripts/seed_advert_test.py
"""

import os
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src import models
from src.models import SessionLocal


def main():
    db = SessionLocal()

    # Register advert bots
    bot_roles = ["adbot-alpha", "adbot-beta"]
    for role in bot_roles:
        existing = db.query(models.Bot).filter(models.Bot.role == role).first()
        if not existing:
            bot = models.Bot(
                id=f"bot-{role}",
                role=role,
                bot_type="advert",
                account_name=role,
                status="active",
                config={"shortlink": "shulker.shop"},
            )
            db.add(bot)
            print(f"Registered bot: {role}")
        else:
            print(f"Bot already exists: {role}")

    # Seed an approved conversation script
    conv_id = "conv-test-001"
    existing_conv = db.query(models.ConversationScript).filter(models.ConversationScript.id == conv_id).first()
    if not existing_conv:
        conv = models.ConversationScript(
            id=conv_id,
            topic="shop trust debate",
            bot_roles=bot_roles,
            lines=[
                {
                    "role": "adbot-alpha",
                    "delay_ms": 2000,
                    "typing_ms": 1500,
                    "text": "dude i bought from that new shulker shop last week",
                },
                {
                    "role": "adbot-beta",
                    "delay_ms": 4500,
                    "typing_ms": 1800,
                    "text": "which one there are like 20 scams",
                },
                {
                    "role": "adbot-alpha",
                    "delay_ms": 3500,
                    "typing_ms": 1200,
                    "text": "the one my friend linked me, starts with shulker dot shop",
                },
                {
                    "role": "adbot-beta",
                    "delay_ms": 5000,
                    "typing_ms": 2000,
                    "text": "did u actually get the items",
                },
                {
                    "role": "adbot-alpha",
                    "delay_ms": 3000,
                    "typing_ms": 1500,
                    "text": "yeah delivered in like 10 mins, other shop took 2 days and overcharged",
                },
                {
                    "role": "adbot-beta",
                    "delay_ms": 4000,
                    "typing_ms": 1800,
                    "text": "send me the link later im curious",
                },
                {
                    "role": "adbot-alpha",
                    "delay_ms": 2500,
                    "typing_ms": 1200,
                    "text": "just /msg me ill tell u",
                },
            ],
            status="approved",
        )
        db.add(conv)
        print(f"Created conversation: {conv_id}")
    else:
        print(f"Conversation already exists: {conv_id}")

    # Schedule it to start soon
    schedule_id = f"sch-{conv_id}"
    existing_schedule = db.query(models.AdvertSchedule).filter(models.AdvertSchedule.id == schedule_id).first()
    if not existing_schedule:
        schedule = models.AdvertSchedule(
            id=schedule_id,
            conversation_id=conv_id,
            scheduled_at=datetime.utcnow() + timedelta(seconds=30),
            required_bot_roles=bot_roles,
            status="scheduled",
        )
        db.add(schedule)
        print(f"Scheduled conversation: {schedule_id}")
    else:
        print(f"Schedule already exists: {schedule_id}")

    db.commit()
    db.close()
    print("Done.")


if __name__ == "__main__":
    main()
