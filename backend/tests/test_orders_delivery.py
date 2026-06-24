from src.models import DeliveryJob, Order, OrderStatus


def test_get_order_includes_handoff_coords(client, paid_order, session_id):
    # Bot reports handoff coordinates.
    resp = client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "DeliveryBot-Alpha",
        },
        headers={"X-Bot-Key": "test-bot-key"},
    )
    assert resp.status_code == 200

    # Customer fetches order and sees handoff coords.
    resp = client.get(
        f"/api/orders/{paid_order}",
        headers={"X-Session-Id": session_id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == OrderStatus.READY_FOR_PICKUP.value
    assert data["handoff_coords"]["x"] == 150
    assert data["assigned_bot"] == "DeliveryBot-Alpha"


def test_confirm_arrival_creates_drop_job(client, paid_order, session_id, db):
    # Move order to ready_for_pickup.
    client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "DeliveryBot-Alpha",
        },
        headers={"X-Bot-Key": "test-bot-key"},
    )

    # Customer confirms arrival.
    resp = client.post(
        f"/api/orders/{paid_order}/arrived",
        headers={"X-Session-Id": session_id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == OrderStatus.CUSTOMER_ARRIVED.value
    assert data["customer_arrived_at"] is not None

    # A drop job should exist.
    drop_jobs = (
        db.query(DeliveryJob)
        .filter(DeliveryJob.order_id == paid_order, DeliveryJob.job_type == "drop")
        .all()
    )
    assert len(drop_jobs) == 1
    assert drop_jobs[0].status == "queued"


def test_confirm_arrival_fails_when_not_ready_for_pickup(client, paid_order, session_id):
    # Order is still "paid", so arrival confirmation should fail.
    resp = client.post(
        f"/api/orders/{paid_order}/arrived",
        headers={"X-Session-Id": session_id},
    )
    assert resp.status_code == 400
    assert "not ready for pickup" in resp.json()["detail"].lower()


def test_confirm_arrival_requires_session_ownership(client, paid_order):
    resp = client.post(
        f"/api/orders/{paid_order}/arrived",
        headers={"X-Session-Id": "wrong-session"},
    )
    assert resp.status_code == 404


def test_arrival_is_idempotent(client, paid_order, session_id, db):
    client.post(
        f"/api/bot/orders/{paid_order}/handoff",
        json={
            "coords": {"x": 150, "y": 70, "z": -280, "dimension": "overworld"},
            "bot_id": "DeliveryBot-Alpha",
        },
        headers={"X-Bot-Key": "test-bot-key"},
    )

    resp1 = client.post(
        f"/api/orders/{paid_order}/arrived",
        headers={"X-Session-Id": session_id},
    )
    resp2 = client.post(
        f"/api/orders/{paid_order}/arrived",
        headers={"X-Session-Id": session_id},
    )
    # Second call should fail because status is no longer ready_for_pickup.
    assert resp1.status_code == 200
    assert resp2.status_code == 400

    # Exactly one drop job should be created.
    drop_jobs = (
        db.query(DeliveryJob)
        .filter(DeliveryJob.order_id == paid_order, DeliveryJob.job_type == "drop")
        .all()
    )
    assert len(drop_jobs) == 1
