import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, get_logger
from backend.app.core.errors import register_error_handlers
from backend.app.database import init_db, get_db
from backend.app.api import (
    astronauts_router,
    mission_router,
    observations_router,
    data_quality_router,
    environmental_router,
    baselines_router,
    alerts_router,
    runs_router,
    scenarios_router,
    sync_router,
    analytics_router,
)

# Initialize structured logging
setup_logging()
logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Mission Sentinel SQLite WAL database...")
    init_db()
    logger.info("Mission Sentinel station online and operational.")
    yield
    logger.info("Mission Sentinel station powering down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Autonomous, offline-first astronaut health intelligence and decision-support system for deep-space missions.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Register centralized error handlers
register_error_handlers(app)

# CORS middleware for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(astronauts_router, prefix=settings.API_V1_STR)
app.include_router(mission_router, prefix=settings.API_V1_STR)
app.include_router(observations_router, prefix=settings.API_V1_STR)
app.include_router(data_quality_router, prefix=settings.API_V1_STR)
app.include_router(environmental_router, prefix=settings.API_V1_STR)
app.include_router(baselines_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(runs_router, prefix=settings.API_V1_STR)
app.include_router(scenarios_router, prefix=settings.API_V1_STR)
app.include_router(sync_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "version": settings.VERSION,
        "mode": "OFFLINE_FIRST_LOCAL_MONOLITH",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    db_size = 0
    if settings.DATABASE_PATH.exists():
        try:
            db_size = os.path.getsize(settings.DATABASE_PATH)
        except OSError:
            pass

    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "offline_storage_ready": True,
        "database_file": str(settings.DATABASE_PATH.name),
        "database_path": str(settings.DATABASE_PATH),
        "database_size_bytes": db_size,
        "sqlite_mode": "WAL",
        "foreign_keys_enforced": True,
        "comms_latency": "22m 14s (One-Way Mars Sim)",
        "active_role": "CREW_MEDICAL_OFFICER",
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
    }

@app.get(f"{settings.API_V1_STR}/health/diagnostics")
def station_diagnostics(db: Session = Depends(get_db)):
    """Provides deep diagnostic metrics across all 14 SQLite relational tables."""
    tables = [
        "missions",
        "astronaut_profiles",
        "indicator_definitions",
        "health_observations",
        "environmental_telemetry",
        "data_quality_audit_log",
        "personal_baselines",
        "mission_events",
        "analysis_runs",
        "deterioration_alerts",
        "alert_evidence_links",
        "clinical_countermeasures",
        "cmo_followups",
        "offline_sync_queue",
    ]
    counts = {}
    for tbl in tables:
        try:
            result = db.execute(text(f"SELECT COUNT(*) FROM {tbl}"))
            counts[tbl] = result.scalar() or 0
        except Exception as e:
            counts[tbl] = f"Error: {str(e)}"

    db_size = 0
    if settings.DATABASE_PATH.exists():
        try:
            db_size = os.path.getsize(settings.DATABASE_PATH)
        except OSError:
            pass

    return {
        "station_status": "OPERATIONAL",
        "database_file": str(settings.DATABASE_PATH.name),
        "database_size_bytes": db_size,
        "table_counts": counts,
        "total_records": sum(v for v in counts.values() if isinstance(v, int)),
        "sqlite_journal_mode": "WAL",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }
