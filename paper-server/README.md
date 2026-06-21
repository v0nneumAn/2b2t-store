# 2b2t-like Paper Test Server

Local Minecraft server for testing the delivery bot. Configured to mimic the 2b2t anarchy environment as closely as possible using publicly available plugins.

## What's installed

| Plugin | Purpose |
|--------|---------|
| **Paper 1.20.1** | Server software matching the bot's target version |
| **GrimAC** | Predictive anti-cheat (the modern standard for anarchy-style servers) |
| **ViaVersion** | Allows newer clients to connect |
| **ViaBackwards** | Allows older clients to connect |
| **ViaRewind** | Allows 1.8/1.9-style clients to connect |
| **ProtocolLib** | Packet library used by many plugins |

## Server settings

- `online-mode=false` — bots can connect in offline mode
- `spawn-protection=0` — no protected spawn area
- `difficulty=hard`
- `pvp=true`
- `max-world-size=29999984` — matches Minecraft's max world size
- `allow-flight=false` — standard anarchy (flight = cheat)

## Setup

```bash
cd paper-server/scripts
./setup-paper-server.sh
```

The script downloads Paper, the plugins, and writes `server.properties`.

## Start

```bash
cd paper-server/server
./start.sh
```

Server will be available at `localhost:25565`.

## Notes

- The `server/` directory is gitignored. Each developer runs the setup script locally.
- GrimAC and ViaVersion will generate their config files on first run.
- This is **not** a perfect replica of 2b2t (custom queue/coord plugins are private), but it provides the anti-cheat and version-compatibility behavior the bot will face.
