# Discord Bot

Cart, tickets, and delivery notifications for the 2b2t store.

## Setup

1. Create a new Discord application + bot at https://discord.com/developers/applications
2. Copy the bot token
3. Invite the bot to your server with `bot` and `applications.commands` scopes
4. Copy this file to `.env` and fill in your values:

```bash
cp .env.example .env
```

5. Install dependencies and run:

```bash
cd discord-bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/bot.py
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `BACKEND_URL` | URL of the FastAPI backend |
| `GUILD_ID` | Discord server ID for slash command registration |

## Current slash commands

- `/shop` — Browse products
- `/cart_add <product_id> [quantity]` — Add item to cart
- `/cart_checkout` — Checkout cart
- `/order_status <order_id>` — Check order status
