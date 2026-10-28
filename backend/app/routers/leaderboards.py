from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.evaluation import EventScore
from app.models.event import Event
from app.models.participant import Participant
from app.models.user import User
from app.schemas.evaluation import EventScoreOut, LeaderboardOut, ScoreSubmit

router = APIRouter(prefix="/api/scores", tags=["evaluations_and_leaderboard"])


@router.post("/evaluate", response_model=EventScoreOut)
def record_evaluation(
    payload: ScoreSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submits or updates judge rubric scores for a participant in a competitive event.
    Calculates total score = sum(criteria_scores).
    Enforces event-specific judge authorization.
    """
    # 1. Role validation
    if current_user.role == "participant":
        raise HTTPException(status_code=403, detail="Students are not authorized to evaluate events.")

    # 2. If judge, verify assignment to this specific event
    if current_user.role == "judge":
        from app.models.judge import JudgeAssignment
        is_assigned = (
            db.query(JudgeAssignment)
            .filter(JudgeAssignment.event_id == payload.event_id, JudgeAssignment.judge_user_id == current_user.id)
            .first()
        )
        if not is_assigned and not current_user.is_superadmin:
            raise HTTPException(status_code=403, detail="You are not authorized to evaluate this event. You must be explicitly assigned as a judge.")

    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    participant = db.query(Participant).filter(Participant.id == payload.participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    total = sum(payload.criteria_scores.values())

    score_rec = (
        db.query(EventScore)
        .filter(
            EventScore.event_id == payload.event_id,
            EventScore.participant_id == payload.participant_id,
        )
        .first()
    )

    if not score_rec:
        score_rec = EventScore(
            event_id=payload.event_id,
            participant_id=payload.participant_id,
            criteria_scores=payload.criteria_scores,
            total_score=total,
            judge_remarks=payload.judge_remarks,
        )
        db.add(score_rec)
    else:
        score_rec.criteria_scores = payload.criteria_scores
        score_rec.total_score = total
        score_rec.judge_remarks = payload.judge_remarks

    db.commit()
    db.refresh(score_rec)

    # Re-calculate ranks automatically for this event
    _recompute_event_ranks(payload.event_id, db)
    db.refresh(score_rec)

    return EventScoreOut(
        id=score_rec.id,
        event_id=score_rec.event_id,
        participant_id=score_rec.participant_id,
        participant_name=participant.full_name,
        college_name=participant.college_name,
        criteria_scores=score_rec.criteria_scores,
        total_score=score_rec.total_score,
        rank=score_rec.rank,
        badge=score_rec.badge,
        judge_remarks=score_rec.judge_remarks,
        evaluated_at=score_rec.evaluated_at,
    )


def _recompute_event_ranks(event_id: int, db: Session):
    """Sorts participants by total_score descending and assigns ranks & badges."""
    scores = (
        db.query(EventScore)
        .filter(EventScore.event_id == event_id)
        .order_by(EventScore.total_score.desc())
        .all()
    )

    for i, s in enumerate(scores):
        rank = i + 1
        s.rank = rank
        if rank == 1:
            s.badge = "Winner (1st Place)"
        elif rank == 2:
            s.badge = "1st Runner Up (2nd Place)"
        elif rank == 3:
            s.badge = "2nd Runner Up (3rd Place)"
        elif rank <= 10:
            s.badge = "Top 10 Finalist"
        else:
            s.badge = "Participant"

    db.commit()


@router.post("/recompute/{event_id}")
def manual_recompute_ranks(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _recompute_event_ranks(event_id, db)
    return {"status": "ok", "message": f"Leaderboard ranks recomputed for event {event_id}"}


@router.get("/leaderboard/{event_id}", response_model=LeaderboardOut)
def get_event_leaderboard(
    event_id: int,
    db: Session = Depends(get_db),
):
    """
    Public leaderboard for an event displaying real-time ranks, badges, scores, and colleges.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    scores = (
        db.query(EventScore, Participant)
        .join(Participant, EventScore.participant_id == Participant.id)
        .filter(EventScore.event_id == event_id)
        .order_by(EventScore.rank.asc())
        .all()
    )

    standings = []
    for s, p in scores:
        standings.append(
            EventScoreOut(
                id=s.id,
                event_id=s.event_id,
                participant_id=s.participant_id,
                participant_name=p.full_name,
                college_name=p.college_name,
                criteria_scores=s.criteria_scores,
                total_score=s.total_score,
                rank=s.rank,
                badge=s.badge,
                judge_remarks=s.judge_remarks,
                evaluated_at=s.evaluated_at,
            )
        )

    return LeaderboardOut(
        event_id=event.id,
        event_title=event.title,
        college_name=event.college_name,
        total_participants_scored=len(standings),
        standings=standings,
    )
