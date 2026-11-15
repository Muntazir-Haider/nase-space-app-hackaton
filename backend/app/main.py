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
    reports_router,
    auth_router,
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
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)

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
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    db_size = 0
    if is_sqlite and settings.DATABASE_PATH.exists():
        try:
            db_size = os.path.getsize(settings.DATABASE_PATH)
        except OSError:
            pass

    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "offline_storage_ready": True,
        "database_engine": "SQLite WAL" if is_sqlite else "PostgreSQL (Neon)",
        "database_provider": "SQLite (Local Spacecraft Storage)" if is_sqlite else "Neon Serverless PostgreSQL (Cloud Connected)",
        "database_file": str(settings.DATABASE_PATH.name) if is_sqlite else "neondb",
        "database_path": str(settings.DATABASE_PATH) if is_sqlite else "cloud://neon.tech/postgresql",
        "database_size_bytes": db_size,
        "sqlite_mode": "WAL" if is_sqlite else "N/A (PostgreSQL Cloud)",
        "foreign_keys_enforced": True,
        "comms_latency": "22m 14s (One-Way Mars Sim)",
        "active_role": "CREW_MEDICAL_OFFICER",
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
    }

@app.get(f"{settings.API_V1_STR}/health/diagnostics")
def station_diagnostics(db: Session = Depends(get_db)):
    """Provides deep diagnostic metrics across all 14 relational tables (SQLite or Neon PostgreSQL)."""
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
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
    if is_sqlite and settings.DATABASE_PATH.exists():
        try:
            db_size = os.path.getsize(settings.DATABASE_PATH)
        except OSError:
            pass

    return {
        "station_status": "OPERATIONAL",
        "database_engine": "SQLite WAL" if is_sqlite else "PostgreSQL (Neon)",
        "database_file": str(settings.DATABASE_PATH.name) if is_sqlite else "neondb",
        "database_size_bytes": db_size,
        "table_counts": counts,
        "total_records": sum(v for v in counts.values() if isinstance(v, int)),
        "sqlite_journal_mode": "WAL" if is_sqlite else "N/A (PostgreSQL Cloud)",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }

@app.get(f"{settings.API_V1_STR}/health/database/snapshot")
def export_database_snapshot(db: Session = Depends(get_db)):
    """Exports a comprehensive offline JSON snapshot backup of all 14 SQLite relational tables."""
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
    snapshot_data = {}
    total_records = 0
    for tbl in tables:
        try:
            result = db.execute(text(f"SELECT * FROM {tbl}"))
            cols = result.keys()
            rows = [dict(zip(cols, row)) for row in result.fetchall()]
            snapshot_data[tbl] = rows
            total_records += len(rows)
        except Exception as e:
            snapshot_data[tbl] = {"error": str(e)}

    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "snapshot_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "total_tables": len(tables),
        "total_records": total_records,
        "data": snapshot_data,
    }

