import os
import shutil
from pydantic_settings import BaseSettings, SettingsConfigDict


def _is_serverless_or_readonly() -> bool:
    serverless_vars = ["VERCEL", "VERCEL_ENV", "VERCEL_REGION", "AWS_LAMBDA_FUNCTION_NAME", "LAMBDA_TASK_ROOT", "AWS_EXECUTION_ENV"]
    if any(os.environ.get(k) for k in serverless_vars):
        return True
    try:
        test_file = "./.test_write_probe"
        with open(test_file, "w") as f:
            f.write("1")
        if os.path.exists(test_file):
            os.remove(test_file)
        return False
    except Exception:
        return True


def _resolve_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        if env_url.startswith("postgres://"):
            return env_url.replace("postgres://", "postgresql://", 1)
        return env_url

    # Serverless / Read-only container handling (Vercel, AWS Lambda)
    if _is_serverless_or_readonly():
        tmp_db = "/tmp/occasio.db"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        root_dir = os.path.dirname(parent_dir)
        search_paths = [
            os.path.join(parent_dir, "occasio.db"),
            os.path.join(current_dir, "occasio.db"),
            os.path.join(root_dir, "occasio.db"),
            os.path.join(root_dir, "backend", "occasio.db"),
            os.path.join(root_dir, "api", "occasio.db"),
            os.path.join(os.getcwd(), "backend", "occasio.db"),
            os.path.join(os.getcwd(), "api", "occasio.db"),
            os.path.join(os.getcwd(), "occasio.db"),
            "/var/task/api/occasio.db",
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

    # Local development: resolve absolute path to avoid split databases
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(curr_dir)
    backend_db = os.path.join(backend_dir, "occasio.db")
    if os.path.isfile(backend_db):
        return f"sqlite:///{backend_db.replace(chr(92), '/')}"

    root_dir = os.path.dirname(backend_dir)
    root_db = os.path.join(root_dir, "occasio.db")
    if os.path.isfile(root_db):
        return f"sqlite:///{root_db.replace(chr(92), '/')}"

    return "sqlite:///./occasio.db"


class Settings(BaseSettings):
    DATABASE_URL: str = _resolve_database_url()
    SECRET_KEY: str = "change-me-to-a-long-random-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FIRST_ADMIN_EMAIL: str = "admin@occasio.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@1234"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
