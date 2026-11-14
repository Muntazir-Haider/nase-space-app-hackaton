import pytest
import numpy as np
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.services.seed_data import seed_default_indicators
from backend.app.models.entities import Mission, AstronautProfile, IndicatorDefinition
from backend.app.services.baseline_engine import compute_astronaut_baseline

@pytest.fixture
def client_with_baseline_env():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    with TestingSessionLocal() as session:
        seed_default_indicators(session)
        mission = Mission(
            mission_code="ARTEMIS-III",
            name="Artemis III Expedition",
            target_destination="LUNAR_SURFACE",
            spacecraft_module="ORION_MPC_V",
            flight_day=10,
            comms_latency_seconds=3,
            status="ACTIVE",
            start_date="2026-11-01T00:00:00Z",
        )
        session.add(mission)
        session.commit()

        astro = AstronautProfile(
            id="astro-thorne-002",
            mission_id=mission.id,
            callsign="ARTEMIS-02",
            full_name="Marcus Thorne",
            flight_role="PILOT",
        )
        session.add(astro)
        session.commit()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    
    yield client
    
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_acceptance_6_baseline_statistical_correctness(client_with_baseline_env):
    client = client_with_baseline_env
    
    # 7 known daily readings for Resting Heart Rate
    known_values = [60.0, 62.0, 61.0, 63.0, 59.0, 64.0, 62.0]
    expected_mean = round(float(np.mean(known_values)), 3)    # 61.571
    expected_median = round(float(np.median(known_values)), 3) # 62.0
    expected_std = round(float(np.std(known_values, ddof=1)), 3) # 1.718
    
    now = datetime.now(timezone.utc)
    obs_payload = {"observations": []}
    for i, val in enumerate(known_values):
        # 6 days ago up to now (7 daily observations in 7-day calendar window)
        obs_time = (now - timedelta(days=6 - i)).isoformat()
        obs_payload["observations"].append({
            "astronaut_id": "astro-thorne-002",
            "indicator_key": "RESTING_HEART_RATE",
            "value": val,
            "unit": "bpm",
            "observation_time": obs_time,
        })
    
    # Ingest observations
    ingest_res = client.post("/api/v1/observations", json=obs_payload)
    assert ingest_res.status_code == 201
    assert ingest_res.json()["accepted_count"] == 7

    # Trigger baseline compute via API
    baseline_res = client.get("/api/v1/astronauts/astro-thorne-002/baseline")
    assert baseline_res.status_code == 200
    baselines = baseline_res.json()
    
    rhr_baseline = next((b for b in baselines if b["indicator_key"] == "RESTING_HEART_RATE"), None)
    assert rhr_baseline is not None
    assert rhr_baseline["status"] == "ACTIVE"
    assert rhr_baseline["sample_count"] == 7
    assert rhr_baseline["mean"] == expected_mean
    assert rhr_baseline["median"] == expected_median
    assert rhr_baseline["std_dev"] == expected_std
    assert rhr_baseline["version"] == 1

def test_acceptance_7_insufficient_baseline_data(client_with_baseline_env):
    client = client_with_baseline_env
    now = datetime.now(timezone.utc)
    
    # Ingest only 2 observations (N=2 < MIN_SAMPLES=4)
    obs_payload = {
        "observations": [
            {
                "astronaut_id": "astro-thorne-002",
                "indicator_key": "SLEEP_DURATION",
                "value": 7.2,
                "unit": "hours",
                "observation_time": (now - timedelta(days=2)).isoformat(),
            },
            {
                "astronaut_id": "astro-thorne-002",
                "indicator_key": "SLEEP_DURATION",
                "value": 7.5,
                "unit": "hours",
                "observation_time": (now - timedelta(days=1)).isoformat(),
            }
        ]
    }
    
    ingest_res = client.post("/api/v1/observations", json=obs_payload)
    assert ingest_res.status_code == 201
    
    baseline_res = client.get("/api/v1/astronauts/astro-thorne-002/baseline")
    assert baseline_res.status_code == 200
    baselines = baseline_res.json()
    
    sleep_baseline = next((b for b in baselines if b["indicator_key"] == "SLEEP_DURATION"), None)
    assert sleep_baseline is not None
    assert sleep_baseline["status"] == "INSUFFICIENT_BASELINE_DATA"
    assert sleep_baseline["sample_count"] == 2
    assert sleep_baseline["mean"] == 0.0

def test_acceptance_16_baseline_versioning_and_recompute(client_with_baseline_env):
    client = client_with_baseline_env
    now = datetime.now(timezone.utc)
    
    # 1. Start with 2 readings -> Insufficient (Version 1)
    obs_batch_1 = {
        "observations": [
            {"astronaut_id": "astro-thorne-002", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 25.0, "unit": "bpm", "observation_time": (now - timedelta(days=3)).isoformat()},
            {"astronaut_id": "astro-thorne-002", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 26.0, "unit": "bpm", "observation_time": (now - timedelta(days=2)).isoformat()},
        ]
    }
    client.post("/api/v1/observations", json=obs_batch_1)
    
    v1_res = client.get("/api/v1/astronauts/astro-thorne-002/baseline")
    hrr_v1 = next(b for b in v1_res.json() if b["indicator_key"] == "HEART_RATE_RECOVERY_1MIN")
    assert hrr_v1["status"] == "INSUFFICIENT_BASELINE_DATA"
    assert hrr_v1["version"] == 1

    # 2. Add 3 more readings (Total N=5 >= 4) -> Recompute triggers Version 2 (ACTIVE)
    obs_batch_2 = {
        "observations": [
            {"astronaut_id": "astro-thorne-002", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 27.0, "unit": "bpm", "observation_time": (now - timedelta(days=1)).isoformat()},
            {"astronaut_id": "astro-thorne-002", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 25.5, "unit": "bpm", "observation_time": now.isoformat()},
            {"astronaut_id": "astro-thorne-002", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 26.5, "unit": "bpm", "observation_time": (now - timedelta(hours=12)).isoformat()},
        ]
    }
    client.post("/api/v1/observations", json=obs_batch_2)

    recompute_res = client.post("/api/v1/astronauts/astro-thorne-002/baseline/recompute")
    assert recompute_res.status_code == 200
    hrr_v2 = next(b for b in recompute_res.json() if b["indicator_key"] == "HEART_RATE_RECOVERY_1MIN")
    assert hrr_v2["status"] == "ACTIVE"
    assert hrr_v2["sample_count"] == 5
    assert hrr_v2["version"] == 2
    assert hrr_v2["mean"] == 26.0
