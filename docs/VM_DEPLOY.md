# VM Deployment Guide

Run the entire 2b2t Store on a Tailscale-connected VM and access it from your tailnet and local LAN.

This guide uses the example domain `shulker.shop` and Tailscale hostname `shulker-shop`. Replace these with your own domain/hostname as needed.

## Overview

| Host | Role | Access |
|------|------|--------|
| VM | Runs backend, web frontend, Discord bot, Postgres, Redis | Tailscale + LAN |
| Personal machine / partners | Browser + remote management | Tailscale client or LAN DNS |

## 1. Prepare the VM

### Requirements
- Ubuntu 24.04 LTS (or similar)
- Docker + Docker Compose
- Tailscale installed and logged in
- This repo cloned at `/opt/2b2t-store` (or any path you prefer)

### Install Docker

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# log out and back in
```

### Install Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Set the VM's Tailscale hostname (e.g., `shulker-shop`):

```bash
sudo tailscale up --hostname=shulker-shop --advertise-tags=tag:store-server --reset
```

## 2. Configure environment

```bash
cd /opt/2b2t-store/docker
cp .env.vm.example .env.vm
nano .env.vm
```

Required values:
- `POSTGRES_PASSWORD`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `BOT_API_KEY`, `ADMIN_API_KEY`
- `DISCORD_TOKEN`, `GUILD_ID`
- `FRONTEND_URL` — set to `http://shulker.shop`
- `CORS_ORIGINS` — include `http://shulker.shop` and any local dev origins

Generate strong keys:

```bash
openssl rand -hex 32
openssl rand -hex 16
```

## 3. Build and start

```bash
cd /opt/2b2t-store/docker
docker compose -f docker-compose.yml -f docker-compose.vm.yml --env-file .env.vm up -d --build
```

The base compose file does **not** publish host ports. The Cloudflare tunnel service
reaches Nginx directly over the Docker network, so no public ports are required.

This starts:
- Backend on VM port `8000`
- Web frontend on VM port `80`
- Discord bot
- Postgres + Redis

## 4. Seed data

```bash
docker exec store-backend python scripts/seed_demo.py
```

For advert-bot testing you can also run:

```bash
docker exec store-backend python scripts/seed_advert_test.py
```

## 5. Access from your personal machine

### Tailscale (remote partners)

```text
https://shulker-shop.<tailnet>.ts.net
```

Admin interface:

```text
https://shulker-shop.<tailnet>.ts.net/admin
```

### LAN / local DNS

If you run a local DNS resolver (e.g., Pi-hole), add a record for `shulker.shop` pointing to the VM's LAN IP:

```text
shulker.shop → 192.168.1.31
```

Then access:

```text
http://shulker.shop
http://shulker.shop/admin
http://shulker.shop:8000/health
```

## 6. View logs

```bash
cd /opt/2b2t-store/docker
docker compose -f docker-compose.yml -f docker-compose.vm.yml --env-file .env.vm logs -f
```

Per-service:

```bash
docker logs -f store-backend
docker logs -f store-web
docker logs -f store-discord-bot
```

## 7. Updates

When you push new code to GitHub on the VM:

```bash
cd /opt/2b2t-store
git pull origin main
cd docker
docker compose -f docker-compose.yml -f docker-compose.vm.yml --env-file .env.vm up -d --build
```

For local development (exposes ports 8000, 5173 and 25565):

```bash
cd /path/to/2b2t-store/docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## 8. Firewall notes

If the VM has `ufw` enabled, allow the Tailscale interface rather than public ports:

```bash
sudo ufw allow in on tailscale0
```

Do **not** expose ports 80/8000 to the public internet unless you also want public access. Tailscale provides the private path.

## 9. Public access (optional)

If you want the shop reachable from the public internet, use Tailscale Funnel on the VM:

```bash
sudo tailscale funnel --bg 80
```

This exposes the web frontend on `https://shulker-shop.<tailnet>.ts.net`.

To remove public access:

```bash
sudo tailscale funnel --bg off
```

## 10. Backups

Postgres data lives in the `store_postgres-data` Docker volume. Back it up with:

```bash
docker exec store-postgres pg_dump -U store store > backup-$(date +%F).sql
```
