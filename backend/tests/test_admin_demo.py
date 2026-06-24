from src.models import Order, OrderStatus


def test_demo_advance_requires_admin_key(client, paid_order):
    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
    )
    assert resp.status_code == 401


def test_demo_advance_to_ready_for_pickup(client, paid_order):
    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
        headers={"X-Admin-Key": "test-admin-key"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == OrderStatus.READY_FOR_PICKUP.value
    assert data["handoff_coords"] is not None
    assert data["assigned_bot"] == "DeliveryBot-Demo"


def test_demo_advance_full_flow(client, paid_order, session_id):
    headers = {"X-Admin-Key": "test-admin-key"}

    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
        headers=headers,
    )
    assert resp.status_code == 200

    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "customer_arrived"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == OrderStatus.CUSTOMER_ARRIVED.value

    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "delivered"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == OrderStatus.DELIVERED.value
    assert resp.json()["delivered_at"] is not None

    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "completed"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == OrderStatus.COMPLETED.value


def test_demo_advance_cannot_go_backwards(client, paid_order):
    headers = {"X-Admin-Key": "test-admin-key"}
    client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "delivered"},
        headers=headers,
    )

    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
        headers=headers,
    )
    assert resp.status_code == 400
