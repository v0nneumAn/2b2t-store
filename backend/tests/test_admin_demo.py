from src.models import Order, OrderStatus


def test_demo_advance_requires_auth(client, paid_order):
    resp = client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
    )
    assert resp.status_code == 401


def test_demo_advance_to_ready_for_pickup(admin_client, paid_order):
    resp = admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == OrderStatus.READY_FOR_PICKUP.value
    assert data["handoff_coords"] is not None
    assert data["assigned_bot"] == "DeliveryBot-Demo"


def test_demo_advance_full_flow(admin_client, paid_order, session_id):
    resp = admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
    )
    assert resp.status_code == 200

    resp = admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "customer_arrived"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == OrderStatus.CUSTOMER_ARRIVED.value

    resp = admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "delivered"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == OrderStatus.DELIVERED.value
    assert resp.json()["delivered_at"] is not None

    resp = admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "completed"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == OrderStatus.COMPLETED.value


def test_demo_advance_cannot_go_backwards(admin_client, paid_order):
    admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "delivered"},
    )

    resp = admin_client.post(
        f"/api/admin/orders/{paid_order}/demo-advance",
        json={"to": "ready_for_pickup"},
    )
    assert resp.status_code == 400
