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

from app.main import app
