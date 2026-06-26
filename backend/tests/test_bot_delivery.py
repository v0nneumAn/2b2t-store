from src.models import Depot, Order, OrderStatus
from src.services.delivery_queue import create_delivery_job


def test_handoff_requires_bot_key(client, paid_order):
    resp = client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "delivery-alpha",
        },
    )
    assert resp.status_code == 401


def test_handoff_invalid_coords(client, paid_order, bot_headers):
    resp = client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={"coords": {"foo": "bar"}, "bot_id": "delivery-alpha"},
        headers=bot_headers,
    )
    assert resp.status_code == 422


def test_handoff_from_paid(client, paid_order, bot_headers):
    resp = client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "delivery-alpha",
        },
        headers=bot_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == OrderStatus.READY_FOR_PICKUP.value
    assert data["assigned_bot"] == "delivery-alpha"


def test_dropped_from_customer_arrived(client, paid_order, session_id, bot_headers):
    client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "delivery-alpha",
        },
        headers=bot_headers,
    )
    client.post(
        f"/api/orders/{paid_order}/arrived",
        headers={"X-Session-Id": session_id},
    )

    resp = client.post(
        f"/api/bot/orders/{paid_order}/dropped",
        json={"proof": {"screenshot_url": "https://example.com/proof.png"}},
        headers=bot_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == OrderStatus.DELIVERED.value
    assert data["delivered_at"] is not None


def test_dropped_fails_from_ready_for_pickup(client, paid_order, bot_headers):
    client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "delivery-alpha",
        },
        headers=bot_headers,
    )

    resp = client.post(
        f"/api/bot/orders/{paid_order}/dropped",
        json={},
        headers=bot_headers,
    )
    assert resp.status_code == 400


def test_list_ready_orders(client, paid_order, db, bot_headers):
    order = db.query(Order).filter(Order.id == paid_order).first()
    order.status = "ready_for_pickup"
    order.customer_discord_id = "123456789"
    order.handoff_coords = {"x": 150, "y": 70, "z": -280, "dimension": "overworld"}
    db.commit()

    resp = client.get("/api/bot/orders/ready", headers=bot_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["orders"]) == 1
    assert data["orders"][0]["id"] == paid_order
    assert data["orders"][0]["customer_discord_id"] == "123456789"


def test_job_update_syncs_order_status(client, paid_order, db, bot_headers):
    depot = db.query(Depot).filter_by(id="demo-depot").first()
    order = db.query(Order).filter(Order.id == paid_order).first()
    job = create_delivery_job(db, order, depot)

    resp = client.post(
        f"/api/bot/jobs/{job.id}/claim",
        params={"bot_id": "delivery-alpha"},
        headers=bot_headers,
    )
    assert resp.status_code == 200

    resp = client.post(
        f"/api/bot/jobs/{job.id}/update",
        json={"status": "preparing"},
        headers=bot_headers,
    )
    assert resp.status_code == 200

    db.refresh(order)
    assert order.status == OrderStatus.PREPARING.value
