import os
import sys

# Disable ReportLab C accelerators to ensure stable pure-Python execution on serverless
os.environ["RL_CACHES"] = "0"
os.environ["REPORTLAB_DISABLE_ACCEL"] = "1"

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
