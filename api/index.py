import os
import sys
import shutil
import traceback

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        db_source = os.path.join(BACKEND_DIR, "occasio.db")
        tmp_db = "/tmp/occasio.db"
        if not os.path.exists(tmp_db) and os.path.exists(db_source):
            try:
                shutil.copyfile(db_source, tmp_db)
            except Exception:
                pass

    from app.main import app
except Exception as e:
    from fastapi import FastAPI, Response
    app = FastAPI(title="EventSphere API Error Reporter")
    err_msg = traceback.format_exc()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def catch_all_api_errors(path: str):
        return Response(
            content=f"=== VERCEL API STARTUP TRACEBACK ===\n\n{err_msg}",
            media_type="text/plain",
            status_code=500,
        )
