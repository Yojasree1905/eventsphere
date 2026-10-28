import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import engine
import app.models  # noqa: F401 – registers all ORM models with Base
from app.database import Base
from app.routers import (
    auth,
    events,
    schedules,
    participants,
    registrations,
    monitoring,
    feedbacks,
    leaderboards,
    certificates,
    teams,
    attendance,
    recommendations,
    universities,
    judges,
)

# ── Create all tables (EventSphere full schema) ──────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Seed default admin ───────────────────────────────────────────────────────
from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import create_user

def _seed_admin() -> None:
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first():
            create_user(
                db,
                email=settings.FIRST_ADMIN_EMAIL,
                full_name="Super Admin",
                password=settings.FIRST_ADMIN_PASSWORD,
                is_superadmin=True,
            )
            print(f"[seed] Created admin user: {settings.FIRST_ADMIN_EMAIL}")
    finally:
        db.close()

_seed_admin()

# ── Application ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="EventSphere Unified Platform",
    description="Intelligent Multi-University Event Management and Discovery Platform",
    version="2.0.0",
)

@app.on_event("startup")
def startup_firestore():
    from app.services.firestore_service import init_firestore
    init_firestore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 9 Modules: Complete EventSphere Lifecycle APIs
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(schedules.router)
app.include_router(participants.router)
app.include_router(registrations.router)
app.include_router(teams.router)
app.include_router(attendance.router)
app.include_router(monitoring.router)
app.include_router(feedbacks.router)
app.include_router(leaderboards.router)
app.include_router(certificates.router)
app.include_router(recommendations.router)
app.include_router(universities.router)
app.include_router(judges.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "EventSphere"}


# ── Single-Host Unified Frontend Mounting ────────────────────────────────────
# Locate frontend/dist relative to backend root
FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
)

if os.path.exists(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html for all non-API paths (SPA client-side routing fallback)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API calls to proceed or 404 naturally
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API endpoint not found")

        target_file = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)

        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        return FileResponse(index_file)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
