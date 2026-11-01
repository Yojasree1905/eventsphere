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

# If running on Vercel / serverless, ensure pre-seeded database is copied to writable /tmp
serverless_indicators = ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "AWS_LAMBDA_FUNCTION_NAME", "LAMBDA_TASK_ROOT", "AWS_EXECUTION_ENV"]
if any(os.environ.get(k) for k in serverless_indicators):
    import shutil
    CURRENT_APP_DIR = os.path.dirname(os.path.abspath(__file__))
    PARENT_DIR = os.path.dirname(CURRENT_APP_DIR)
    ROOT_DIR = os.path.dirname(PARENT_DIR)
    tmp_db = "/tmp/occasio.db"
    candidate_dbs = [
        os.path.join(PARENT_DIR, "occasio.db"),
        os.path.join(CURRENT_APP_DIR, "occasio.db"),
        os.path.join(ROOT_DIR, "occasio.db"),
        os.path.join(ROOT_DIR, "backend", "occasio.db"),
        os.path.join(ROOT_DIR, "api", "occasio.db"),
        "/var/task/api/occasio.db",
        "/var/task/backend/occasio.db",
        "/var/task/occasio.db",
    ]
    for db_src in candidate_dbs:
        if os.path.isfile(db_src):
            try:
                if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) < 1000:
                    shutil.copyfile(db_src, tmp_db)
                    print(f"[Vercel Init] Seed database copied from {db_src} to {tmp_db}")
                break
            except Exception as e:
                print(f"[Vercel Init] Failed copying database from {db_src}: {e}")

# ── Create all tables (EventSphere full schema) ──────────────────────────────
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Init Warning] create_all: {e}")

# ── Seed default admin ───────────────────────────────────────────────────────
from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import create_user

def _seed_admin() -> None:
    try:
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
    except Exception as e:
        print(f"[Init Warning] _seed_admin: {e}")

try:
    _seed_admin()
except Exception as e:
    print(f"[Init Warning] _seed_admin call: {e}")

# ── Application ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="EventSphere Unified Platform",
    description="Intelligent Multi-University Event Management and Discovery Platform",
    version="2.0.0",
)

@app.on_event("startup")
def startup_firestore():
    try:
        from app.services.firestore_service import init_firestore
        init_firestore()
    except Exception as e:
        print(f"[Firestore Startup Warning] {e}")

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(f"BACKEND EXCEPTION: {traceback.format_exc()}", status_code=500)

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


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "app": "EventSphere"}


# ── Single-Host Unified Frontend Mounting ────────────────────────────────────
def _find_frontend_dist() -> str | None:
    current_file = os.path.abspath(__file__)
    candidates = [
        # Relative to backend/app/main.py -> ../../../frontend/dist
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(current_file))), "frontend", "dist")),
        # Relative to current working dir
        os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
        os.path.abspath(os.path.join(os.getcwd(), "dist")),
        # Subdirectory in backend
        os.path.abspath(os.path.join(os.path.dirname(current_file), "dist")),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(current_file)), "dist")),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(current_file)), "static")),
        "/app/frontend/dist",
        "/var/task/frontend/dist",
    ]
    for p in candidates:
        if p and os.path.isdir(p) and os.path.isfile(os.path.join(p, "index.html")):
            return p
    return None

FRONTEND_DIST_DIR = _find_frontend_dist()

if FRONTEND_DIST_DIR and os.path.exists(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve favicon & icons directly if requested
    for static_file in ["favicon.svg", "icons.svg"]:
        f_path = os.path.join(FRONTEND_DIST_DIR, static_file)
        if os.path.isfile(f_path):
            @app.get(f"/{static_file}", include_in_schema=False)
            async def serve_static_file(target=f_path):
                return FileResponse(target)

    # Root route serves index.html
    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))

    # Serve index.html for all non-API paths (SPA client-side routing fallback)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        target_file = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)

        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

