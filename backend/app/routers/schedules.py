from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.schedule import Schedule
from app.models.user import User
from app.schemas.schedule import ScheduleCreate, ScheduleOut, ScheduleUpdate

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


def _get_or_404(schedule_id: int, db: Session) -> Schedule:
    obj = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return obj


@router.get("", response_model=List[ScheduleOut])
def list_schedules(
    event_id: int = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(Schedule)
        .filter(Schedule.event_id == event_id)
        .order_by(Schedule.start_time)
        .all()
    )


@router.post("", response_model=ScheduleOut, status_code=201)
def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")
    schedule = Schedule(**payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _get_or_404(schedule_id, db)


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    schedule = _get_or_404(schedule_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    if schedule.start_time >= schedule.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}/complete", response_model=ScheduleOut)
def mark_schedule_completed(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    schedule = _get_or_404(schedule_id, db)
    schedule.is_conducted = True
    schedule.is_cancelled = False
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}/expire", response_model=ScheduleOut)
def mark_schedule_expired(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    schedule = _get_or_404(schedule_id, db)
    schedule.is_conducted = False
    schedule.is_cancelled = False
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}/cancel", response_model=ScheduleOut)
def mark_schedule_cancelled(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    schedule = _get_or_404(schedule_id, db)
    schedule.is_cancelled = True
    db.commit()
    db.refresh(schedule)
    return schedule



@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    schedule = _get_or_404(schedule_id, db)
    db.delete(schedule)
    db.commit()
