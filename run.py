import os
import sys
import subprocess
import uvicorn

# ── Ensure backend is in Python path ─────────────────────────────────────────
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ── Ensure frontend production bundle exists ─────────────────────────────────
dist_index = os.path.join(ROOT_DIR, "frontend", "dist", "index.html")
if not os.path.exists(dist_index):
    print("[EventSphere] Building React production bundle with Vite...")
    try:
        subprocess.run(
            ["npm", "run", "build"],
            cwd=os.path.join(ROOT_DIR, "frontend"),
            shell=True,
            check=True,
        )
        print("[EventSphere] Frontend bundle ready!")
    except Exception as e:
        print(f"[EventSphere Warning] Could not pre-build frontend: {e}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print("\n" + "=" * 70)
    print(f"  EventSphere Unified Single-Host Platform")
    print(f"  * Unified Web App:   http://localhost:{port}")
    print(f"  * Teams Management: http://localhost:{port}/teams")
    print(f"  * API Endpoints:     http://localhost:{port}/api")
    print(f"  * API Documentation: http://localhost:{port}/docs")
    print("=" * 70 + "\n")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,
        app_dir=BACKEND_DIR,
    )
