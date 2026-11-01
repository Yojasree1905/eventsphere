import os
import sys
import shutil
import traceback
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Disable reportlab accelerators & configure temp font cache
os.environ["RL_CACHES"] = "/tmp"
os.environ["REPORTLAB_DISABLE_ACCEL"] = "1"

# Prepare /tmp db
tmp_db = "/tmp/occasio.db"
for db_candidate in [os.path.join(CURRENT_DIR, "occasio.db"), os.path.join(os.path.dirname(CURRENT_DIR), "occasio.db")]:
    if os.path.isfile(db_candidate) and (not os.path.exists(tmp_db) or os.path.getsize(tmp_db) < 1000):
        try:
            shutil.copyfile(db_candidate, tmp_db)
            break
        except Exception:
            pass

startup_error = None
try:
    from app.main import app as _actual_app
except Exception as e:
    startup_error = traceback.format_exc()
    print(f"[CRITICAL STARTUP ERROR] {startup_error}")

if startup_error:
    app = FastAPI(title="EventSphere Diagnostic")
    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    async def report_crash(full_path: str):
        return PlainTextResponse(f"BACKEND INITIALIZATION CRASH:\n\n{startup_error}", status_code=200)
else:
    app = _actual_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
