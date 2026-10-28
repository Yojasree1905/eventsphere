import os
import shutil
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        if env_url.startswith("postgres://"):
            return env_url.replace("postgres://", "postgresql://", 1)
        return env_url

    # Serverless writable SQLite handling
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"):
        tmp_db = "/tmp/occasio.db"
        # Locate seed database from backend root or lambda task root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(current_dir)
        search_paths = [
            os.path.join(backend_dir, "occasio.db"),
            os.path.join(os.getcwd(), "backend", "occasio.db"),
            os.path.join(os.getcwd(), "occasio.db"),
            "/var/task/backend/occasio.db",
            "/var/task/occasio.db",
        ]
        for src in search_paths:
            if os.path.isfile(src):
                try:
                    if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) < 1000:
                        shutil.copyfile(src, tmp_db)
                        print(f"[Vercel Init] Copied seed db from {src} to {tmp_db}")
                    break
                except Exception as e:
                    print(f"[Vercel Init] Failed copy from {src}: {e}")
        return "sqlite:////tmp/occasio.db"

    # Local development
    try:
        test_file = "./.test_write"
        with open(test_file, "w") as f:
            f.write("1")
        if os.path.exists(test_file):
            os.remove(test_file)
        return "sqlite:///./occasio.db"
    except Exception:
        return "sqlite:////tmp/occasio.db"


class Settings(BaseSettings):
    DATABASE_URL: str = _resolve_database_url()
    SECRET_KEY: str = "change-me-to-a-long-random-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FIRST_ADMIN_EMAIL: str = "admin@occasio.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@1234"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
