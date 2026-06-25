# 2b2t Store Delivery Bot

ZenithProxy plugin that executes in-world deliveries for the 2b2t Store.

## What it does

- Polls the backend `/api/bot/jobs/next` endpoint with `X-Bot-Key` auth.
- Claims delivery jobs and runs the full workflow:
  1. **Prepare** — loads shulker boxes from a source chest into the bot's EnderChest.
  2. **Travel** — executes `/kill` to return to spawn and paths to the handoff EnderChest.
  3. **Handoff report** — sends the spawn EnderChest coordinates to the backend.
  4. **Drop** — after the customer confirms arrival, retrieves the shulkers, moves to a safe drop point, drops the items, and reports `dropped` to the backend.
- Optionally supports a separate PearlBot account for stasis-pearl teleport back to stash (`pearlBotEnabled`). Disabled by default.

## Configuration

The plugin config is read from ZenithProxy's config directory as `delivery-zenith.json`.

```json
{
  "deliveryBot": {
    "backendUrl": "http://backend:8000",
    "botKey": "your-bot-api-key",
    "botId": "delivery-alpha",
    "jobPollIntervalSeconds": 10,
    "jobPollingEnabled": true,
    "pearlBotEnabled": false,
    "sourceChests": [
      {"id": "depot-alpha", "x": 100, "y": 64, "z": -200}
    ],
    "actionPriority": 1100000,
    "onlineTimeoutSeconds": 7200,
    "operationTimeoutSeconds": 180
  }
}
```

The Docker entrypoint bind-mounts this file from `delivery-bot/config/delivery-zenith.json`.

## Local build

```bash
./gradlew build
```

The plugin jar is written to `build/libs/DeliveryZenith-1.0.0.jar`.

## Docker

```bash
cd docker/
cp .env.vm.example .env.vm
# fill in .env.vm
docker compose -f docker-compose.yml -f docker-compose.vm.yml --env-file .env.vm up -d --build
```

## First login (Microsoft account)

The bot uses a real Minecraft account via Microsoft authentication. On first start:

1. Start the container interactively so you can see the device-code prompt:
   ```bash
   docker run -it --rm \
     -v delivery-bot-config:/zenith/config \
     -v $(pwd)/delivery-bot/config/delivery-zenith.json:/zenith/config/delivery-zenith.json:ro \
     store-delivery-bot
   ```
2. ZenithProxy prints a URL (e.g. `https://microsoft.com/link`) and a code.
3. Open the URL on your own device, log in with the bot's Microsoft account, and enter the code.
4. Once connected, stop the container. The auth token is now persisted in the `delivery-bot-config` Docker volume.
5. Start the bot normally with `docker compose up -d`.

## Admin commands (in-game / Discord / terminal)

- `deliveryBot source add <id> <x> <y> <z>` — add a source chest
- `deliveryBot status` — current order and state
- `deliveryBot cancel` — abort the current workflow

## Development notes

- The plugin targets MC 1.21.4 and the ZenithProxy `java` release channel.
- Source chest coordinates are usually supplied dynamically by the backend job payload, so `sourceChests` can be left empty if every job includes `payload.source_chest`.
