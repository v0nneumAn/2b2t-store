#!/usr/bin/env python3
"""
Simulated delivery bot for end-to-end demo testing.

This bot does NOT connect to Minecraft. It exercises the backend control plane
by polling for delivery jobs, claiming them, reporting handoff coordinates,
waiting for the customer to arrive, and finally reporting the drop.

Run locally or on the VM:
    BACKEND_URL=http://192.168.1.31:8000 BOT_API_KEY=xxx BOT_ID=delivery-alpha python scripts/sim_delivery_bot.py
"""

import os
import sys
import time

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
BOT_API_KEY = os.getenv("BOT_API_KEY")
BOT_ID = os.getenv("BOT_ID", "delivery-alpha")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))

if not BOT_API_KEY:
    raise RuntimeError("BOT_API_KEY env var is required")

HEADERS = {"X-Bot-Key": BOT_API_KEY}


def api_get(path: str):
    return httpx.get(f"{BACKEND_URL}{path}", headers=HEADERS, timeout=10)


def api_post(path: str, json: dict | None = None):
    return httpx.post(f"{BACKEND_URL}{path}", headers=HEADERS, json=json, timeout=10)


def next_job():
    resp = api_get("/api/bot/jobs/next")
    resp.raise_for_status()
    return resp.json().get("job")


def claim_job(job_id: str):
    resp = api_post(f"/api/bot/jobs/{job_id}/claim?bot_id={BOT_ID}")
    resp.raise_for_status()
    return resp.json()


def update_job(job_id: str, status: str, payload: dict | None = None):
    resp = api_post(f"/api/bot/jobs/{job_id}/update", {"status": status, "payload": payload or {}})
    resp.raise_for_status()
    return resp.json()


def report_handoff(order_id: str, coords: dict):
    resp = api_post(
        f"/api/orders/{order_id}/handoff",
        {"coords": coords, "bot_id": BOT_ID},
    )
    resp.raise_for_status()
    return resp.json()


def report_dropped(order_id: str):
    resp = api_post(f"/api/orders/{order_id}/dropped", {"proof": {"demo": True}})
    resp.raise_for_status()
    return resp.json()


def get_order(order_id: str):
    resp = api_get(f"/api/orders/{order_id}")
    resp.raise_for_status()
    return resp.json()


def run():
    print(f"[{BOT_ID}] Simulator started. Polling {BACKEND_URL} every {POLL_INTERVAL}s.")
    while True:
        try:
            job = next_job()
            if not job:
                time.sleep(POLL_INTERVAL)
                continue

            job_id = job["id"]
            order_id = job["order_id"]
            print(f"[{BOT_ID}] Found job {job_id} for order {order_id}. Claiming...")
            claim_job(job_id)
            print(f"[{BOT_ID}] Job {job_id} claimed.")

            # Simulate travel + preparation.
            time.sleep(3)
            update_job(job_id, "preparing")
            print(f"[{BOT_ID}] Status: preparing")

            time.sleep(3)
            update_job(job_id, "in_transit")
            print(f"[{BOT_ID}] Status: in_transit")

            # Report handoff coordinates.
            time.sleep(3)
            coords = {"x": 150, "y": 70, "z": -280, "dimension": "overworld"}
            handoff = report_handoff(order_id, coords)
            print(f"[{BOT_ID}] Handoff reported: {handoff['handoff_coords']}")
            print(f"[{BOT_ID}] Order status: {handoff['status']}")

            # Wait for customer to arrive.
            print(f"[{BOT_ID}] Waiting for customer arrival...")
            while True:
                time.sleep(POLL_INTERVAL)
                order = get_order(order_id)
                status = order.get("status")
                print(f"[{BOT_ID}] Order status: {status}")
                if status in ("customer_arrived", "dropping"):
                    break
                if status in ("delivered", "completed", "cancelled", "refunded"):
                    print(f"[{BOT_ID}] Order ended with status {status}. Resuming poll.")
                    break

            if order.get("status") in ("delivered", "completed", "cancelled", "refunded"):
                continue

            # Drop items.
            time.sleep(2)
            update_job(job_id, "dropping")
            print(f"[{BOT_ID}] Status: dropping")

            time.sleep(2)
            dropped = report_dropped(order_id)
            print(f"[{BOT_ID}] Drop reported. Order status: {dropped['status']}")

        except Exception as exc:
            print(f"[{BOT_ID}] Error: {exc}")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run()
