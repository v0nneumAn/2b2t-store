# 2b2t Store — Session Context

> **Purpose:** Import this file into new Kimi sessions to resume work without re-explaining the project. Update it as decisions change.

## 1. Project Identity

| | |
|---|---|
| **Project** | 2b2t Store (also referred to as Shulker Shop) |
| **Description** | Privacy-first online store for 2b2t in-game items. Customers order via website or Discord, pay with Monero, and receive delivery through autonomous bots. |
| **Canonical repo** | `Shulker-Shop/skeleton_scaffold` |
| **Related repos** | `Shulker-Shop/backend`, `Shulker-Shop/advert-bot`, `Shulker-Shop/DeliveryPlugin`, `Shulker-Shop/Docker` |
| **Local path** | Project root |

## 2. Design Decisions (Locked In)

- **Payments:** Third-party provider (Stripe) to reduce friction, `$10 USD` minimum order. Monero integration deprioritized.
- **Delivery model:** EnderChest dead-drop near spawn. Bot never meets the customer directly.
- **Bot platform:** ZenithProxy + custom Java plugin. Mineflayer scaffold exists only for early prototyping.
- **Two-bot system:**
  - `DeliveryBot` — fills EnderChest, `/kill`s to spawn, drops items.
  - `DeliveryPearl` — pearls `DeliveryBot` back to stash after drop.
- **No custom Minecraft client.** ZenithProxy gives ViaVersion, queue handling, Baritone, and survival modules.
- **Database:** PostgreSQL. SQLite override still possible via `DATABASE_URL` env.
- **Backend:** Python/FastAPI + SQLAlchemy.
- **Web:** React + Vite + TypeScript + Tailwind.
- **Discord bot:** discord.py for cart, tickets, delivery notifications, customer confirmation.

## 3. Target EnderChest Delivery Workflow

1. `DeliveryBot` logs on.
2. Locates ordered items in stash chests and fills its EnderChest.
3. Executes `/kill` to return to spawn.
4. Pathfinds to the designated EnderChest handoff location near spawn.
5. Logs out, leaving items in the EnderChest.
6. Backend publishes `/kill` location to Discord ticket + website + optional email.
7. Customer travels to the location and confirms arrival via Discord ✅ reaction or website button.
8. Backend queues a drop job.
9. `DeliveryBot` logs on, retrieves items from EnderChest, drops them at a safe nearby point.
10. `DeliveryBot` signals `DeliveryPearl`.
11. `DeliveryPearl` pearls `DeliveryBot` back to stash.
12. `DeliveryBot` sets an enderpearl at stash for the next cycle.

See `docs/ARCHITECTURE.md` for the full living draft.

## 4. Repositories & Access

| Repo | Purpose | Access Status |
|------|---------|---------------|
| `Shulker-Shop/skeleton_scaffold` | Canonical monorepo/draft workspace (web, discord-bot, delivery-bot scaffold, docs) | Push via `origin` using project SSH host |
| `Shulker-Shop/DeliveryPlugin` | Java plugin for ZenithProxy | Read/write access verified |
| `Shulker-Shop/Docker` | Docker/deployment configs | Read/write access verified |

### SSH / Git setup

- Configure Git with the project identity before committing.
- Use a dedicated SSH key for the `Shulker-Shop` org; do not commit keys or personal account references.

## 5. Current Stack State

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (FastAPI) | ✅ Runs | PostgreSQL by default; SQLite dev override available |
| Database models | ✅ Defined | `Order`, `OrderItem`, `Product`, `Cart`, `Depot`, `DeliveryJob` |
| Web frontend | ✅ Builds | Home, Shop, Cart, Checkout, Order pages |
| Discord bot | ⚠️ Scaffolded | `.env.example` and README added; needs `DISCORD_TOKEN` |
| Delivery bot | ⚠️ Mineflayer scaffold | `executeJob()` is placeholder; target is ZenithProxy plugin |
| Monero node | ❌ Deprioritized | Third-party payments (Stripe) replace Monero for now |
| Paper test server | ✅ Ready | Paper 1.20.1 + GrimAC + Via suite downloaded locally |
| Advert bot | ⚠️ Skeleton built | ZenithProxy fake-conversation advert bot scaffolded |
| Admin auth | ❌ Missing | Admin routes are open |
| XMR/USD rate | ❌ Hardcoded | `$150` placeholder; needs CoinGecko or similar |

## 6. File Map

```
2b2t-store/
├── backend/              FastAPI + SQLAlchemy + SQLite/Postgres
│   ├── src/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── config.py
│   │   └── routes/       products, cart, orders, payments, admin, bot
│   ├── scripts/seed_products.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── web/                  React storefront
│   ├── src/App.tsx
│   └── src/pages/        Home, Shop, Cart, Checkout, Order
├── discord-bot/          discord.py scaffold
│   ├── src/bot.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── README.md
├── delivery-bot/         Temporary Mineflayer scaffold
│   ├── src/bot.js
│   ├── src/jobs.js
│   ├── src/agent.py
│   └── README.md
├── monero-node/          Docker compose for pruned Monero node
├── paper-server/         Local Paper 1.20.1 test server scripts
├── docker/               docker-compose.yml for backend deps
└── docs/
    ├── ARCHITECTURE.md   ZenithProxy + EnderChest draft
    └── CONTEXT.md        this file
```

## 7. Active TODO

- [x] **Decision:** Canonical repo is `Shulker-Shop/skeleton_scaffold`. Backend and advert-bot moved to standalone repos.
- [ ] **Backend:** Finish Monero integration (needs `monero-wallet-rpc` running).
- [ ] **Backend:** Replace hardcoded XMR/USD rate with live API.
- [ ] **Backend:** Add admin authentication.
- [ ] **Backend:** Add endpoints for EnderChest handoff location and customer arrival confirmation.
- [ ] **Discord bot:** Add `DISCORD_TOKEN` and implement ticket / delivery notification flow.
- [ ] **Web:** Add "I am at the location" confirmation button and live order status polling.
- [ ] **ZenithProxy plugin:** Start `DeliveryPlugin` skeleton (Gradle project, hook into ZenithProxy API).
- [ ] **ZenithProxy plugin:** Implement "fill EnderChest from chest" proof-of-concept.
- [ ] **Accounts:** Get `DeliveryBot` and `DeliveryPearl` Minecraft usernames.
- [ ] **Depots:** Get depot overworld coordinates and security design.
- [ ] **Test:** Run local Paper server and validate plugin/bot behavior.
- [ ] **Advert bot:** Finalize bot usernames, competitor names, and OpenAI key.
- [ ] **Advert bot:** Generate and approve first conversation scripts.
- [ ] **Advert bot:** Integrate real ZenithProxy plugin API once dependency is available.
- [ ] **Payments:** Evaluate Stripe integration for backend and checkout.
- [ ] **Deploy:** Set up dedicated host for pruned Monero node (deprioritized).

## 8. Key Technical Notes

- **Postgres alignment:** Backend config, models, Dockerfile, and `.env.example` are now consistent. Use `DATABASE_URL=sqlite:///./store.db` for local SQLite dev if Postgres isn't running.
- **Docker Compose:** `docker/docker-compose.yml` exists but `docker compose` is not installed on the dev host. Test on a machine with Docker Compose.
- **Queue survival:** ZenithProxy handles 2b2t queue natively; this is the main reason for the platform switch.
- **Anti-cheat:** GrimAC on local test server and 2b2t itself. Real client (ZenithProxy) is less suspicious than Mineflayer for production.
- **Safety:** Bot deaths expected. Random stash is safest; meetup is highest risk.

## 9. Open Questions

- How does `DeliveryPearl` get to stash? Always logged in? Separate perch?
- Is the two-login EnderChest workflow too slow given 2b2t queue times?
- How to handle multiple concurrent orders? Multiple `DeliveryBot` accounts or serialized?
- What is the `/kill` spawn location drift tolerance?
- Customer confirmation timeout? What if they never confirm?
- Large orders exceeding EnderChest 27-slot capacity — shulkers inside EnderChest?

## 10. Related Documents

- `docs/ARCHITECTURE.md` — full architecture draft
- `docs/GLOSSARY.md` — in-game and operational terminology
- `docs/ZENITHPROXY.md` — ZenithProxy plugin/channel research
- `Shulker-Shop/backend` — standalone backend service
- `Shulker-Shop/advert-bot` — standalone advert bot
- `advert-bot/README.md` — advert bot design and setup
- `delivery-bot/README.md` — note that Mineflayer bot is temporary scaffold
- `discord-bot/README.md` — Discord bot setup
- User uploaded plan: `2b2t-delivery-bot-plan_617a8c.md` — earlier Mineflayer-based design (superseded by ZenithProxy decision)
