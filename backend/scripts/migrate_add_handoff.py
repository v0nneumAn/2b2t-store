#!/usr/bin/env python3
"""
One-off migration to add handoff columns required for the public demo.

Run from the backend directory:
    python scripts/migrate_add_handoff.py

This uses Alembic operations behind the scenes but does not require a full
Alembic environment. It is safe to run multiple times (idempotent).
"""

import os
import sys

# Allow importing from src/ regardless of where the script is invoked from.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from alembic.operations import Operations
from alembic.runtime.migration import MigrationContext
from sqlalchemy import Column, DateTime, JSON, MetaData, create_engine, inspect
from sqlalchemy.sql import func

from src.config import get_settings


def migrate():
    settings = get_settings()
    engine = create_engine(settings.database_url)
    conn = engine.connect()

    inspector = inspect(engine)
    existing_columns = {col["name"] for col in inspector.get_columns("orders")}

    ctx = MigrationContext.configure(conn)
    op = Operations(ctx)

    with op.batch_alter_table("orders") as batch_op:
        if "handoff_coords" not in existing_columns:
            print("Adding orders.handoff_coords (JSON)")
            batch_op.add_column(Column("handoff_coords", JSON, nullable=True))
        else:
            print("orders.handoff_coords already exists")

        if "customer_arrived_at" not in existing_columns:
            print("Adding orders.customer_arrived_at (DateTime)")
            batch_op.add_column(Column("customer_arrived_at", DateTime(timezone=True), nullable=True))
        else:
            print("orders.customer_arrived_at already exists")

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
