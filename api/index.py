import os
import sys
import shutil

backend_url = os.environ.get("BACKEND_URL")

if backend_url:
    # ── Vercel Services Binding Mode ──────────────────────────────────────────
    # The 'backend' service internal URL is injected into BACKEND_URL via Vercel binding.
    # The 'api' public service proxies requests to the internal 'backend' service.
    import httpx
    from fastapi import FastAPI, Request, Response
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="EventSphere API Gateway")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    client = httpx.AsyncClient(base_url=backend_url.rstrip("/"), timeout=60.0)

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def proxy_to_backend(request: Request, path: str):
        target_path = request.url.path
        headers = dict(request.headers)
        headers.pop("host", None)
        body = await request.body()
        resp = await client.request(
            method=request.method,
            url=target_path,
            params=request.query_params,
            headers=headers,
            content=body,
        )
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=dict(resp.headers),
        )
else:
    # ── Direct / Monolithic Mode ──────────────────────────────────────────────
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
    BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)

    if os.environ.get("VERCEL"):
        db_source = os.path.join(BACKEND_DIR, "occasio.db")
        tmp_db = "/tmp/occasio.db"
        if not os.path.exists(tmp_db) and os.path.exists(db_source):
            try:
                shutil.copyfile(db_source, tmp_db)
            except Exception as e:
                print(f"[Vercel Init] Failed copying seed database to /tmp: {e}")

    from app.main import app
