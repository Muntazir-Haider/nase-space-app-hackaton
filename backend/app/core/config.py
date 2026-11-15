import os
from pathlib import Path
from typing import Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mission Sentinel"
    PROJECT_SUBTITLE: str = "Astronaut Health Intelligence and Medical Review Support System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Persistence: SQLite Local File (Offline Spacecraft) or Neon PostgreSQL (Online Cloud)
    DATA_DIRECTORY: Path = DATA_DIR
    DATABASE_PATH: Path = DATA_DIR / "sentinel.db"
    DATABASE_URL: Optional[str] = None
    NEON_DATABASE_URL: Optional[str] = None
    
    # CORS Configuration for frontend
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def resolve_database_url(self) -> "Settings":
        url = self.NEON_DATABASE_URL or self.DATABASE_URL
        if url and url.strip():
            cleaned = url.strip()
            # Normalize legacy postgres:// prefix to postgresql:// for SQLAlchemy
            if cleaned.startswith("postgres://"):
                cleaned = cleaned.replace("postgres://", "postgresql://", 1)
            # Remove channel_binding parameter if present (libpq SCRAM timeout on Windows)
            if "channel_binding=" in cleaned:
                import re
                cleaned = re.sub(r"[?&]channel_binding=[^&]*", "", cleaned)
                if "?" not in cleaned and "&" in cleaned:
                    cleaned = cleaned.replace("&", "?", 1)
            self.DATABASE_URL = cleaned
        else:
            self.DATABASE_URL = f"sqlite:///{self.DATABASE_PATH.as_posix()}"
        return self

settings = Settings()

# Ensure local data directory exists
settings.DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)

