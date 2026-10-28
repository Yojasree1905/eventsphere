import os
import sys
import shutil

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# On Vercel serverless / AWS Lambda, the deployment directory is read-only.
# Copy seed database to writable /tmp/occasio.db on cold start.
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"):
    db_source = os.path.join(CURRENT_DIR, "occasio.db")
    tmp_db = "/tmp/occasio.db"
    if not os.path.exists(tmp_db) and os.path.exists(db_source):
        try:
            shutil.copyfile(db_source, tmp_db)
            print("[Vercel Init] Seed database copied to /tmp/occasio.db")
        except Exception as e:
            print(f"[Vercel Init] Failed copying database: {e}")

try:
    from app.main import app
except Exception as e:
    import traceback
    init_err = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()

    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def vercel_init_error(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend initialization failed on Vercel",
                "detail": str(e),
                "traceback": init_err.splitlines()
            }
        )
