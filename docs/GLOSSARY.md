# 2b2t Store Glossary

Quick reference for in-game and operational terms used by the project.

## Delivery Terms

| Term | Quick Definition | Notes |
|------|------------------|-------|
| **Pickup** | Customer meets the bot at spawn to receive items. | Alternative to EnderChest dead-drop. Higher risk — player and bot are in the same place. |
| **Man dev** | A player manually fills their EnderChest, `/kill`s to spawn, and delivers by hand. | The manual process the bot is replacing. |
| **EnderChest dead-drop** | Bot leaves items in an EnderChest near spawn; customer retrieves them after confirming arrival. | Current target design. Bot never meets the customer. |
| **Pearl bot** | Account that teleports players back to base using enderpearls + trapdoors. | Same role as `DeliveryPearl`. Closing a trapdoor forces the pearl down, triggering the teleport. |

## Stock & Measurement

| Term | Quick Definition | Notes |
|------|------------------|-------|
| **Dub** | One double chest of shulker boxes. | Common stock unit; e.g., "3 dubs of kits." |

## Travel & Movement

| Term | Quick Definition | Notes |
|------|------------------|-------|
| **Spawn** | The central spawn region, roughly 4,000 × 4,000 blocks (2,000 blocks in each cardinal direction). | Handoff locations must be chosen inside or just outside this zone. |
| **Ring road** | Roads in the Nether that connect major highways. | Less traveled and less griefed than main highways. Safer route for customers. |
| **Ebounce** | Elytra flight exploit that bobs up and down to gain speed in vanilla. | Common fast travel method for customers reaching spawn. |

## Project Roles

| Term | Quick Definition | Notes |
|------|------------------|-------|
| **DeliveryBot** | Main worker account. Fills EnderChest, travels to spawn, drops items. | Runs ZenithProxy + store plugin. |
| **DeliveryPearl** | Secondary account that pearls `DeliveryBot` back to stash after a drop. | Same concept as a pearl bot. |
