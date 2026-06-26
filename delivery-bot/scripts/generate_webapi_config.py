#!/usr/bin/env python3
"""Generate web-api.json for the ZenithProxyWebAPI plugin from environment variables."""

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

    port = int(get("ZENITH_WEB_API_PORT", "8082"))
    token = get("ZENITH_WEB_API_TOKEN", "")
    if not token:
        raise SystemExit("ZENITH_WEB_API_TOKEN must be set")

    config = {
        "enabled": True,
        "port": port,
        "authToken": token,
        "webUI": True,
        "logRetentionEntries": 500,
        "rateLimiter": True,
        "rateLimitRequestsPerMinute": 30,
        "commandsAccountOwnerPerms": False,
    }

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(config, f, indent=2)
    out.chmod(0o600)

    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
