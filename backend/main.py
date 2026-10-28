import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI, Response
    app = FastAPI(title="EventSphere Error Reporter")
    err_msg = traceback.format_exc()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def catch_all_errors(path: str):
        return Response(
            content=f"=== VERCEL STARTUP / IMPORT TRACEBACK ===\n\n{err_msg}",
            media_type="text/plain",
            status_code=500,
        )
