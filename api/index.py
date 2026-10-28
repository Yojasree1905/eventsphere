import os
import sys
import shutil

# 1. Resolve and mount backend directory onto sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# 2. In Vercel serverless environment, copy seed database to writable /tmp directory
if os.environ.get("VERCEL"):
    db_source = os.path.join(BACKEND_DIR, "occasio.db")
    tmp_db = "/tmp/occasio.db"
    if not os.path.exists(tmp_db) and os.path.exists(db_source):
        try:
            shutil.copyfile(db_source, tmp_db)
        except Exception as e:
            print(f"[Vercel Init] Failed copying seed database to /tmp: {e}")

# 3. Import FastAPI app from backend
from app.main import app
