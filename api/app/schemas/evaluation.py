from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── Feedback Schemas ──────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    event_id: int
    participant_id: int
    overall_rating: int = Field(..., ge=1, le=5, description="1 to 5 star rating")
    speaker_rating: Optional[int] = Field(None, ge=1, le=5)
    venue_rating: Optional[int] = Field(None, ge=1, le=5)
    content_rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None
    suggestions: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    event_id: int
    participant_id: int
    overall_rating: int
    speaker_rating: Optional[int] = None
    venue_rating: Optional[int] = None
    content_rating: Optional[int] = None
    comments: Optional[str] = None
    suggestions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EventFeedbackStats(BaseModel):
    event_id: int
    total_reviews: int
    average_overall: float
    average_speaker: Optional[float] = None
    average_venue: Optional[float] = None
    average_content: Optional[float] = None
    rating_distribution: Dict[int, int]
    recent_comments: List[str]


# ── Evaluation & Scoring Schemas ──────────────────────────────────────────────

class ScoreSubmit(BaseModel):
    event_id: int
    participant_id: int
    criteria_scores: Dict[str, float] = Field(
        ..., description="Rubric criteria e.g. {'innovation': 35, 'tech': 30, 'presentation': 25}"
    )
    judge_remarks: Optional[str] = None


class EventScoreOut(BaseModel):
    id: int
    event_id: int
    participant_id: int
    participant_name: Optional[str] = None
    college_name: Optional[str] = None
    criteria_scores: Optional[Dict[str, Any]] = None
    total_score: float
    rank: Optional[int] = None
    badge: Optional[str] = None
    judge_remarks: Optional[str] = None
    evaluated_at: datetime

    class Config:
        from_attributes = True


class LeaderboardOut(BaseModel):
    event_id: int
    event_title: str
    college_name: str
    total_participants_scored: int
    standings: List[EventScoreOut]


# ── Certificate Schemas ───────────────────────────────────────────────────────

class CertificateGenerateRequest(BaseModel):
    event_id: int
    cert_type: Optional[str] = "participation"  # participation, merit, winner, runner_up
    participant_ids: Optional[List[int]] = None  # None = generate for all attended


class CertificateOut(BaseModel):
    id: int
    certificate_id: str
    event_id: int
    participant_id: int
    participant_name: Optional[str] = None
    college_name: Optional[str] = None
    event_title: Optional[str] = None
    cert_type: str
    issue_date: date
    verification_hash: str
    pdf_filename: Optional[str] = None
    is_revoked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PublicVerifyOut(BaseModel):
    is_valid: bool
    certificate_id: str
    recipient_name: str
    recipient_college: str
    event_title: str
    host_college: str
    cert_type: str
    issue_date: str
    issued_under: str = "Occasio University Network"
    status_message: str
