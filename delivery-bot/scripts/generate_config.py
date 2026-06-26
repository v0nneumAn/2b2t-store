#!/usr/bin/env python3
"""Generate delivery-zenith.json from environment variables."""

import argparse
import json
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", default=".env.vm")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    env = {}
    if os.path.isfile(args.env_file):
        with open(args.env_file) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                env[key] = value.strip().strip('"').strip("'")

    def get(key, default=None):
        return os.getenv(key, env.get(key, default))

    bot_key = get("DELIVERY_BOT_API_KEY") or get("BOT_API_KEY", "")
    bot_id = get("DELIVERY_BOT_BOT_ID", "delivery-alpha")
    api_secret = get("DELIVERY_BOT_API_SECRET", "")
    if not bot_key:
        raise SystemExit("DELIVERY_BOT_API_KEY (or BOT_API_KEY) must be set")
    if not api_secret:
        raise SystemExit("DELIVERY_BOT_API_SECRET must be set")

    config = {
        "deliveryBot": {
            "backendUrl": get("BACKEND_URL", "http://backend:8000"),
            "botKey": bot_key,
            "botId": bot_id,
            "jobPollIntervalSeconds": int(get("DELIVERY_BOT_POLL_INTERVAL_SECONDS", "10")),
            "jobPollingEnabled": get("DELIVERY_BOT_POLLING_ENABLED", "true").lower() == "true",
            "pearlBotEnabled": get("DELIVERY_BOT_PEARL_BOT_ENABLED", "false").lower() == "true",
            "httpPort": int(get("DELIVERY_BOT_HTTP_PORT", "8080")),
            "pearlBotUrl": get("PEARL_BOT_URL", "http://pearl-bot:8081"),
            "apiSecret": api_secret,
            "sourceChests": [],
            "actionPriority": 1_100_000,
            "onlineTimeoutSeconds": 7200,
            "operationTimeoutSeconds": 180,
        }
    }

    # Source chests are supplied as a JSON array in the env var.
    source_chests = get("DELIVERY_BOT_SOURCE_CHESTS", "")
    if source_chests:
        try:
            config["deliveryBot"]["sourceChests"] = json.loads(source_chests)
        except json.JSONDecodeError as e:
            print(f"Warning: DELIVERY_BOT_SOURCE_CHESTS is not valid JSON: {e}")

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(config, f, indent=2)
    out.chmod(0o600)

    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
