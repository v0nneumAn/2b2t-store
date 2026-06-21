# 2b2t Store

Privacy-first online store for 2b2t in-game items. Customers order via website or Discord, pay with Monero, and receive delivery through an autonomous bot.

## Architecture

| Component | Tech | Host |
|-----------|------|------|
| Backend | Python/FastAPI | kanto dev / pve0 prod |
| Website | React + Vite + Tailwind | kanto dev / pve0 prod |
| Discord Bot | discord.py | kanto dev / pve0 prod |
| Delivery Bot | Mineflayer (Node) + Python agent | kanto dev / pve0 prod |
| Monero Node | `monerod` + `monero-wallet-rpc` (pruned) | pve1 LXC |
| Database | PostgreSQL 16 | Docker |
| Cache | Redis 7 | Docker |

## Quick Start

### 1. Start backend dependencies

```bash
cd docker
docker compose up -d
```

### 2. Seed products

Requires Python 3.12. On kanto (Python 3.14 default), use `uv`:

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

- Scaffold is built on kanto. Production deployment target is pve0.
- `$10 USD` minimum order enforced at checkout.
- 4-depot system planned; depot coords configured via admin API.

## Project Structure

```
2b2t-store/
├── backend/          FastAPI backend
├── web/              React storefront
├── discord-bot/      Discord cart bot
├── delivery-bot/     Mineflayer delivery worker
├── monero-node/      Docker compose for pve1
├── paper-server/     Local Paper test server scripts
└── docker/           Local dev compose
```
