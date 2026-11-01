from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.models.participant import Participant
from app.schemas.auth import GoogleAuthRequest, LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import authenticate_user, create_access_token, hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user)
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if (payload.role or "").lower() == "admin":
        raise HTTPException(
            status_code=400,
            detail="There is only one Global Administrator account on EventSphere. Please sign in directly using the platform administrator credentials.",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role or "participant",
        college_name=payload.college_name,
        department=payload.department,
        is_superadmin=(payload.role == "admin"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If registering as participant, sync with Participant directory
    if new_user.role == "participant":
        p = db.query(Participant).filter(Participant.email == new_user.email).first()
        if not p:
            p = Participant(
                full_name=new_user.full_name,
                email=new_user.email,
                college_name=new_user.college_name,
                department=new_user.department,
            )
            db.add(p)
            db.commit()

    # Real-time Cloud Firestore synchronization
    try:
        from app.services.firestore_service import sync_document
        u_data = {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "college_name": new_user.college_name,
            "department": new_user.department,
            "is_active": new_user.is_active,
            "is_superadmin": new_user.is_superadmin,
            "created_at": new_user.created_at,
        }
        sync_document("users", str(new_user.id), u_data)
    except Exception as e:
        pass

    token = create_access_token({"sub": new_user.email})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(new_user)
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate via Google Sign-In.
    If the account exists, signs in.
    If not, automatically provisions an EventSphere account and syncs to Firestore.
    """
    import secrets
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        random_pwd = secrets.token_urlsafe(16)
        user = User(
            email=email_clean,
            full_name=payload.full_name.strip() or "Google User",
            hashed_password=hash_password(random_pwd),
            role=payload.role or "participant",
            college_name=payload.college_name or "VIT Vellore",
            department=payload.department or "General",
            is_active=True,
            is_superadmin=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if user.role == "participant":
            p = db.query(Participant).filter(Participant.email == user.email).first()
            if not p:
                p = Participant(
                    full_name=user.full_name,
                    email=user.email,
                    college_name=user.college_name,
                    department=user.department,
                )
                db.add(p)
                db.commit()

        # Real-time Cloud Firestore synchronization
        try:
            from app.services.firestore_service import sync_document
            u_data = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "college_name": user.college_name,
                "department": user.department,
                "is_active": user.is_active,
                "is_superadmin": user.is_superadmin,
                "created_at": user.created_at,
            }
            sync_document("users", str(user.id), u_data)
        except Exception:
            pass

    token = create_access_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user)
    )

