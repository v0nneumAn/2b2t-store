# Delivery Bot (Temporary Scaffold)

> **Note:** This is a temporary Mineflayer/Node.js scaffold used for early prototyping.
>
> The target delivery runtime is **ZenithProxy + a custom Java plugin**. See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the full design draft.

## Purpose

- Test backend job queue integration.
- Validate local Paper server connectivity.
- Iterate on chat/inventory logic quickly before moving to the ZenithProxy plugin.

## Run locally

```bash
cd delivery-bot
npm install
# Edit config.json for localhost test server
npm run dev
```

## What's here

- `src/bot.js` — Mineflayer connection setup.
- `src/jobs.js` — Placeholder job execution.
- `src/agent.py` — Python agent stub.
