import os
import sys
import shutil

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

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
