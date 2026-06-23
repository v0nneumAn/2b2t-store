# Security & Deployment Guide

This document covers the minimum steps required to run the 2b2t Store demo securely in a public-facing environment.

## Environment variables

Copy the example files and fill in strong, unique values:

```bash
cp backend/.env.example backend/.env
cp discord-bot/.env.example discord-bot/.env
```

Generate strong keys:

```bash
openssl rand -hex 32   # use for ADMIN_API_KEY and BOT_API_KEY
openssl rand -hex 16   # use for POSTGRES_PASSWORD
```

Required variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret |
| `BOT_API_KEY` | Shared secret for advert/delivery bots |
| `ADMIN_API_KEY` | Secret for `/api/admin/*` routes |
| `FRONTEND_URL` | Public URL used for Stripe redirects |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |

## Before going live checklist

- [ ] All secrets are strong, unique, and not committed to git.
- [ ] Admin API key is required on all `/api/admin/*` endpoints.
- [ ] Bot API key uses constant-time comparison (`hmac.compare_digest`).
- [ ] Stripe webhook verifies signature, amount, currency, and payment status.
- [ ] Stripe event IDs are de-duplicated (idempotency).
- [ ] Order/cart lookups require matching `X-Session-Id` header.
- [ ] CORS origins are explicit; credentials are not sent to `*`.
- [ ] Rate limiting is enabled on checkout, webhook, admin, and order endpoints.
- [ ] Security headers (CSP, HSTS, X-Frame-Options, etc.) are emitted by nginx/reverse proxy.
- [ ] Database and Redis ports are not exposed to the host (internal Docker network only).
- [ ] Backend container runs as a non-root user.
- [ ] Domain is behind Cloudflare (or similar) with WAF and DDoS protection.
- [ ] Origin server IP is not exposed in DNS, headers, or repository history.
- [ ] Minecraft game server is hosted separately from the shop; real IP is hidden behind a proxy.
- [ ] Automated encrypted database backups are configured and tested.
- [ ] Logging/monitoring is in place for 5xx errors, webhook failures, and admin access.

## Stripe webhook setup

1. Create a Stripe webhook endpoint pointing to `https://yourdomain.com/api/payments/webhook`.
2. Select the event `checkout.session.completed`.
3. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Ensure the endpoint returns `200 OK` for valid events (even duplicates).

## Admin usage

All admin routes are under `/api/admin/*` and require the header:

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" https://yourdomain.com/api/admin/orders
```

## Bot usage

Bot routes require the header:

```bash
curl -H "X-Bot-Key: $BOT_API_KEY" https://yourdomain.com/api/bot/jobs/next
```

## Incident response quick reference

- **DDoS:** Enable Cloudflare "Under Attack" mode; scale containers; review rate-limit logs.
- **Suspected secret leak:** Rotate `ADMIN_API_KEY`, `BOT_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `POSTGRES_PASSWORD` immediately.
- **Webhook abuse:** Check Stripe dashboard for failed signature events; verify endpoint only accepts events from Stripe IPs if possible.
