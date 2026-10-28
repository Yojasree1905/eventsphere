import re
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.event import Event, EventStatus
from app.models.participant import Participant
from app.models.registration import Registration
from app.models.user import User

router = APIRouter(prefix="/api/recommendations", tags=["smart_recommendations"])


class RecommendedEvent(BaseModel):
    id: int
    title: str
    category: str
    college_name: str
    match_score: int
    recommendation_reason: str
    venue: Optional[str] = None
    start_date: Optional[str] = None


def _compute_recommendations(participant: Participant, db: Session) -> List[RecommendedEvent]:
    # 1. Past registrations
    past_regs = db.query(Registration).filter(Registration.participant_id == participant.id).all()
    past_event_ids = {r.event_id for r in past_regs}
    past_events = db.query(Event).filter(Event.id.in_(past_event_ids)).all() if past_event_ids else []
    preferred_categories = {e.category for e in past_events}

    # 2. Candidate events: open for registration, not yet registered
    candidate_events = (
        db.query(Event)
        .filter(Event.status.in_([EventStatus.APPROVED, EventStatus.PUBLISHED]))
        .all()
    )

    dept = (participant.department or "").lower()
    my_college = (participant.college_name or "").lower()
    interests_str = (getattr(participant, "interests", "") or "").lower()
    skills_str = (getattr(participant, "skills", "") or "").lower()
    profile_keywords = set(re.findall(r"\w+", f"{interests_str} {skills_str}"))

    recommendations = []

    for ev in candidate_events:
        # Exclude already registered
        if ev.id in past_event_ids:
            continue

        score = 50  # base discoverability
        reasons = []

        # Category affinity
        if ev.category in preferred_categories:
            score += 25
            reasons.append(f"Matches your past participation in {ev.category} events")

        # Department / Major relevance
        cat_str = str(ev.category).lower()
        if any(term in dept for term in ["tech", "computer", "cse", "it", "science"]) and cat_str in ["technical", "workshop", "hackathon"]:
            score += 20
            reasons.append(f"High career relevance for {participant.department} students")
        elif any(term in dept for term in ["cultur", "art", "music", "humanities"]) and cat_str in ["cultural", "arts", "drama"]:
            score += 20
            reasons.append("Aligns with your creative & cultural background")
        elif any(term in dept for term in ["mgmt", "business", "commerce", "mba"]) and cat_str in ["seminar", "workshop", "conference"]:
            score += 20
            reasons.append("Relevant for business, entrepreneurship & leadership")

        # Profile skills / interests keyword matching
        ev_text = f"{ev.title} {ev.description or ''}".lower()
        matched_kws = [kw for kw in profile_keywords if len(kw) > 3 and kw in ev_text]
        if matched_kws:
            score += 15
            reasons.append(f"Matches your listed skills: {', '.join(matched_kws[:2])}")

        # University factor
        if ev.college_name and ev.college_name.lower() == my_college:
            score += 15
            reasons.append(f"Happening at your home campus ({ev.college_name})")
        else:
            score += 10
            reasons.append(f"Inter-university networking opportunity at {ev.college_name}")

        recommendations.append(
            RecommendedEvent(
                id=ev.id,
                title=ev.title,
                category=str(ev.category),
                college_name=ev.college_name,
                match_score=min(score, 99),
                recommendation_reason=" • ".join(reasons) if reasons else "Trending across participating universities",
                venue=ev.venue,
                start_date=str(ev.start_date) if ev.start_date else None,
            )
        )

    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations[:8]


@router.get("/me", response_model=List[RecommendedEvent])
def get_my_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns personalized event recommendations for the currently logged-in student.
    """
    participant = db.query(Participant).filter(Participant.email == current_user.email).first()
    if not participant:
        participant = Participant(
            full_name=current_user.full_name,
            email=current_user.email,
            college_name=current_user.college_name,
            department=current_user.department,
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)

    return _compute_recommendations(participant, db)


@router.get("/{participant_id}", response_model=List[RecommendedEvent])
def get_personalized_recommendations(
    participant_id: int,
    db: Session = Depends(get_db),
):
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    return _compute_recommendations(participant, db)
