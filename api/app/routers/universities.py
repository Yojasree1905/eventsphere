from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import require_superadmin
from app.models.university import University
from app.models.user import User

router = APIRouter(prefix="/api/universities", tags=["universities"])


class UniversityCreate(BaseModel):
    name: str
    code: str
    city: Optional[str] = None
    state: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class UniversityOut(BaseModel):
    id: int
    name: str
    code: str
    city: Optional[str] = None
    state: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[UniversityOut])
def list_universities(
    active_only: bool = Query(True),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Public listing of participating universities on EventSphere.
    Zero-login required.
    """
    # Seed standard initial universities if empty
    if db.query(University).count() == 0:
        initial = [
            University(name="Vellore Institute of Technology", code="VIT", city="Vellore", state="Tamil Nadu", domain="vit.ac.in", description="Premier technical university known for innovation and hackathons."),
            University(name="Indian Institute of Technology Madras", code="IITM", city="Chennai", state="Tamil Nadu", domain="iitm.ac.in", description="Institute of national importance with world-class engineering events."),
            University(name="BITS Pilani", code="BITS", city="Pilani", state="Rajasthan", domain="bits-pilani.ac.in", description="Renowned private deemed institute for science, engineering and research."),
            University(name="National Institute of Technology Trichy", code="NITT", city="Tiruchirappalli", state="Tamil Nadu", domain="nitt.edu", description="Top-ranked national institute of technology with vibrant technical festivals."),
            University(name="Delhi Technological University", code="DTU", city="New Delhi", state="Delhi", domain="dtu.ac.in", description="Historic technical university with prominent coding and robotics culture.")
        ]
        db.add_all(initial)
        db.commit()

    q = db.query(University)
    if active_only:
        q = q.filter(University.is_active == True)
    if search:
        q = q.filter(University.name.ilike(f"%{search}%") | University.code.ilike(f"%{search}%"))
    return q.order_by(University.name.asc()).all()


@router.post("", response_model=UniversityOut, status_code=201)
def create_university(
    payload: UniversityCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    """
    Global administrator registers a new participating university.
    """
    existing = db.query(University).filter((University.name == payload.name) | (University.code == payload.code.upper())).first()
    if existing:
        raise HTTPException(status_code=400, detail="University with this name or code already exists")

    uni = University(
        name=payload.name,
        code=payload.code.upper(),
        city=payload.city,
        state=payload.state,
        domain=payload.domain,
        description=payload.description,
        is_active=True,
    )
    db.add(uni)
    db.commit()
    db.refresh(uni)
    return uni


@router.put("/{uni_id}", response_model=UniversityOut)
def update_university(
    uni_id: int,
    payload: UniversityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    uni = db.query(University).filter(University.id == uni_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        if k == "code" and v:
            setattr(uni, k, v.upper())
        else:
            setattr(uni, k, v)

    db.commit()
    db.refresh(uni)
    return uni
