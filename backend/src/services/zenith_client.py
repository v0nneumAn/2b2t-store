"""
Client for the ZenithProxy Web API plugin.

Docs: https://github.com/rfresh2/ZenithProxyWebAPI

This lets the store backend send commands to a ZenithProxy instance over HTTP
instead of requiring a custom Java plugin for basic control.
"""

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class ZenithClientError(Exception):
    pass


class ZenithClient:
    def __init__(self, base_url: str, auth_token: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token
        self.timeout = timeout

    def send_command(self, command: str) -> dict:
        """Send a command to ZenithProxy and return the JSON response."""
        url = f"{self.base_url}/api/command"
        headers = {
            "Authorization": self.auth_token,
            "Content-Type": "application/json",
        }
        payload = {"command": command}

        try:
            resp = httpx.post(url, headers=headers, json=payload, timeout=self.timeout)
        except httpx.RequestError as exc:
            logger.error("ZenithProxy request failed: %s", exc)
            raise ZenithClientError(f"Request failed: {exc}") from exc

        if resp.status_code == 401:
            raise ZenithClientError("Invalid ZenithProxy auth token")
        if resp.status_code != 200:
            raise ZenithClientError(
                f"ZenithProxy returned {resp.status_code}: {resp.text}"
            )

        try:
            return resp.json()
        except Exception as exc:
            raise ZenithClientError(f"Invalid JSON response: {exc}") from exc

    def get_logs(self, from_index: Optional[int] = None, limit: int = 200) -> dict:
        """Fetch recent log entries from ZenithProxy."""
        params = {"limit": limit}
        if from_index is not None:
            params["from"] = from_index

        url = f"{self.base_url}/api/logs"
        headers = {"Authorization": self.auth_token}

        try:
            resp = httpx.get(url, headers=headers, params=params, timeout=self.timeout)
        except httpx.RequestError as exc:
            raise ZenithClientError(f"Request failed: {exc}") from exc

        if resp.status_code != 200:
            raise ZenithClientError(
                f"ZenithProxy returned {resp.status_code}: {resp.text}"
            )

        return resp.json()


def get_bot_zenith_client(bot_config: dict) -> Optional[ZenithClient]:
    """Build a ZenithClient from a Bot.config dict if webApi is configured."""
    web_api = bot_config.get("web_api")
    if not web_api:
        return None
    url = web_api.get("url")
    token = web_api.get("token")
    if not url or not token:
        return None
    return ZenithClient(url, token)
