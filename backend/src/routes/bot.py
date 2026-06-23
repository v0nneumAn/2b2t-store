from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import auth
from .. import models
from ..models import get_db

router = APIRouter()


class JobUpdate(BaseModel):
    status: str
    payload: dict | None = None


@router.get("/jobs/next")
def next_job(db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    job = (
        db.query(models.DeliveryJob)
        .filter(models.DeliveryJob.status == "queued")
        .order_by(models.DeliveryJob.created_at.asc())
        .first()
    )
    if not job:
        return {"job": None}
    return {"job": job}


@router.post("/jobs/{job_id}/claim")
def claim_job(job_id: str, bot_id: str, db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    job = db.query(models.DeliveryJob).filter(models.DeliveryJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "claimed"
    job.bot_id = bot_id
    db.commit()
    return {"success": True}


@router.post("/jobs/{job_id}/update")
def update_job(job_id: str, payload: JobUpdate, db: Session = Depends(get_db), _=Depends(auth.require_bot_key)):
    job = db.query(models.DeliveryJob).filter(models.DeliveryJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = payload.status
    if payload.payload:
        job.payload = payload.payload
    db.commit()
    return {"success": True}
