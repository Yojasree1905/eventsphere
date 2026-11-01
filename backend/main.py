import os
import sys
import traceback

# Disable ReportLab C accelerators to ensure stable pure-Python execution on serverless
os.environ["RL_CACHES"] = "0"
os.environ["REPORTLAB_DISABLE_ACCEL"] = "1"

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
except Exception as e:
    err_trace = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="EventSphere Init Error Boundary")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def report_error(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Backend initialization failed on Vercel",
                "error": str(e),
                "traceback": err_trace.splitlines(),
            },
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
