import os
import sys
import shutil
import traceback

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

# Ensure api and backend are in sys.path
for p in [CURRENT_DIR, BACKEND_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Disable ReportLab C accelerators
os.environ["RL_CACHES"] = "0"
os.environ["REPORTLAB_DISABLE_ACCEL"] = "1"

# Prepare SQLite db in writable /tmp
tmp_db = "/tmp/occasio.db"
candidates = [
    os.path.join(CURRENT_DIR, "occasio.db"),
    os.path.join(CURRENT_DIR, "app", "occasio.db"),
    os.path.join(BACKEND_DIR, "occasio.db"),
    os.path.join(PROJECT_ROOT, "occasio.db"),
    "/var/task/api/occasio.db",
    "/var/task/occasio.db",
]
if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) < 1000:
    for cand in candidates:
        if os.path.isfile(cand):
            try:
                shutil.copyfile(cand, tmp_db)
                print(f"[Vercel Init] Seed database copied from {cand} to {tmp_db}")
                break
            except Exception as e:
                print(f"[Vercel Init] Copy failed: {e}")

_import_error = None
_actual_app = None

try:
    from app.main import app as _actual_app
except Exception as e:
    _import_error = traceback.format_exc()
    print(f"[Vercel Startup Exception] {_import_error}")

if _actual_app and not _import_error:
    app = _actual_app
else:
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse
    app = FastAPI(title="EventSphere Error")
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    def catch_all(path: str):
        return PlainTextResponse(f"VERCEL STARTUP EXCEPTION:\n\n{_import_error}", status_code=500)
