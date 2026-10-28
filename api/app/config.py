from pydantic_settings import BaseSettings, SettingsConfigDict


import os
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        # Normalize postgres:// to postgresql:// for SQLAlchemy if provided
        if env_url.startswith("postgres://"):
            return env_url.replace("postgres://", "postgresql://", 1)
        return env_url
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"):
        return "sqlite:////tmp/occasio.db"
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
