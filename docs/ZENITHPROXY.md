# ZenithProxy Findings

Research from https://wiki.2b2t.vc/ and the example plugin repo.

## Release Channels: Plugins Require `java` Channel

ZenithProxy has two platform channels:

| Channel | Works on Linux | Plugins | Memory | Notes |
|---------|---------------|---------|--------|-------|
| `java` | ✅ Yes | ✅ Yes | ~300 MB | Default. Works on all systems. |
| `linux` | ✅ Yes | ❌ No | ~200 MB | Native Linux x64 binary. Faster startup, lower RAM, **no plugin support**. |

To use plugins on a Linux host we **must run the `java` channel**, not the `linux` channel.

```
channel set java 1.21.4
```

Check current channel with `status`.

## Plugin Architecture

- Plugins are **Java-only** JARs placed in the `plugins/` folder next to the launcher.
- No hot reload — restart ZenithProxy to load plugins.
- A plugin implements `ZenithProxyPlugin` and uses the `@Plugin` annotation for metadata.
- Plugins register custom **modules** and **commands** through a `PluginAPI` object.
- Example/template: https://github.com/rfresh2/ZenithProxyExamplePlugin
- JavaDocs: https://maven.2b2t.vc/javadoc/releases/com/zenith/ZenithProxy/1.21.4-SNAPSHOT

### Why we need our own plugin

ZenithProxy does not reuse existing Minecraft mods or server plugins — it operates at the packet layer and has its own module/command API. No public plugin implements our store-specific delivery workflow (backend job queue, EnderChest dead-drop, stash reset). We must write a custom plugin for `DeliveryBot` logic.

## Built-In Features Useful for Delivery

These can be used directly or driven by our plugin:

| Feature | Command / Module | Use Case |
|---------|------------------|----------|
| Pathfinding | `pathfinder goto <x> <y> <z>` / alias `b` | Travel between stash, spawn, EnderChest, drop point. |
| Block interaction | `pathfinder click <left/right> <x> <y> <z>` | Open chests / EnderChest. |
| Inventory | `inventory ...` family | Move items, withdraw/deposit, drop items. |
| Click simulation | `click left` / `click right` | Drop items, press buttons, throw pearls. |
| Pearl loader | `pearlLoader add/load <id> <x> <y> <z>` | Teleport back to stash via trapdoor-pearl mechanic. |
| Scheduler | `tasks add ...` | Run commands after delays or events (connect, death, etc.). |
| Survival | `autoEat`, `autoTotem`, `autoRespawn` | Keep bot alive during delivery. |
| Safety | `autoDisconnect` | Log out on low health, unknown players, totem pop, thunder. |
| Visual range | `visualRange` | Alert when players are near the handoff area. |
| Chat / Discord | `chatRelay`, `discord` | Notifications and relay for delivery events. |

## Delivery Workflow Mapping

Rough mapping of our EnderChest workflow to ZenithProxy capabilities:

1. **Fill EnderChest from stash chests** — `pathfinder click` chest + `inventory` move commands.
2. **Execute `/kill`** — `sendMessage /kill`.
3. **Path to handoff EnderChest** — `pathfinder goto`.
4. **Log out and wait** — `disconnect` or `shutdown`.
5. **Customer arrival signal** — our plugin polls backend or receives HTTP callback.
6. **Log in, retrieve items** — `pathfinder click` EnderChest + `inventory` move.
7. **Drop items** — `inventory drop` or `click` to throw.
8. **Teleport back to stash** — `pearlLoader load <stash-pearl>` or chat-triggered `DeliveryPearl`.

## Open Questions

- Can the plugin issue terminal commands programmatically, or does it need to use the internal module API directly?
- How does the plugin maintain state across reconnects (queue, disconnect, respawn)?
- Should `DeliveryPearl` be a second ZenithProxy instance or a module inside the same `DeliveryBot` instance?
