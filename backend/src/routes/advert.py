from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .. import models
from ..models import get_db
from ..config import get_settings

router = APIRouter(prefix="/api/advert", tags=["advert"])

settings = get_settings()


def verify_bot_key(x_bot_key: str = Header(...)):
    if x_bot_key != settings.bot_api_key:
        raise HTTPException(status_code=403, detail="Invalid bot API key")
    return True


class ConversationLine(BaseModel):
    role: str
    delay_ms: int
    typing_ms: int
    text: str


class ConversationScriptCreate(BaseModel):
    id: str
    topic: str
    bot_roles: List[str]
    lines: List[ConversationLine]


class ConversationScriptResponse(BaseModel):
    id: str
    topic: str
    bot_roles: List[str]
    lines: List[ConversationLine]
    status: str

    class Config:
        from_attributes = True


class BotStatusUpdate(BaseModel):
    role: str
    in_game: bool = False
    is_queue: bool = False
    queue_position: Optional[int] = None
    conversation_active: bool = False


@router.post("/conversations", response_model=ConversationScriptResponse)
def create_conversation(
    payload: ConversationScriptCreate,
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    existing = db.query(models.ConversationScript).filter(models.ConversationScript.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Conversation ID already exists")

    script = models.ConversationScript(
        id=payload.id,
        topic=payload.topic,
        bot_roles=payload.bot_roles,
        lines=[line.model_dump() for line in payload.lines],
        status="pending_review",
    )
    db.add(script)
    db.commit()
    db.refresh(script)
    return script


@router.get("/conversations/next", response_model=Optional[ConversationScriptResponse])
def next_conversation(
    role: str,
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    """Return the next scheduled conversation that includes this bot role."""
    now = datetime.utcnow()
    schedule = (
        db.query(models.AdvertSchedule)
        .filter(
            models.AdvertSchedule.status == "scheduled",
            models.AdvertSchedule.scheduled_at <= now,
        )
        .order_by(models.AdvertSchedule.scheduled_at)
        .first()
    )
    if not schedule:
        return None

    script = db.query(models.ConversationScript).filter(
        models.ConversationScript.id == schedule.conversation_id,
        models.ConversationScript.status == "approved",
    ).first()
    if not script:
        return None

    if role not in (script.bot_roles or []):
        return None

    # Mark active on first poll
    if schedule.status == "scheduled":
        schedule.status = "active"
        schedule.started_at = now
        db.commit()

    return script


@router.post("/conversations/{conversation_id}/approve")
def approve_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    script = db.query(models.ConversationScript).filter(models.ConversationScript.id == conversation_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Conversation not found")
    script.status = "approved"
    db.commit()
    return {"status": "approved"}


@router.post("/conversations/{conversation_id}/complete")
def complete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    script = db.query(models.ConversationScript).filter(models.ConversationScript.id == conversation_id).first()
    if script:
        script.used_count += 1
        script.last_used_at = datetime.utcnow()

    schedule = db.query(models.AdvertSchedule).filter(
        models.AdvertSchedule.conversation_id == conversation_id,
        models.AdvertSchedule.status == "active",
    ).first()
    if schedule:
        schedule.status = "completed"
        schedule.completed_at = datetime.utcnow()

    db.commit()
    return {"status": "completed"}


@router.post("/schedule")
def schedule_next_conversation(
    conversation_id: str,
    delay_minutes: int = 45,
    required_bot_roles: List[str] = None,
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    script = db.query(models.ConversationScript).filter(
        models.ConversationScript.id == conversation_id,
        models.ConversationScript.status == "approved",
    ).first()
    if not script:
        raise HTTPException(status_code=404, detail="Approved conversation not found")

    schedule = models.AdvertSchedule(
        id=f"sch-{conversation_id}-{int(datetime.utcnow().timestamp())}",
        conversation_id=conversation_id,
        scheduled_at=datetime.utcnow() + timedelta(minutes=delay_minutes),
        required_bot_roles=required_bot_roles or script.bot_roles,
    )
    db.add(schedule)
    db.commit()
    return {"id": schedule.id, "scheduled_at": schedule.scheduled_at.isoformat()}


@router.post("/bots/status")
def update_bot_status(
    payload: BotStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    status = db.query(models.BotStatus).filter(models.BotStatus.role == payload.role).first()
    if not status:
        status = models.BotStatus(role=payload.role)
        db.add(status)

    status.in_game = payload.in_game
    status.is_queue = payload.is_queue
    status.queue_position = payload.queue_position
    status.conversation_active = payload.conversation_active
    status.last_seen_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.get("/bots/status")
def list_bot_status(
    db: Session = Depends(get_db),
    _=Depends(verify_bot_key),
):
    return db.query(models.BotStatus).all()
