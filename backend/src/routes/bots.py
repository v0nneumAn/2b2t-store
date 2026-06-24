from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import auth
from .. import models
from ..config import get_settings
from ..models import get_db
from ..services.zenith_client import get_bot_zenith_client, ZenithClientError

router = APIRouter(prefix="/api/bots", tags=["bots"])


class BotCreate(BaseModel):
    id: str
    role: str
    bot_type: str = Field(..., pattern="^(advert|delivery|pearl)$")
    account_name: Optional[str] = None
    status: str = "active"
    config: dict = Field(default_factory=dict)


class BotResponse(BaseModel):
    id: str
    role: str
    bot_type: str
    account_name: Optional[str]
    status: str
    config: dict

    class Config:
        from_attributes = True


class BotCommandCreate(BaseModel):
    command: str = Field(..., pattern="^(pause|resume|stop|restart)$")
    payload: Optional[dict] = None


class BotCommandResponse(BaseModel):
    id: str
    bot_role: str
    command: str
    payload: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class ZenithCommandRequest(BaseModel):
    command: str = Field(..., min_length=1)


class ZenithCommandResponse(BaseModel):
    command: str
    response: dict


@router.post("", response_model=BotResponse)
def create_bot(
    payload: BotCreate,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    existing = db.query(models.Bot).filter(models.Bot.role == payload.role).first()
    if existing:
        raise HTTPException(status_code=409, detail="Bot role already exists")
    bot = models.Bot(**payload.model_dump())
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


@router.get("", response_model=List[BotResponse])
def list_bots(
    bot_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    query = db.query(models.Bot)
    if bot_type:
        query = query.filter(models.Bot.bot_type == bot_type)
    return query.all()


@router.get("/{role}", response_model=BotResponse)
def get_bot(
    role: str,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    bot = db.query(models.Bot).filter(models.Bot.role == role).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


@router.post("/{role}/commands", response_model=BotCommandResponse)
def create_command(
    role: str,
    payload: BotCommandCreate,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    bot = db.query(models.Bot).filter(models.Bot.role == role).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    cmd = models.BotCommand(
        id=f"cmd-{role}-{int(datetime.utcnow().timestamp() * 1000)}",
        bot_role=role,
        command=payload.command,
        payload=payload.payload,
    )
    db.add(cmd)
    db.commit()
    db.refresh(cmd)
    return cmd


@router.get("/{role}/commands/next", response_model=Optional[BotCommandResponse])
def next_command(
    role: str,
    db: Session = Depends(get_db),
    _=Depends(auth.require_bot_key),
):
    cmd = (
        db.query(models.BotCommand)
        .filter(
            models.BotCommand.bot_role == role,
            models.BotCommand.acknowledged_at.is_(None),
        )
        .order_by(models.BotCommand.created_at)
        .first()
    )
    if cmd:
        cmd.acknowledged_at = datetime.utcnow()
        db.commit()
    return cmd


@router.post("/{role}/zenith/command", response_model=ZenithCommandResponse)
def send_zenith_command(
    role: str,
    payload: ZenithCommandRequest,
    db: Session = Depends(get_db),
    _=Depends(auth.require_admin_key),
):
    """
    Send a command directly to a ZenithProxy Web API instance.

    Per-bot webApi config overrides the global ZENITH_WEB_API_URL/TOKEN.
    """
    bot = db.query(models.Bot).filter(models.Bot.role == role).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    client = get_bot_zenith_client(bot.config)
    if not client:
        settings = get_settings()
        if not settings.zenith_web_api_url or not settings.zenith_web_api_token:
            raise HTTPException(
                status_code=400,
                detail="No ZenithProxy Web API configured for this bot or globally",
            )
        from ..services.zenith_client import ZenithClient
        client = ZenithClient(settings.zenith_web_api_url, settings.zenith_web_api_token)

    try:
        result = client.send_command(payload.command)
    except ZenithClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"command": payload.command, "response": result}
