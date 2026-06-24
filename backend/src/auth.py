import hmac
import secrets
from fastapi import Header, HTTPException
from .config import get_settings


def _require_api_key(provided: str | None, expected: str) -> None:
    if not provided:
        raise HTTPException(status_code=401, detail="Missing API key")
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=403, detail="Invalid API key")


def require_admin_key(x_admin_key: str | None = Header(None)) -> None:
    settings = get_settings()
    _require_api_key(x_admin_key, settings.admin_api_key)


def require_bot_key(x_bot_key: str | None = Header(None)) -> None:
    settings = get_settings()
    _require_api_key(x_bot_key, settings.bot_api_key)
