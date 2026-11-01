import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team, TeamMember
from app.models.event import Event
from app.models.participant import Participant
from app.models.registration import Registration, RegistrationStatus

router = APIRouter(prefix="/api/teams", tags=["teams"])


class TeamCreate(BaseModel):
    name: str
    event_id: int
    leader_id: int


class TeamJoin(BaseModel):
    team_code: str
    participant_id: int


class MemberOut(BaseModel):
    participant_id: int
    full_name: str
    college_name: Optional[str] = None
    email: str


class TeamOut(BaseModel):
    id: int
    name: str
    team_code: str
    event_id: int
    event_title: str
    leader_id: int
    leader_name: str
    members_count: int
    members: List[MemberOut]


@router.post("", response_model=TeamOut, status_code=201)
def create_team(payload: TeamCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    leader = db.query(Participant).filter(Participant.id == payload.leader_id).first()
    if not leader:
        raise HTTPException(status_code=404, detail="Leader participant profile not found")

    # Generate unique 6-character team code (e.g. EVT-9X2)
    team_code = f"TM-{uuid.uuid4().hex[:6].upper()}"

    team = Team(
        name=payload.name,
        team_code=team_code,
        event_id=payload.event_id,
        leader_id=payload.leader_id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Add leader as first member
    m = TeamMember(team_id=team.id, participant_id=leader.id)
    db.add(m)

    # Ensure leader is registered for event
    reg = db.query(Registration).filter(Registration.event_id == event.id, Registration.participant_id == leader.id).first()
    if not reg:
        reg = Registration(
            event_id=event.id,
            participant_id=leader.id,
            status=RegistrationStatus.CONFIRMED,
            registration_number=f"REG-{uuid.uuid4().hex[:8].upper()}",
            notes=f"Team: {team.name} ({team.team_code})"
        )
        db.add(reg)
    else:
        reg.notes = f"Team: {team.name} ({team.team_code})"

    db.commit()

    return TeamOut(
        id=team.id,
        name=team.name,
        team_code=team.team_code,
        event_id=team.event_id,
        event_title=event.title,
        leader_id=leader.id,
        leader_name=leader.full_name,
        members_count=1,
        members=[MemberOut(participant_id=leader.id, full_name=leader.full_name, college_name=leader.college_name, email=leader.email)],
    )


@router.post("/join", response_model=TeamOut)
def join_team(payload: TeamJoin, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.team_code == payload.team_code.strip().upper()).first()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid team code")

    participant = db.query(Participant).filter(Participant.id == payload.participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    # Check if already in team
    existing = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.participant_id == participant.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Participant already a member of this team")

    m = TeamMember(team_id=team.id, participant_id=participant.id)
    db.add(m)

    # Ensure registration
    reg = db.query(Registration).filter(Registration.event_id == team.event_id, Registration.participant_id == participant.id).first()
    if not reg:
        reg = Registration(
            event_id=team.event_id,
            participant_id=participant.id,
            status=RegistrationStatus.CONFIRMED,
            registration_number=f"REG-{uuid.uuid4().hex[:8].upper()}",
            notes=f"Team: {team.name} ({team.team_code})"
        )
        db.add(reg)

    db.commit()
    db.refresh(team)

    members_list = []
    for tm in team.members:
        p = db.query(Participant).filter(Participant.id == tm.participant_id).first()
        if p:
            members_list.append(MemberOut(participant_id=p.id, full_name=p.full_name, college_name=p.college_name, email=p.email))

    leader = db.query(Participant).filter(Participant.id == team.leader_id).first()

    return TeamOut(
        id=team.id,
        name=team.name,
        team_code=team.team_code,
        event_id=team.event_id,
        event_title=team.event.title,
        leader_id=team.leader_id,
        leader_name=leader.full_name if leader else "Leader",
        members_count=len(members_list),
        members=members_list,
    )


@router.get("/event/{event_id}", response_model=List[TeamOut])
def list_teams_for_event(event_id: int, db: Session = Depends(get_db)):
    teams = db.query(Team).filter(Team.event_id == event_id).all()
    out = []
    for t in teams:
        members_list = []
        for tm in t.members:
            p = db.query(Participant).filter(Participant.id == tm.participant_id).first()
            if p:
                members_list.append(MemberOut(participant_id=p.id, full_name=p.full_name, college_name=p.college_name, email=p.email))
        leader = db.query(Participant).filter(Participant.id == t.leader_id).first()
        out.append(
            TeamOut(
                id=t.id,
                name=t.name,
                team_code=t.team_code,
                event_id=t.event_id,
                event_title=t.event.title,
                leader_id=t.leader_id,
                leader_name=leader.full_name if leader else "Leader",
                members_count=len(members_list),
                members=members_list,
            )
        )
    return out
