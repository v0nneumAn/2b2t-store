# 2b2t Store Architecture Draft

> **Status:** Living draft. Nothing here is set in stone. This document captures the current best-guess design. Expect parts to change as we prototype, test, and learn.

## Overview

Privacy-first online store for 2b2t in-game items. Customers order via website or Discord, pay with Stripe, and receive delivery through an autonomous bot network.

## Design Philosophy

- **ZenithProxy-first:** The in-world bot layer runs on [ZenithProxy](https://github.com/rfresh2/ZenithProxy) with a custom Java plugin for store-specific logic. ZenithProxy gives us ViaVersion, 2b2t queue handling, Baritone pathfinding, and survival modules (AutoTotem, AutoRespawn, AutoEat) out of the box. Plugins only work on the `java` release channel, so the bot host must use that channel even if it runs Linux.
- **Two-bot system:** `DeliveryBot` executes deliveries. `DeliveryPearl` exists only to pearl `DeliveryBot` back to stash after a drop.
- **EnderChest dead-drop:** The delivery handoff happens through an EnderChest near spawn. The customer travels to a `/kill` location, confirms presence, and the bot drops items nearby.
- **Iterate quickly:** The existing Mineflayer scaffold in `delivery-bot/` stays for early prototyping, but the target runtime is ZenithProxy.

## Components

| Component | Tech | Purpose | Host |
|-----------|------|---------|------|
| Backend | Python / FastAPI / SQLAlchemy / SQLite | Orders, payments, jobs, admin API | dev host / prod host |
| Website | React + Vite + TypeScript + Tailwind | Storefront, cart, checkout, order status | dev host / prod host |
| Discord Bot | discord.py | Cart, tickets, delivery notifications, customer confirmation | dev host / prod host |
| DeliveryBot | ZenithProxy + custom Java plugin | In-world delivery executor | prod host / dedicated bot host |
| DeliveryPearl | ZenithProxy or alt account | Pearls DeliveryBot back to stash | prod host / dedicated bot host |
| Payment Provider | Stripe Checkout | Card payment processing | Stripe |
| Advert Bot | ZenithProxy + custom Java plugin | Fake-conversation advertising in 2b2t chat | prod host / bot host |
| Test Server | Paper 1.20.1 + GrimAC + Via suite | Local delivery simulation | dev host |

## EnderChest Delivery Workflow

### Phase 1 — Preparation at stash

1. `DeliveryBot` logs on.
2. `DeliveryBot` locates ordered items in stash chests and fills its EnderChest.
3. `DeliveryBot` executes `/kill` to return to spawn.
4. `DeliveryBot` pathfinds to the designated EnderChest handoff location near spawn.
5. `DeliveryBot` logs out, leaving items safely in the EnderChest.

### Phase 2 — Notify customer

6. `DeliveryBot` (via plugin) reports its `/kill` location to the backend.
7. Backend creates/updates the order with the handoff coordinates.
8. Discord bot posts the location inside the customer's shop ticket.
9. Website order page updates with the handoff coordinates.
10. Optional: email notification sent.

### Phase 3 — Customer arrival

11. Customer travels to the `/kill` location shown in Discord / on the website.
12. Customer confirms presence by either:
    - Reacting with ✅ to the Discord message, or
    - Pressing the "I am at the location" button on the website.

### Phase 4 — Drop

13. Backend marks the order as `customer_arrived` and queues a drop job.
14. `DeliveryBot` logs on.
15. `DeliveryBot` pathfinds to the EnderChest, retrieves the items.
16. `DeliveryBot` moves to a safe nearby drop point and drops the items.
17. `DeliveryBot` reports `dropped` to the backend.

### Phase 5 — Escape and reset

18. `DeliveryBot` signals `DeliveryPearl` that the drop is complete.
19. `DeliveryPearl` pearls `DeliveryBot` back to the main stash.
20. `DeliveryBot` sets an enderpearl at stash for the next cycle.
21. Backend marks order as `completed`.

## Bot Roles

### DeliveryBot

- Primary worker account.
- Holds stock, fills EnderChest, travels to spawn, drops items.
- Runs ZenithProxy + store plugin.
- Must survive spawn and handoff area.

### DeliveryPearl

- Secondary account.
- Only job is to throw enderpearls at `DeliveryBot` to teleport it back to stash.
- May remain logged off until needed, or stay in a safe perch.
- Could also be a ZenithProxy instance or a simple alt controlled by the plugin.

## Plugin Development Notes

See `docs/ZENITHPROXY.md` for release-channel constraints and built-in commands useful for delivery.

The custom ZenithProxy plugin needs to handle:

- Polling the backend job queue.
- Inventory management: find items in chests, move to EnderChest, retrieve from EnderChest, drop items.
- Chat coordination with `DeliveryPearl`.
- Baritone pathfinding to coords / EnderChest / drop point.
- `/kill` execution and respawn handling.
- Survival modules: AutoTotem, AutoEat, AutoRespawn, AutoDisconnect on danger.
- Logging state changes back to backend via HTTP.

## Backend Job States

| State | Meaning |
|-------|---------|
| `awaiting_payment` | Awaiting Stripe Checkout completion |
| `paid` | Payment confirmed, ready for bot |
| `preparing` | Bot filling EnderChest |
| `ready_for_pickup` | `/kill` location published, awaiting customer |
| `customer_arrived` | Customer confirmed presence |
| `dropping` | Bot retrieving items and dropping |
| `completed` | Customer presumably collected items |
| `failed` | Something went wrong, needs admin |

## Communication Flow

```
Customer ──► Website / Discord ──► Backend
                                    │
                                    ▼
                              DeliveryBot Plugin
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               ZenithProxy      Baritone        2b2t server
               modules          pathfinding
                    │
                    ▼
              DeliveryPearl
```

## Payments

Stripe Checkout handles card payments.

1. Customer submits the checkout form.
2. Backend creates an `Order` in `awaiting_payment` state.
3. Backend creates a Stripe Checkout Session for the order total.
4. Frontend redirects the customer to Stripe.
5. Stripe notifies the backend via webhook (`checkout.session.completed`).
6. Backend marks the order `paid` and creates a delivery job.

## Open Questions / Risks

- **Queue timing:** Logging on/off on 2b2t can take minutes. Is the two-login workflow too slow?
- **EnderChest capacity:** Only 27 slots. Large orders may need multiple trips or shulkers inside the EnderChest.
- **Kill location safety:** The `/kill` spawn point can change. Need to verify location before logging out.
- **Griefing / camping:** Players may camp the handoff location. Randomize drop point? Trusted-customer whitelist?
- **DeliveryPearl logistics:** How does `DeliveryPearl` get to stash? Is it always logged in? What if it dies?
- **Multiple concurrent orders:** Do we serialize deliveries per bot, or run multiple `DeliveryBot` accounts?
- **Anti-cheat:** GrimAC may flag repeated `/kill`/respawn, fast inventory actions, or Baritone movement. Needs testing.
- **Customer confirmation timeout:** How long do we wait? What happens if they never confirm?
- **Item despawn:** Dropped items despawn after 5 minutes. Customer must be close and ready.

## Advert Bot

The advert bot runs as 2–3 dedicated ZenithProxy alts that simulate a natural conversation in 2b2t public chat every ~45 minutes. One participant subtly promotes the shop (`shulker.shop`) over a rival shop. The URL is only whispered when asked. Conversations are AI-generated, reviewed, and served by the backend scheduler. See `advert-bot/README.md` for details.

## Migration from Mineflayer Scaffold

The existing `delivery-bot/` directory is a Mineflayer/Node scaffold used to test:

- Backend job queue integration.
- Basic chat/inventory logic.
- Local Paper server connectivity.

It will be replaced or wrapped by the ZenithProxy plugin. Keep it until the ZenithProxy plugin can:

1. Connect to the local Paper server.
2. Claim a job from the backend.
3. Move, open chests, and interact with inventory.

## Next Steps

1. Set up a local ZenithProxy instance against the Paper test server.
2. Create the plugin skeleton (Gradle project, hook into ZenithProxy API).
3. Implement "fill EnderChest from chest" as the first plugin proof-of-concept.
4. Add backend endpoints for `/kill` location reporting and customer arrival confirmation.
5. Wire Discord bot to publish handoff location and accept ✅ reaction.
6. Add website "I am here" button.
