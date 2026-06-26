import hmac
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import Cookie, Depends, Header, HTTPException, Response
import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session
from . import models
from .config import get_settings
from .models import get_db


ADMIN_COOKIE_NAME = "admin_session"
ADMIN_TOKEN_TTL = timedelta(hours=8)


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


def create_admin_token() -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": "admin",
        "iat": now,
        "exp": now + ADMIN_TOKEN_TTL,
    }
    return jwt.encode(payload, settings.admin_jwt_secret, algorithm="HS256")


def set_admin_cookie(response: Response) -> None:
    token = create_admin_token()
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=int(ADMIN_TOKEN_TTL.total_seconds()),
        path="/",
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(key=ADMIN_COOKIE_NAME, path="/")


def require_admin_cookie(admin_session: str | None = Cookie(None)) -> None:
    if not admin_session:
        raise HTTPException(status_code=401, detail="Not authenticated")

    settings = get_settings()
    try:
        payload = jwt.decode(
            admin_session, settings.admin_jwt_secret, algorithms=["HS256"]
        )
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    if payload.get("sub") != "admin":
        raise HTTPException(status_code=403, detail="Invalid session")


def require_bot_identity(
    x_bot_id: str | None = Header(None),
    x_bot_key: str | None = Header(None),
    db: Session = Depends(get_db),
) -> models.Bot:
    """Authenticate a bot by its ID/role and per-bot API key.

    Falls back to the global BOT_API_KEY for bots that do not yet have a
    per-bot key configured, but a key must be present in the Bot record before
    any mutating endpoint can be used.
    """
    if not x_bot_id:
        raise HTTPException(status_code=401, detail="Missing bot ID")
    if not x_bot_key:
        raise HTTPException(status_code=401, detail="Missing bot API key")

    bot = (
        db.query(models.Bot)
        .filter((models.Bot.id == x_bot_id) | (models.Bot.role == x_bot_id))
        .first()
    )

    if bot and bot.config and bot.config.get("api_key"):
        if not secrets.compare_digest(x_bot_key, bot.config["api_key"]):
            raise HTTPException(status_code=403, detail="Invalid bot credentials")
        return bot

    # No per-bot key yet: accept global key for read-only compatibility.
    settings = get_settings()
    if not secrets.compare_digest(x_bot_key, settings.bot_api_key):
        raise HTTPException(status_code=403, detail="Invalid bot credentials")

    if not bot:
        raise HTTPException(status_code=403, detail="Invalid bot credentials")

    return bot
