import os
import sys
import shutil

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Serverless SQLite handling
serverless_indicators = ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "AWS_LAMBDA_FUNCTION_NAME", "LAMBDA_TASK_ROOT"]
if any(os.environ.get(k) for k in serverless_indicators):
    tmp_db = "/tmp/occasio.db"
    src_db = os.path.join(CURRENT_DIR, "occasio.db")
    if not os.path.exists(tmp_db) and os.path.isfile(src_db):
        try:
            shutil.copyfile(src_db, tmp_db)
        except Exception:
            pass

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
