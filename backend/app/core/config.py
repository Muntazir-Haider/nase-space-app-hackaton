import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mission Sentinel"
    PROJECT_SUBTITLE: str = "Astronaut Health Intelligence and Medical Review Support System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite local file persistence
    DATA_DIRECTORY: Path = DATA_DIR
    DATABASE_PATH: Path = DATA_DIR / "sentinel.db"
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH.as_posix()}"
    
    # CORS Configuration for local frontend
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

# Ensure local data directory exists
settings.DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
