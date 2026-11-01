import os
import sys
import traceback

# Disable ReportLab C accelerators to ensure stable pure-Python execution on serverless
os.environ["RL_CACHES"] = "0"
os.environ["REPORTLAB_DISABLE_ACCEL"] = "1"

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

backend_import_error = None
_actual_app = None

try:
    from app.main import app as _actual_app
except Exception as e:
    backend_import_error = traceback.format_exc()

from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse

# Define app statically at module level for Vercel AST scanner
app = FastAPI(title="EventSphere")

@app.get("/health")
@app.get("/api/health")
def health_check():
    if backend_import_error:
        return PlainTextResponse(
            f"=== VERCEL INITIALIZATION CRASH TRACEBACK ===\n\n{backend_import_error}",
            status_code=500,
        )
    return {"status": "ok", "app": "EventSphere", "serverless": bool(os.environ.get("VERCEL"))}

if _actual_app:
    # Include all routes from full EventSphere app
    existing_paths = {"/health", "/api/health"}
    for route in _actual_app.router.routes:
        if getattr(route, "path", None) not in existing_paths:
            app.router.routes.append(route)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
