from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Text, ForeignKey, JSON, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func

from .config import get_settings

Base = declarative_base()


class OrderStatus(str, Enum):
    PENDING = "pending"
    AWAITING_PAYMENT = "awaiting_payment"
    PAID = "paid"
    PREPARING = "preparing"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Product(Base):
    __tablename__ = "products"

    id = Column(String(32), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), nullable=False)
    server = Column(String(20), nullable=False, default="2b2t")
    price_usd = Column(Numeric(12, 4), nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    delivery_types = Column(JSON, default=list)
    contents = Column(JSON, default=list)
    stock_keeping = Column(String(20), default="depot")  # depot | made_to_order | unlimited
    min_order_qty = Column(Integer, default=1)
    max_order_qty = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Cart(Base):
    __tablename__ = "carts"

    id = Column(String(32), primary_key=True)
    session_id = Column(String(64), nullable=True)
    discord_id = Column(String(64), nullable=True)
    items = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(32), primary_key=True)
    order_id = Column(String(32), ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(32), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price_usd = Column(Numeric(12, 4), nullable=False)

    order = relationship("Order", back_populates="items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(32), primary_key=True)
    cart_id = Column(String(32), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_discord_id = Column(String(64), nullable=True)
    delivery_type = Column(String(20), nullable=False)
    delivery_coords = Column(JSON, nullable=True)
    delivery_address = Column(Text, nullable=True)

    price_usd = Column(Numeric(12, 4), nullable=False)

    # Stripe payment fields
    payment_provider = Column(String(20), default="stripe")
    payment_intent_id = Column(String(255), nullable=True)
    payment_checkout_session_id = Column(String(255), nullable=True)
    payment_status = Column(String(30), default="pending")
    paid_at = Column(DateTime(timezone=True), nullable=True)

    assigned_depot_id = Column(String(32), nullable=True)
    assigned_bot = Column(String(64), nullable=True)
    delivery_proof = Column(JSON, nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Depot(Base):
    __tablename__ = "depots"

    id = Column(String(32), primary_key=True)
    name = Column(String(64), nullable=False)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    z = Column(Integer, nullable=False)
    dimension = Column(String(20), default="overworld")
    quadrant = Column(String(10), nullable=True)
    inventory = Column(JSON, default=dict)
    reserved_inventory = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    last_restock = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DeliveryJob(Base):
    __tablename__ = "delivery_jobs"

    id = Column(String(32), primary_key=True)
    order_id = Column(String(32), ForeignKey("orders.id"), nullable=False)
    job_type = Column(String(20), nullable=False)
    depot_id = Column(String(32), ForeignKey("depots.id"), nullable=True)
    status = Column(String(30), default="queued")
    payload = Column(JSON, default=dict)
    attempts = Column(Integer, default=0)
    bot_id = Column(String(64), nullable=True)
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    order = relationship("Order")


class ConversationScript(Base):
    __tablename__ = "conversation_scripts"

    id = Column(String(32), primary_key=True)
    topic = Column(String(100), nullable=False)
    bot_roles = Column(JSON, default=list)
    lines = Column(JSON, default=list)
    status = Column(String(20), default="pending_review")  # pending_review | approved | used
    used_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdvertSchedule(Base):
    __tablename__ = "advert_schedules"

    id = Column(String(32), primary_key=True)
    conversation_id = Column(String(32), ForeignKey("conversation_scripts.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    required_bot_roles = Column(JSON, default=list)
    status = Column(String(20), default="scheduled")  # scheduled | active | completed | cancelled


class BotStatus(Base):
    __tablename__ = "advert_bot_status"

    role = Column(String(64), primary_key=True)
    in_game = Column(Boolean, default=False)
    is_queue = Column(Boolean, default=False)
    queue_position = Column(Integer, nullable=True)
    conversation_active = Column(Boolean, default=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now())


class Bot(Base):
    __tablename__ = "bots"

    id = Column(String(32), primary_key=True)
    role = Column(String(64), nullable=False, unique=True)
    bot_type = Column(String(20), nullable=False)  # advert | delivery | pearl
    account_name = Column(String(64), nullable=True)
    status = Column(String(20), default="active")  # active | paused | disabled
    config = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BotCommand(Base):
    __tablename__ = "bot_commands"

    id = Column(String(32), primary_key=True)
    bot_role = Column(String(64), nullable=False)
    command = Column(String(50), nullable=False)  # pause | resume | stop | restart
    payload = Column(JSON, nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProcessedStripeEvent(Base):
    __tablename__ = "processed_stripe_events"

    id = Column(String(64), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Engine factory: DATABASE_URL from environment (.env) defaults to PostgreSQL.
# Override with e.g. DATABASE_URL=sqlite:///./store.db for local SQLite dev.
_settings = get_settings()
_engine_kwargs = {}
if _settings.database_url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(_settings.database_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
