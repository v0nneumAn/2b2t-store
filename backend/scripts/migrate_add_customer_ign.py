#!/usr/bin/env python3
"""Add customer_ign column to orders table (idempotent)."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.models import engine
from sqlalchemy import text


def migrate():
    url = str(engine.url)
    with engine.connect() as conn:
        if url.startswith("sqlite"):
            result = conn.execute(text("PRAGMA table_info(orders)"))
            columns = {row[1] for row in result}
            if "customer_ign" in columns:
                print("customer_ign column already exists.")
                return
            conn.execute(text("ALTER TABLE orders ADD COLUMN customer_ign VARCHAR(64)"))
        else:
            result = conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_ign'")
            )
            if result.fetchone():
                print("customer_ign column already exists.")
                return
            conn.execute(text("ALTER TABLE orders ADD COLUMN customer_ign VARCHAR(64)"))
        conn.commit()
        print("Added customer_ign column.")


if __name__ == "__main__":
    migrate()
