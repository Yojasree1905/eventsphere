from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.event import Event
from app.models.feedback import Feedback
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User
from app.schemas.evaluation import EventFeedbackStats, FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/api/feedbacks", tags=["feedbacks"])


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
):
    """
    Submits participant feedback for an event.
    Verifies that the participant attended the event.
    """
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Attendance Gate Check
    reg = (
        db.query(Registration)
        .filter(
            Registration.event_id == payload.event_id,
            Registration.participant_id == payload.participant_id,
        )
        .first()
    )
    if not reg or reg.status != RegistrationStatus.ATTENDED:
        raise HTTPException(
            status_code=403,
            detail="Only verified attendees who checked in can submit feedback for this event.",
        )

    # Prevent duplicate reviews
    existing = (
        db.query(Feedback)
        .filter(
            Feedback.event_id == payload.event_id,
            Feedback.participant_id == payload.participant_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="Feedback already submitted by this participant for this event."
        )

    fb = Feedback(**payload.model_dump())
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@router.get("/event/{event_id}", response_model=EventFeedbackStats)
def get_event_feedback_stats(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Calculates quantitative metrics, star rating distributions, and recent review remarks.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    feedbacks = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    total = len(feedbacks)
    if total == 0:
        return EventFeedbackStats(
            event_id=event_id,
            total_reviews=0,
            average_overall=0.0,
            average_speaker=0.0,
            average_venue=0.0,
            average_content=0.0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            recent_comments=[],
        )

    avg_overall = sum(f.overall_rating for f in feedbacks) / total
    
    speaker_vals = [f.speaker_rating for f in feedbacks if f.speaker_rating is not None]
    avg_speaker = sum(speaker_vals) / len(speaker_vals) if speaker_vals else None

    venue_vals = [f.venue_rating for f in feedbacks if f.venue_rating is not None]
    avg_venue = sum(venue_vals) / len(venue_vals) if venue_vals else None

    content_vals = [f.content_rating for f in feedbacks if f.content_rating is not None]
    avg_content = sum(content_vals) / len(content_vals) if content_vals else None

    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for f in feedbacks:
        if 1 <= f.overall_rating <= 5:
            dist[f.overall_rating] += 1

    comments = [f.comments for f in feedbacks if f.comments and f.comments.strip()][:10]

    return EventFeedbackStats(
        event_id=event_id,
        total_reviews=total,
        average_overall=round(avg_overall, 2),
        average_speaker=round(avg_speaker, 2) if avg_speaker else None,
        average_venue=round(avg_venue, 2) if avg_venue else None,
        average_content=round(avg_content, 2) if avg_content else None,
        rating_distribution=dist,
        recent_comments=comments,
    )
