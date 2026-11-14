from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database import init_db
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
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables on startup
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Autonomous, offline-first astronaut health intelligence and decision-support system for deep-space missions.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

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
    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "offline_storage_ready": True,
        "database_file": str(settings.DATABASE_PATH.name),
        "active_role": "CREW_MEDICAL_OFFICER",
    }
