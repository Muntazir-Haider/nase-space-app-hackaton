from backend.app.api.astronauts import router as astronauts_router, mission_router
from backend.app.api.observations import router as observations_router
from backend.app.api.data_quality import router as data_quality_router
from backend.app.api.environmental import router as environmental_router
from backend.app.api.baselines import router as baselines_router
from backend.app.api.alerts import router as alerts_router, runs_router
from backend.app.api.scenarios import router as scenarios_router
from backend.app.api.sync import router as sync_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.reports import router as reports_router

__all__ = [
    "astronauts_router",
    "mission_router",
    "observations_router",
    "data_quality_router",
    "environmental_router",
    "baselines_router",
    "alerts_router",
    "runs_router",
    "scenarios_router",
    "sync_router",
    "analytics_router",
    "reports_router",
]

