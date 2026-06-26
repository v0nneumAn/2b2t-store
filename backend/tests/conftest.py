import os
import secrets
import sys
from decimal import Decimal
from types import ModuleType

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure test environment *before* any app modules are imported.
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["BOT_API_KEY"] = "test-bot-key"
os.environ["ADMIN_API_KEY"] = "test-admin-key"
os.environ["ADMIN_JWT_SECRET"] = "test-jwt-secret-do-not-use-in-production"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_xxx"
os.environ["STRIPE_PUBLISHABLE_KEY"] = "pk_test_xxx"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_xxx"
os.environ["FRONTEND_URL"] = "http://localhost:5173"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["DEMO_MODE"] = "true"

# Disable rate limiting for tests by injecting a no-op limiter before routes load.
limiter_module = ModuleType("src.limiter")


class _DummyLimiter:
    def limit(self, *args, **kwargs):
        def decorator(func):
            return func
        return decorator


limiter_module.limiter = _DummyLimiter()
sys.modules["src.limiter"] = limiter_module

from src.main import app  # noqa: E402
from src.models import Base, Product, Depot, Cart, Order, Bot, get_db  # noqa: E402


engine = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    # Seed minimal data required by most tests.
    product = Product(
        id="demo-starter-kit",
        name="2b2t Starter Kit",
        description="Demo kit",
        category="kits",
        server="2b2t",
        price_usd=Decimal("10.00"),
        is_active=True,
        delivery_types=["random", "specified"],
        stock_keeping="depot",
        min_order_qty=1,
    )
    depot = Depot(
        id="demo-depot",
        name="Demo Depot",
        x=100,
        y=64,
        z=-200,
        inventory={"demo-starter-kit": 50},
        reserved_inventory={},
        is_active=True,
    )
    bot = Bot(
        id="bot-delivery-alpha",
        role="delivery-alpha",
        bot_type="delivery",
        status="active",
        config={"api_key": "test-bot-key"},
    )
    db.add(product)
    db.add(depot)
    db.add(bot)
    db.commit()

    yield TestClient(app, base_url="https://testserver")


@pytest.fixture(scope="function")
def admin_client(client):
    """Client authenticated as admin via HttpOnly cookie."""
    resp = client.post("/api/admin/login", json={"key": "test-admin-key"})
    assert resp.status_code == 200
    yield client


@pytest.fixture(scope="function")
def session_id():
    return secrets.token_hex(16)


@pytest.fixture(scope="function")
def bot_headers():
    return {"X-Bot-Id": "delivery-alpha", "X-Bot-Key": "test-bot-key"}


@pytest.fixture(scope="function")
def paid_order(client, db, session_id):
    """Create a paid order via the public API and return its ID."""
    cart_resp = client.post(
        "/api/cart",
        json={
            "session_id": session_id,
            "items": [{"product_id": "demo-starter-kit", "quantity": 1}],
        },
        headers={"X-Session-Id": session_id},
    )
    assert cart_resp.status_code == 200
    cart_id = cart_resp.json()["id"]

    order_resp = client.post(
        "/api/orders",
        json={
            "cart_id": cart_id,
            "delivery_type": "random",
            "customer_email": "demo@example.com",
        },
        headers={"X-Session-Id": session_id},
    )
    assert order_resp.status_code == 200
    order_id = order_resp.json()["id"]

    # Mark paid directly in DB to bypass Stripe.
    order = db.query(Order).filter(Order.id == order_id).first()
    order.status = "paid"
    order.payment_status = "succeeded"
    order.assigned_depot_id = "demo-depot"
    db.commit()
    db.refresh(order)

    return order_id
