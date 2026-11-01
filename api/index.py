import os
import sys
import shutil

# Ensure api directory is at the top of sys.path so 'app' imports from api/app
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Disable ReportLab C accelerators to ensure pure-Python execution on serverless
os.environ["RL_CACHES"] = "0"
os.environ["REPORTLAB_DISABLE_ACCEL"] = "1"

# When executing in serverless / read-only environment, copy seed SQLite db to writable /tmp
tmp_db = "/tmp/occasio.db"
candidates = [
    os.path.join(CURRENT_DIR, "occasio.db"),
    os.path.join(CURRENT_DIR, "app", "occasio.db"),
    "/var/task/api/occasio.db",
    "/var/task/occasio.db",
]
if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) < 1000:
    for cand in candidates:
        if os.path.isfile(cand):
            try:
                shutil.copyfile(cand, tmp_db)
                print(f"[Vercel Init] Seed database successfully copied from {cand} to {tmp_db}")
                break
            except Exception as e:
                print(f"[Vercel Init] Failed copying seed database: {e}")

from app.main import app
