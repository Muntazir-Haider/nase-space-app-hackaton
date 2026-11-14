import pytest
from sqlalchemy import create_engine, inspect, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from backend.app.database import Base
from backend.app.models.entities import (
    Mission,
    AstronautProfile,
    IndicatorDefinition,
    HealthObservation,
    EnvironmentalTelemetry,
    DataQualityAuditLog,
    PersonalBaseline,
    MissionEvent,
    AnalysisRun,
    DeteriorationAlert,
    AlertEvidenceLink,
    ClinicalCountermeasure,
    CMOFollowup,
    OfflineSyncQueue,
    generate_uuid,
    get_utc_now_iso,
)

@pytest.fixture
def db_session():
    # In-memory SQLite with foreign key enforcement
    engine = create_engine("sqlite:///:memory:")
    
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_all_tables_created(db_session):
    inspector = inspect(db_session.bind)
    tables = inspector.get_table_names()
    
    expected_tables = {
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
    }
    
    assert expected_tables.issubset(set(tables)), f"Missing tables: {expected_tables - set(tables)}"

def test_foreign_key_and_cascade_behavior(db_session):
    # 1. Create a Mission
    mission = Mission(
        mission_code="ARTEMIS-III",
        name="Artemis III Lunar Expedition",
        target_destination="LUNAR_SOUTH_POLE",
        spacecraft_module="ORION_MPC_V",
        flight_day=14,
        comms_latency_seconds=3,
        status="ACTIVE",
        start_date="2026-11-01T00:00:00Z",
    )
    db_session.add(mission)
    db_session.commit()

    # 2. Create an AstronautProfile
    astro = AstronautProfile(
        mission_id=mission.id,
        callsign="ARTEMIS-01",
        full_name="Dr. Elena Vance",
        flight_role="COMMANDER",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
    )
    db_session.add(astro)
    db_session.commit()

    # 3. Create an IndicatorDefinition
    indicator = IndicatorDefinition(
        indicator_key="RESTING_HEART_RATE",
        category="CARDIOVASCULAR",
        display_name="Resting Heart Rate",
        standard_unit="bpm",
        nominal_min=50.0,
        nominal_max=85.0,
        critical_min=35.0,
        critical_max=180.0,
        sampling_frequency_hours=24.0,
        nasa_hrp_reference="NASA HRP HRR-CV",
        description="Daily morning resting pulse.",
    )
    db_session.add(indicator)
    db_session.commit()

    # 4. Create an Observation
    obs = HealthObservation(
        astronaut_id=astro.id,
        indicator_id=indicator.id,
        value=62.5,
        unit="bpm",
        observation_time="2026-11-14T06:00:00Z",
        data_origin="SIMULATED",
        provenance_ref="OSDR-ANALOG",
        quality_status="VALID",
    )
    db_session.add(obs)
    db_session.commit()

    # Verify query works
    retrieved_astro = db_session.query(AstronautProfile).filter_by(callsign="ARTEMIS-01").first()
    assert retrieved_astro is not None
    assert len(retrieved_astro.observations) == 1
    assert retrieved_astro.observations[0].value == 62.5

    # 5. Verify Cascade Delete: Deleting astronaut deletes observations
    db_session.delete(retrieved_astro)
    db_session.commit()

    remaining_obs = db_session.query(HealthObservation).filter_by(id=obs.id).first()
    assert remaining_obs is None, "Cascade delete failed: observation still exists after astronaut deleted."

def test_unique_constraints(db_session):
    mission = Mission(
        mission_code="ARTEMIS-UNIQUE",
        name="Test Unique Mission",
        target_destination="LUNAR_ORBIT",
        spacecraft_module="GATEWAY",
        flight_day=1,
        comms_latency_seconds=1,
        status="ACTIVE",
        start_date="2026-11-01T00:00:00Z",
    )
    db_session.add(mission)
    db_session.commit()

    astro1 = AstronautProfile(
        mission_id=mission.id,
        callsign="DUPLICATE-CALLSIGN",
        full_name="Astronaut Alpha",
        flight_role="PILOT",
    )
    db_session.add(astro1)
    db_session.commit()

    astro2 = AstronautProfile(
        mission_id=mission.id,
        callsign="DUPLICATE-CALLSIGN",
        full_name="Astronaut Beta",
        flight_role="SPECIALIST",
    )
    db_session.add(astro2)

    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
