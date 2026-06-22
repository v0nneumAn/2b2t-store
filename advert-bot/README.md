# Advert Bot

Dedicated ZenithProxy-based advert bot for 2b2t public chat.

Instead of direct ads, 2–3 advert alts simulate a natural conversation or argument in public chat, subtly promoting `shulker.shop` over a rival shop. The shop URL is only shared via whisper when asked.

## How It Works

1. An AI generator script (`scripts/generate_conversation.py`) creates conversation scripts.
2. Scripts are reviewed and approved via the backend.
3. The backend scheduler assigns a start time every ~45 minutes.
4. Each advert alt runs its own ZenithProxy `java`-channel instance with the advert plugin.
5. Each plugin polls the backend for the next conversation and sends only its own lines with human-like typing delays.
6. Built-in ZenithProxy modules handle queue, anti-AFK, auto-reconnect, and safety.

## Directory Layout

```
advert-bot/
├── config/
│   ├── bot-config.json.example          # per-bot config
│   └── conversation-schedule.json.example # scheduler settings
├── generated/                           # AI-generated conversation scripts (gitignored)
├── plugin/                              # ZenithProxy Java plugin (Gradle)
│   └── src/main/java/com/shulkershop/advert/
├── scripts/
│   ├── generate_conversation.py         # OpenAI conversation generator
│   └── prompts/
│       └── conversation_v1.txt          # prompt template
├── Dockerfile
└── README.md
```

## Configuration

1. Copy `config/bot-config.json.example` to `config/bot-config.json` and fill in:
   - `backend_url`
   - `bot_api_key` (must match backend `BOT_API_KEY`)
   - `bot_role` (e.g., `adbot-alpha`, `adbot-beta`, `adbot-gamma`)
   - `shop_shortlink`

2. Set `OPENAI_API_KEY` for the generator script.

3. Build the plugin:
   ```bash
   cd advert-bot/plugin
   ./gradlew build
   ```

4. Place the built jar in the ZenithProxy `plugins/` folder next to the launcher.

## Generating Conversations

```bash
cd advert-bot/scripts
export OPENAI_API_KEY=...
python generate_conversation.py --output ../generated/conv-$(date +%s).json
```

Then upload the JSON to the backend for review and approval.

## Backend Endpoints

- `POST /api/advert/conversations` — submit a new conversation script
- `POST /api/advert/conversations/{id}/approve` — approve a pending script
- `GET /api/advert/conversations/next?role=adbot-alpha` — bot polling endpoint
- `POST /api/advert/schedule` — schedule the next conversation
- `POST /api/advert/bots/status` — bot heartbeat/status update

## Safety

- Ads/conversations pause when non-friend players are nearby.
- Mute/slow-mode detection triggers a cooldown.
- Queue synchronization: conversations only start when all required bots are in-game.
- Shop URL is never posted in public chat.

## Local Testing

A Docker Compose setup runs the backend, Paper test server, and two advert bots together:

```bash
cd advert-bot/scripts
./run-local-test.sh
```

This will:
1. Build the advert plugin.
2. Seed the backend with a test conversation.
3. Start backend, Paper, `adbot-alpha`, and `adbot-beta` in Docker.

Access points:
- Backend: http://localhost:8000
- Paper server: localhost:25565
- adbot-alpha proxy: localhost:25566
- adbot-beta proxy: localhost:25567

Watch logs:
```bash
docker compose -f docker/docker-compose.advert.yml logs -f
```

Stop:
```bash
docker compose -f docker/docker-compose.advert.yml down
```

## Notes

- ZenithProxy must run on the `java` release channel; plugins are not supported on the `linux` channel.
- Each advert alt needs its own ZenithProxy instance (~300 MB RAM each).
- Bot usernames, competitor names, and OpenAI key will be added later.
- Docker is required to run the local test harness; the dev host currently does not have Docker access.
