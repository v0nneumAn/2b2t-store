# 2b2t Store

Privacy-first online store for 2b2t in-game items. Customers order via website or Discord, pay with Monero, and receive delivery through an autonomous bot.

## Architecture

> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full living draft.

High-level plan:

| Component | Tech | Host |
|-----------|------|------|
| Backend | Python / FastAPI / SQLAlchemy / SQLite | dev host / pve0 prod |
| Website | React + Vite + Tailwind | dev host / pve0 prod |
| Discord Bot | discord.py | dev host / pve0 prod |
| DeliveryBot | ZenithProxy + custom Java plugin | pve0 / bot host |
| DeliveryPearl | ZenithProxy alt | pve0 / bot host |
| Monero Node | `monerod` + `monero-wallet-rpc` (pruned) | pve1 LXC |
| Test Server | Paper 1.20.1 + GrimAC + Via suite | dev host |

### Delivery model

The target workflow uses an **EnderChest dead-drop** near spawn:

1. `DeliveryBot` fills its EnderChest at stash, `/kill`s to spawn, and logs out.
2. Customer receives the `/kill` location via Discord ticket and website.
3. Customer confirms arrival with a Discord reaction or website button.
4. `DeliveryBot` logs back in, pulls items from the EnderChest, and drops them.
5. `DeliveryPearl` pearls `DeliveryBot` back to stash to reset for the next order.

The existing `delivery-bot/` directory is a temporary Mineflayer scaffold for early prototyping.

## Quick Start

### 1. Start backend dependencies

```bash
cd docker
docker compose up -d
```

### 2. Seed products

Requires Python 3.12. If the dev host has a newer default Python, use `uv`:

```bash
cd backend
uv venv --python 3.12
source .venv/bin/activate
uv pip install -r requirements.txt
python scripts/seed_products.py
```

### 3. Run backend

```bash
cd backend
uvicorn src.main:app --reload
```

### 4. Run web frontend

```bash
cd web
npm install
npm run dev
```

### 5. Set up local Paper test server

```bash
cd paper-server/scripts
./setup-paper-server.sh
./start-paper-server.sh
```

### 6. Run delivery bot (against test server)

```bash
cd delivery-bot
npm install
# Edit config.json for localhost test server
npm run dev
```

## Monero Node (pve1)

The pruned Monero node runs on pve1. See `monero-node/docker-compose.yml`.

1. Create wallet file and `wallet_password.txt`.
2. Deploy compose on pve1 LXC.
3. Wait for sync.
4. Point backend `MONERO_WALLET_RPC_URL` to pve1.

## Development Notes

- Scaffold is built on the dev host. Production deployment target is pve0.
- `$10 USD` minimum order enforced at checkout.
- 4-depot system planned; depot coords configured via admin API.

## Project Structure

```
2b2t-store/
├── backend/          FastAPI backend
├── web/              React storefront
├── discord-bot/      Discord cart bot
├── delivery-bot/     Temporary Mineflayer scaffold (target: ZenithProxy plugin)
├── docs/             Architecture drafts and design notes
├── monero-node/      Docker compose for pve1
├── paper-server/     Local Paper test server scripts
└── docker/           Local dev compose
```
