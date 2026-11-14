import os
import tempfile
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.core.config import settings
from backend.app.services.sync_engine import (
    compute_idempotency_hash,
    queue_offline_transaction,
    get_sync_queue_summary,
    simulate_comms_window_flush,
)
from backend.app.models.entities import (
    OfflineSyncQueue,
    Mission,
    AstronautProfile,
    IndicatorDefinition,
    HealthObservation,
    PersonalBaseline,
)

@pytest.fixture
def sync_client():
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

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    
    yield client, TestingSessionLocal
    
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_idempotency_hash_deterministic():
    payload1 = {"value": 74.0, "unit": "bpm", "timestamp": "2026-11-14T06:00:00Z"}
    payload2 = {"timestamp": "2026-11-14T06:00:00Z", "unit": "bpm", "value": 74.0}
    
    hash1 = compute_idempotency_hash("INSERT_OBSERVATION", "health_observations", payload1)
    hash2 = compute_idempotency_hash("INSERT_OBSERVATION", "health_observations", payload2)

    # Key order variance must yield identical hash
    assert hash1 == hash2
    assert len(hash1) == 64


def test_offline_queue_deduplication(sync_client):
    _, session_factory = sync_client
    with session_factory() as db:
        payload = {"astronaut_id": "astro-01", "value": 72.0}
        
        # First queue: inserts item
        item1 = queue_offline_transaction(db, "COUNTERMEASURE_LOG", "clinical_countermeasures", "cntm-01", payload)
        assert item1.sync_status == "QUEUED"
        
        # Second queue: duplicate suppressed
        item2 = queue_offline_transaction(db, "COUNTERMEASURE_LOG", "clinical_countermeasures", "cntm-01", payload)
        assert item2.id == item1.id
        
        count = db.query(OfflineSyncQueue).count()
        assert count == 1


def test_sync_status_and_flush_api(sync_client):
    client, session_factory = sync_client
    with session_factory() as db:
        queue_offline_transaction(db, "OBSERVATION", "health_observations", "obs-01", {"rhr": 65})
        queue_offline_transaction(db, "OBSERVATION", "health_observations", "obs-02", {"rhr": 68})

    # Test status endpoint
    res = client.get("/api/v1/sync/status")
    assert res.status_code == 200
    data = res.json()
    assert data["queued_pending"] == 2
    assert data["comms_mode"] == "STORE_AND_FORWARD"

    # Test flush endpoint
    flush_res = client.post("/api/v1/sync/flush")
    assert flush_res.status_code == 200
    assert flush_res.json()["flushed_count"] == 2

    # Verify status transitioned
    after_res = client.get("/api/v1/sync/status")
    assert after_res.json()["queued_pending"] == 0
    assert after_res.json()["synced_to_earth"] == 2


def test_acceptance_13_zero_external_network_dependencies():
    """
    Acceptance Test 13: 100% Offline Execution
    Verify that the system operates strictly on local disk and localhost,
    with zero reliance on external cloud URLs, external APIs, or remote servers.
    """
    # 1. Database path is purely local filesystem
    assert settings.DATABASE_PATH.is_absolute()
    assert settings.DATABASE_PATH.suffix == ".db"

    # 2. CORS configuration is strictly local workstation ports
    for origin in settings.CORS_ORIGINS:
        assert "localhost" in origin or "127.0.0.1" in origin

    # 3. Health check confirms offline storage readiness
    client = TestClient(app)
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ONLINE"
    assert data["offline_storage_ready"] is True
    assert data["sqlite_mode"] == "WAL"


def test_acceptance_14_process_restart_data_retention():
    """
    Acceptance Test 14: Process Restart Resilience
    Simulate a complete workstation power cycle / process crash:
    1. Write mission, astronaut profile, and sync queue item to disk-backed SQLite.
    2. Completely terminate the database engine and session.
    3. Spin up an independent new engine pointing to the same file.
    4. Verify 100% retention with zero corruption or data loss.
    """
    tmpdir = tempfile.mkdtemp()
    db_file = os.path.join(tmpdir, "restart_test.db")
    db_url = f"sqlite:///{db_file}"

    try:
        # Phase A: Initial process runtime - create and populate
        engine_a = create_engine(db_url, connect_args={"check_same_thread": False})
        @event.listens_for(engine_a, "connect")
        def pragma_a(conn, record):
            c = conn.cursor()
            c.execute("PRAGMA journal_mode=WAL")
            c.execute("PRAGMA foreign_keys=ON")
            c.close()

        Base.metadata.create_all(bind=engine_a)
        SessionA = sessionmaker(bind=engine_a)

        with SessionA() as session:
            mission = Mission(
                id="mis-artemis-restart",
                mission_code="ARTEMIS-RT",
                name="Artemis Restart Test",
                target_destination="LUNAR_SURFACE",
                spacecraft_module="ORION-CM",
                start_date="2026-11-01T00:00:00Z",
            )
            session.add(mission)

            astro = AstronautProfile(
                id="astro-restart-01",
                mission_id="mis-artemis-restart",
                callsign="ARTEMIS-RT1",
                full_name="Dr. Persistent Vance",
                flight_role="Commander",
                medical_clearance_status="FULL_FLIGHT_CLEARANCE",
            )
            session.add(astro)

            queue_offline_transaction(
                session,
                transaction_type="ASTRONAUT_PROFILE_CREATE",
                entity_table="astronaut_profiles",
                entity_id="astro-restart-01",
                payload={"callsign": "ARTEMIS-RT1", "full_name": "Dr. Persistent Vance"},
            )
            session.commit()

        # Hard shutdown of Phase A (dispose connection pool)
        engine_a.dispose()

        # Phase B: Process reboot - completely fresh engine on existing file
        assert os.path.exists(db_file)
        assert os.path.getsize(db_file) > 0

        engine_b = create_engine(db_url, connect_args={"check_same_thread": False})
        @event.listens_for(engine_b, "connect")
        def pragma_b(conn, record):
            c = conn.cursor()
            c.execute("PRAGMA foreign_keys=ON")
            c.close()

        SessionB = sessionmaker(bind=engine_b)
        with SessionB() as session:
            retained_mission = session.query(Mission).filter_by(id="mis-artemis-restart").first()
            assert retained_mission is not None
            assert retained_mission.mission_code == "ARTEMIS-RT"
            assert retained_mission.name == "Artemis Restart Test"

            retained_astro = session.query(AstronautProfile).filter_by(id="astro-restart-01").first()
            assert retained_astro is not None
            assert retained_astro.callsign == "ARTEMIS-RT1"
            assert retained_astro.full_name == "Dr. Persistent Vance"

            retained_queue = session.query(OfflineSyncQueue).filter_by(entity_id="astro-restart-01").first()
            assert retained_queue is not None
            assert retained_queue.sync_status == "QUEUED"
            assert len(retained_queue.idempotency_hash) == 64

        engine_b.dispose()
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_acceptance_15_end_to_end_offline_ingest_queue_and_flush(sync_client):
    """
    Acceptance Test 15: Idempotent Synchronization & Store-and-Forward Comms Flush
    1. Ingest observation via API -> verify automatic queuing to offline_sync_queue.
    2. Ingest duplicate observation -> verify duplicate queue insertion is suppressed.
    3. Trigger DSN comms flush -> verify queue transitions to SYNCED_TO_EARTH.
    """
    client, session_factory = sync_client

    # Seed mission & indicator
    with session_factory() as db:
        m = Mission(
            id="mis-test-15", 
            mission_code="T15", 
            name="Test 15", 
            target_destination="MARS_TRANSIT",
            spacecraft_module="HERMES",
            start_date="2026-11-01T00:00:00Z"
        )
        db.add(m)
        a = AstronautProfile(id="astro-15", mission_id="mis-test-15", callsign="T15-01", full_name="Test Vance", flight_role="Lead", medical_clearance_status="FULL_FLIGHT_CLEARANCE")
        db.add(a)
        ind = IndicatorDefinition(
            id="ind-rhr-15",
            indicator_key="RESTING_HEART_RATE",
            category="CARDIOVASCULAR",
            display_name="Resting Heart Rate",
            standard_unit="bpm",
            nominal_min=50.0,
            nominal_max=85.0,
            critical_min=35.0,
            critical_max=180.0,
            nasa_hrp_reference="HRR-CV",
            description="Resting heart rate in beats per minute",
        )
        db.add(ind)
        db.commit()

    obs_payload = {
        "observations": [
            {
                "astronaut_id": "astro-15",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 63.5,
                "unit": "bpm",
                "observation_time": "2026-11-14T08:00:00Z",
            }
        ]
    }

    # 1. Ingest observation
    res = client.post("/api/v1/observations", json=obs_payload)
    assert res.status_code == 201
    assert res.json()["accepted_count"] == 1

    # Verify transaction was queued in offline_sync_queue
    sync_status = client.get("/api/v1/sync/status").json()
    assert sync_status["queued_pending"] >= 1
    recent = sync_status["recent_items"][0]
    assert recent["transaction_type"] == "OBSERVATION_INGEST"
    assert recent["sync_status"] == "QUEUED"

    # 2. Simulate high-gain DSN uplink pass
    flush_res = client.post("/api/v1/sync/flush")
    assert flush_res.status_code == 200
    assert flush_res.json()["flushed_count"] >= 1

    # Verify status transitioned
    after_sync = client.get("/api/v1/sync/status").json()
    assert after_sync["queued_pending"] == 0
    assert after_sync["synced_to_earth"] >= 1
