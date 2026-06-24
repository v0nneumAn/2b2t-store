# Public Demo Runbook

This guide walks through running the 2b2t Store public demo locally using Stripe test mode and the admin demo-advance endpoint to simulate the ZenithProxy delivery bot.

For demos with a real ZenithProxy instance, see the [ZenithProxy Web API](#zenithproxy-web-api) section below.

## Prerequisites

- Python 3.12 and a backend virtual environment (see `backend/README.md`).
- Node.js 20+ for the web frontend.
- Stripe account with test API keys.
- (Optional) Discord bot token for Discord confirmation channel.
- (Optional) ZenithProxy with the [ZenithProxyWebAPI](https://github.com/rfresh2/ZenithProxyWebAPI) plugin for real bot control.

## 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=sqlite:///./dev_store.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BOT_API_KEY=$(openssl rand -hex 32)
ADMIN_API_KEY=$(openssl rand -hex 32)
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

## 2. Apply database migration

If you have an existing dev DB, add the new columns:

```bash
cd backend
source .venv/bin/activate
python scripts/migrate_add_handoff.py
```

Alternatively, delete `dev_store.db` and let the app recreate it on startup.

## 3. Seed demo data

```bash
cd backend
source .venv/bin/activate
python scripts/seed_demo.py
```

## 4. Start backend

```bash
cd backend
source .venv/bin/activate
uvicorn src.main:app --reload
```

## 5. Start web frontend

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173.

## 6. Place an order

1. Add **2b2t Starter Kit** to cart.
2. Open cart and click **Proceed to Checkout**.
3. Enter a Minecraft username and email.
4. Click **Complete Order**.
5. Use Stripe test card:
   - Number: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
6. You are redirected back to the order status page.

## 7. Simulate bot handoff (admin demo endpoint)

```bash
export ADMIN_API_KEY=<from .env>
export ORDER_ID=<order id from browser URL>

curl -X POST "http://localhost:8000/api/admin/orders/${ORDER_ID}/demo-advance" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -d '{"to": "ready_for_pickup"}'
```

The order page should update within ~10 seconds (or on refresh) to show:
- Status: **Ready for pickup**
- Handoff coordinates
- Delivery timeline
- **"I am at the location"** button

## 8. Confirm customer arrival

Either:

- Click **"I am at the location"** on the website, or
- React ✅ to the Discord DM (if Discord bot is running and `customer_discord_id` was set).

## 9. Simulate remaining bot steps

```bash
# Bot is dropping items
curl -X POST "http://localhost:8000/api/admin/orders/${ORDER_ID}/demo-advance" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -d '{"to": "dropping"}'

# Items dropped
curl -X POST "http://localhost:8000/api/admin/orders/${ORDER_ID}/demo-advance" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -d '{"to": "delivered"}'

# Completed
curl -X POST "http://localhost:8000/api/admin/orders/${ORDER_ID}/demo-advance" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -d '{"to": "completed"}'
```

The order page should show the completed timeline.

## 10. Expected final timeline

- ✅ Payment received
- ✅ Bot preparing EnderChest
- ✅ Ready for pickup at `150, 70, -280`
- ✅ You arrived
- ✅ Bot dropping items
- ✅ Items dropped
- ✅ Completed

---

## ZenithProxy Web API

If you have a real ZenithProxy delivery bot running with the [ZenithProxyWebAPI](https://github.com/rfresh2/ZenithProxyWebAPI) plugin, you can send commands to it directly from the backend.

### Configure ZenithProxy

In ZenithProxy console:

```
webApi auth <strong-random-token>
webApi port 8080
webApi on
```

Note the auth token.

### Configure backend

Edit `backend/.env`:

```
ZENITH_WEB_API_URL=http://localhost:8080
ZENITH_WEB_API_TOKEN=<token-from-zenith>
```

Or store per-bot config by registering a bot:

```bash
curl -X POST "http://localhost:8000/api/bots" \
  -H "Content-Type: application/json" \
  -H "X-Bot-Key: ${BOT_API_KEY}" \
  -d '{
    "id": "delivery-alpha",
    "role": "delivery-alpha",
    "bot_type": "delivery",
    "config": {
      "web_api": {"url": "http://localhost:8080", "token": "<token>"}
    }
  }'
```

### Send test commands

```bash
curl -X POST "http://localhost:8000/api/bots/delivery-alpha/zenith/command" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -d '{"command": "status"}'
```

Useful commands for delivery:

- `status` — bot status, health, coords
- `pathfinder goto <x> <y> <z>` — travel
- `pathfinder click right <x> <y> <z>` — open chest/EnderChest
- `inventory` — inventory management
- `sendMessage /kill` — return to spawn
- `disconnect` — log out

The backend can now be extended to automatically map delivery jobs to these commands. For the scripted demo, the `demo-advance` endpoint remains the simplest path.

---

## Troubleshooting

### Order page shows old status

The page polls every 10 seconds. Refresh manually if needed.

### `sqlite3.OperationalError: no such column: handoff_coords`

Run the migration script again or delete the DB file and re-seed.

### Stripe webhook not firing locally

The demo uses the admin demo-advance endpoint instead of waiting for webhooks, so local webhook setup is not required for the delivery simulation. Payment still requires Stripe Checkout to succeed.

### Discord bot not sending DMs

Ensure `BOT_API_KEY` matches backend `BOT_API_KEY` and the order has a `customer_discord_id`. For web orders, Discord ID is not captured; use `/cart_checkout_id` from Discord to link an order to a Discord user.

### ZenithProxy command returns 401

The `Authorization` header must match the token set with `webApi auth <token>` in ZenithProxy.
