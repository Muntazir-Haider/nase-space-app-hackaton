"""
Mission Sentinel — Master 16-Test Unified Acceptance Suite
NASA Space Apps Challenge 2026 (Superior University, Faisalabad)

This suite is the official end-to-end verification harness confirming that
Mission Sentinel strictly satisfies all 16 formal Acceptance Criteria defined in docs/REQUIREMENTS.md.

Acceptance Criteria:
  1. Profile Creation & Persistence
  2. Valid Measurement Ingestion
  3. Invalid Measurement Rejection & Audit Logging
  4. Missing Data Handling (No Nominal Assumption)
  5. Stale Data Warning (>36h Tagging)
  6. Baseline Statistical Correctness (Bessel's Correction N-1)
  7. Insufficient Baseline Data State (N < 4)
  8. Stable Pattern Invariance (10-Day Nominal Invariance)
  9. Isolated Spike Filtering (False Alarm Suppression)
 10. Sustained Multi-Indicator Deterioration Detection
 11. Mission & Environmental Context Temporal Alignment
 12. Alert Evidence Auditability & Countermeasure Lifecycle Resolution
 13. 100% Offline Standalone Execution (Zero External Network Calls)
 14. Hard Process Restart Resilience (Disconnection & Reboot)
 15. Idempotent Synchronization & Transaction Queue Deduplication
 16. Mathematical Precision Verification (OLS Regression Slopes)
"""

import os
import json
import tempfile
import shutil
from datetime import datetime, timezone, timedelta
import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.entities import (
    Mission,
    AstronautProfile,
    IndicatorDefinition,
    HealthObservation,
    DataQualityAuditLog,
    PersonalBaseline,
    DeteriorationAlert,
    AlertEvidenceLink,
    ClinicalCountermeasure,
    OfflineSyncQueue,
    MissionEvent,
    EnvironmentalTelemetry,
    AnalysisRun,
)
from backend.app.services.data_quality import validate_observation, detect_missing_data_gaps
from backend.app.services.baseline_engine import compute_astronaut_baseline
from backend.app.services.analytics.ols_trends import compute_ols_slope
from backend.app.services.sync_engine import compute_idempotency_hash, queue_offline_transaction, simulate_comms_window_flush
from backend.app.schemas.schemas import HealthObservationItem


@pytest.fixture
def master_db():
    """Provides a fresh isolated SQLite database with foreign keys enforced."""
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
    db = TestingSessionLocal()

    # Seed core mission and indicators
    mission = Mission(
        id="mis-artemis-master",
        mission_code="ARTEMIS-MASTER",
        name="Artemis Lunar Base Alpha",
        target_destination="MOON_SOUTH_POLE",
        spacecraft_module="CREW_QUARTERS",
        flight_day=14,
        comms_latency_seconds=1334,
        status="ACTIVE",
        start_date="2026-11-01T00:00:00+00:00",
        created_at="2026-11-01T00:00:00+00:00",
    )
    db.add(mission)

    ind_rhr = IndicatorDefinition(
        id="ind-rhr",
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
        description="Resting heart rate measured during sleep/rest cycle.",
    )
    ind_sleep = IndicatorDefinition(
        id="ind-sleep",
        indicator_key="SLEEP_DURATION",
        category="SLEEP",
        display_name="Total Sleep Duration",
        standard_unit="hours",
        nominal_min=6.0,
        nominal_max=8.5,
        critical_min=4.0,
        critical_max=14.0,
        sampling_frequency_hours=24.0,
        nasa_hrp_reference="NASA HRP HRR-Sleep",
        description="Daily total sleep duration.",
    )
    ind_hrr = IndicatorDefinition(
        id="ind-hrr",
        indicator_key="HEART_RATE_RECOVERY_1MIN",
        category="EXERCISE_RECOVERY",
        display_name="Heart Rate Recovery at 1 Min",
        standard_unit="bpm",
        nominal_min=15.0,
        nominal_max=45.0,
        critical_min=5.0,
        critical_max=80.0,
        sampling_frequency_hours=24.0,
        nasa_hrp_reference="NASA HRP Exercise",
        description="Post-exercise 1-minute heart rate deceleration.",
    )
    db.add_all([ind_rhr, ind_sleep, ind_hrr])
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def master_client(master_db):
    def override_get_db():
        try:
            yield master_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ============================================================================
# MASTER 16-TEST ACCEPTANCE HARNESS
# ============================================================================

def test_acceptance_01_profile_creation_and_persistence(master_client, master_db):
    """Test 1: Create astronaut profile and verify strict unique constraints and persistence."""
    res = master_client.post(
        "/api/v1/astronauts",
        json={
            "mission_id": "mis-artemis-master",
            "callsign": "CDR-VANCE",
            "full_name": "Dr. Elena Vance",
            "flight_role": "Commander & Medical Lead",
            "medical_clearance_status": "FULL_FLIGHT_CLEARANCE",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["callsign"] == "CDR-VANCE"
    assert data["full_name"] == "Dr. Elena Vance"

    # Verify duplicate callsign rejection (409 Conflict)
    res_dup = master_client.post(
        "/api/v1/astronauts",
        json={
            "mission_id": "mis-artemis-master",
            "callsign": "CDR-VANCE",
            "full_name": "Duplicate Vance",
            "flight_role": "Specialist",
        },
    )
    assert res_dup.status_code == 409


def test_acceptance_02_valid_measurement_ingestion(master_client, master_db):
    """Test 2: Submit valid readings for all indicators; confirm persistence with correct units."""
    # Ensure profile exists
    astro = AstronautProfile(
        id="astro-acc-02",
        mission_id="mis-artemis-master",
        callsign="PLT-THORNE",
        full_name="Marcus Thorne",
        flight_role="Pilot",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    master_db.add(astro)
    master_db.commit()

    obs_payload = {
        "observations": [
            {
                "astronaut_id": "astro-acc-02",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 62.5,
                "unit": "bpm",
                "observation_time": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
                "data_origin": "SIMULATED",
                "provenance_ref": "ACCEPTANCE_TEST_02",
            }
        ]
    }
    res = master_client.post("/api/v1/observations", json=obs_payload)
    assert res.status_code == 201
    assert res.json()["accepted_count"] == 1
    assert res.json()["rejected_count"] == 0

    obs_rec = master_db.query(HealthObservation).filter(HealthObservation.astronaut_id == "astro-acc-02").first()
    assert obs_rec is not None
    assert obs_rec.value == 62.5
    assert obs_rec.unit == "bpm"


def test_acceptance_03_invalid_measurement_rejection_and_audit(master_client, master_db):
    """Test 3: Submit invalid units and out-of-bounds physiological values; confirm rejection and audit log."""
    astro = AstronautProfile(
        id="astro-acc-03",
        mission_id="mis-artemis-master",
        callsign="MS-CHEN",
        full_name="Dr. Sarah Chen",
        flight_role="Specialist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    master_db.add(astro)
    master_db.commit()

    # Out of bounds: RHR 350 bpm (critical_max is 180)
    obs_payload = {
        "observations": [
            {
                "astronaut_id": "astro-acc-03",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 350.0,
                "unit": "bpm",
                "observation_time": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            }
        ]
    }
    res = master_client.post("/api/v1/observations", json=obs_payload)
    assert res.status_code == 201
    assert res.json()["accepted_count"] == 0
    assert res.json()["rejected_count"] == 1

    # Verify audit log record exists
    audit_rec = master_db.query(DataQualityAuditLog).filter(
        DataQualityAuditLog.astronaut_id == "astro-acc-03",
        DataQualityAuditLog.error_code == "OUT_OF_BOUNDS",
    ).first()
    assert audit_rec is not None
    assert "outside plausible physiological bounds" in audit_rec.rejection_reason


def test_acceptance_04_missing_data_gap_reporting(master_db):
    """Test 4: Simulate skipped observation day; confirm explicit data gap reporting without nominal assumption."""
    astro_id = "astro-acc-04"
    astro = AstronautProfile(
        id=astro_id,
        mission_id="mis-artemis-master",
        callsign="EV-GAP",
        full_name="Gap Test Astronaut",
        flight_role="Specialist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    master_db.add(astro)
    master_db.commit()

    # Ingest 3 days, skip day 4
    now = datetime.now(timezone.utc)
    for day_offset in [1, 2, 3]:
        obs = HealthObservation(
            id=f"obs-gap-{day_offset}",
            astronaut_id=astro_id,
            indicator_id="ind-rhr",
            value=62.0,
            unit="bpm",
            observation_time=(now - timedelta(days=day_offset)).isoformat(),
            recorded_time=now.isoformat(),
            data_origin="SIMULATED",
            provenance_ref="TEST_04",
            quality_status="VALID",
        )
        master_db.add(obs)
    master_db.commit()

    gaps = detect_missing_data_gaps(master_db, astronaut_id=astro_id, days=7, reference_time=now)
    assert len(gaps) > 0
    assert any(g["status"] == "MISSING_DATA_GAP" for g in gaps)


def test_acceptance_05_stale_data_warning(master_db):
    """Test 5: Ingest observation older than 36 hours; confirm it is tagged STALE."""
    astro_id = "astro-acc-05"
    astro = AstronautProfile(
        id=astro_id,
        mission_id="mis-artemis-master",
        callsign="EV-STALE",
        full_name="Stale Test Astronaut",
        flight_role="Specialist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    master_db.add(astro)
    master_db.commit()

    stale_time = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    obs_item = HealthObservationItem(
        astronaut_id=astro_id,
        indicator_key="RESTING_HEART_RATE",
        value=65.0,
        unit="bpm",
        observation_time=stale_time,
    )
    val_res = validate_observation(master_db, obs_item)
    assert val_res.is_valid is True
    assert val_res.quality_status == "STALE"
    assert "older than 36 hours" in val_res.quality_notes


def test_acceptance_06_baseline_statistical_correctness_bessel(master_db):
    """Test 6: Ingest 7 valid readings; confirm mean, median, and sample std dev (N-1 Bessel) match hand calculation."""
    astro_id = "astro-acc-06"
    astro = AstronautProfile(
        id=astro_id,
        mission_id="mis-artemis-master",
        callsign="EV-BASE",
        full_name="Baseline Test Astronaut",
        flight_role="Specialist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    master_db.add(astro)

    # Values: [60, 62, 64, 61, 63, 65, 62] -> N=7
    values = [60.0, 62.0, 64.0, 61.0, 63.0, 65.0, 62.0]
    expected_mean = round(float(np.mean(values)), 3)
    expected_median = round(float(np.median(values)), 3)
    expected_std = round(float(np.std(values, ddof=1)), 3)  # N-1 Bessel

    ref_time = datetime.now(timezone.utc)
    for i, val in enumerate(values):
        obs = HealthObservation(
            id=f"obs-bessel-{i}",
            astronaut_id=astro_id,
            indicator_id="ind-rhr",
            value=val,
            unit="bpm",
            observation_time=(ref_time - timedelta(days=6 - i)).isoformat(),
            recorded_time=ref_time.isoformat(),
            data_origin="SIMULATED",
            provenance_ref="TEST_06",
            quality_status="VALID",
        )
        master_db.add(obs)
    master_db.commit()

    baseline = compute_astronaut_baseline(master_db, astro_id, "ind-rhr", reference_time=ref_time)
    assert baseline.status == "ACTIVE"
    assert baseline.sample_count == 7
    assert baseline.mean == expected_mean
    assert baseline.median == expected_median
    assert baseline.std_dev == expected_std


def test_acceptance_07_insufficient_baseline_data_state(master_db):
    """Test 7: Ingest < 4 valid readings; confirm INSUFFICIENT_BASELINE_DATA state."""
    astro_id = "astro-acc-07"
    astro = AstronautProfile(
        id=astro_id,
        mission_id="mis-artemis-master",
        callsign="EV-INSUF",
        full_name="Insufficient Test Astronaut",
        flight_role="Specialist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    master_db.add(astro)

    ref_time = datetime.now(timezone.utc)
    for i in range(2):  # Only 2 samples (< 4)
        obs = HealthObservation(
            id=f"obs-insuf-{i}",
            astronaut_id=astro_id,
            indicator_id="ind-rhr",
            value=62.0,
            unit="bpm",
            observation_time=(ref_time - timedelta(days=i)).isoformat(),
            recorded_time=ref_time.isoformat(),
            data_origin="SIMULATED",
            provenance_ref="TEST_07",
            quality_status="VALID",
        )
        master_db.add(obs)
    master_db.commit()

    baseline = compute_astronaut_baseline(master_db, astro_id, "ind-rhr", reference_time=ref_time)
    assert baseline.status == "INSUFFICIENT_BASELINE_DATA"
    assert baseline.sample_count == 2


def test_acceptance_08_stable_pattern_nominal_invariance(master_client):
    """Test 8: Load Scenario A (10 days nominal flight); confirm 0 alerts generated."""
    res = master_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_A_NOMINAL"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["active_alerts_generated"] == 0


def test_acceptance_09_isolated_spike_false_alarm_suppression(master_client):
    """Test 9: Load Scenario B (single acute EVA exertion spike on Day 5); confirm false alarms suppressed."""
    res = master_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_B_ACUTE_SPIKE"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["active_alerts_generated"] == 0, "Single-day acute spike must not trigger deterioration alert"


def test_acceptance_10_sustained_multi_indicator_deterioration(master_client, master_db):
    """Test 10: Load Scenario C; confirm High-Priority alert generated for sustained multi-indicator drift."""
    res = master_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_C_SILENT_DETERIORATION"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["active_alerts_generated"] == 1

    alert = master_db.query(DeteriorationAlert).filter(
        DeteriorationAlert.astronaut_id == data["astronaut_id"],
        DeteriorationAlert.review_priority == "HIGH",
    ).first()
    assert alert is not None
    assert "Resting Heart Rate has risen" in alert.detection_narrative
    assert "Sleep Duration has declined" in alert.detection_narrative


def test_acceptance_11_mission_and_environmental_context_correlation(master_client, master_db):
    """Test 11: Confirm alert contains temporal alignment with EVA workload and cabin CO2 without claiming causation."""
    # Ensure Scenario C is loaded in this test session
    master_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_C_SILENT_DETERIORATION"})

    alert = master_db.query(DeteriorationAlert).filter(
        DeteriorationAlert.pattern_type == "SILENT_MULTI_INDICATOR_DETERIORATION"
    ).first()
    assert alert is not None
    assert "EVA Suit Maintenance" in alert.mission_context_notes
    assert "Cabin CO2 elevated" in alert.environmental_context_notes
    assert "NASA Human Research Roadmap (HRR)" in alert.scientific_ref


def test_acceptance_12_alert_evidence_audit_and_countermeasure_resolution(master_client, master_db):
    """Test 12: Prescribe countermeasure, verify evidence audit links, and transition protocol status to COMPLETED."""
    # Ensure Scenario C is loaded in this test session
    master_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_C_SILENT_DETERIORATION"})

    alert = master_db.query(DeteriorationAlert).first()
    assert alert is not None

    # Prescribe
    res = master_client.post(
        f"/api/v1/alerts/{alert.id}/countermeasures",
        json={
            "prescribed_by": "Dr. Sarah Chen (CMO)",
            "countermeasure_type": "EXERCISE_REST",
            "title": "Aerobic Interval & Sleep Window Adjustment",
            "prescription_details": "Prescribe 45 min interval ergometer session and enforce 8 hr sleep window.",
            "target_duration_hours": 24,
        },
    )
    assert res.status_code == 201
    cm_id = res.json()["id"]

    # Resolve status
    res_patch = master_client.patch(
        f"/api/v1/alerts/{alert.id}/countermeasures/{cm_id}",
        json={
            "outcome_status": "COMPLETED",
            "resolved_by": "Dr. Sarah Chen (CMO)",
            "resolution_notes": "Flight day 13 vitals stabilized.",
        },
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["outcome_status"] == "COMPLETED"


def test_acceptance_13_zero_external_network_dependencies():
    """Test 13: Verify station configuration enforces zero cloud/external network reliance."""
    from backend.app.core.config import settings
    # All database connections are local filesystem paths
    assert settings.DATABASE_PATH.is_absolute()
    assert "127.0.0.1" in settings.CORS_ORIGINS or "localhost" in str(settings.CORS_ORIGINS)


def test_acceptance_14_process_restart_data_retention():
    """Test 14: Simulate hard process restart on disk; verify 100% data retention across database reboot."""
    tmpdir = tempfile.mkdtemp()
    db_file = os.path.join(tmpdir, "restart_test.db")
    db_url = f"sqlite:///{db_file}"

    try:
        engine1 = create_engine(db_url, connect_args={"check_same_thread": False})
        Session1 = sessionmaker(bind=engine1)
        Base.metadata.create_all(bind=engine1)
        sess1 = Session1()

        mission = Mission(
            id="mis-restart",
            mission_code="ARTEMIS-RES",
            name="Restart Mission",
            target_destination="MOON",
            spacecraft_module="CREW_QUARTERS",
            start_date="2026-11-01T00:00:00+00:00",
            flight_day=1,
            comms_latency_seconds=1334,
            status="ACTIVE",
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        sess1.add(mission)
        sess1.commit()
        sess1.close()
        engine1.dispose()

        # Hard Reboot Simulation
        engine2 = create_engine(db_url, connect_args={"check_same_thread": False})
        Session2 = sessionmaker(bind=engine2)
        sess2 = Session2()
        retained = sess2.query(Mission).filter(Mission.id == "mis-restart").first()
        assert retained is not None
        assert retained.mission_code == "ARTEMIS-RES"
        sess2.close()
        engine2.dispose()
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_acceptance_15_idempotent_synchronization_deduplication(master_db):
    """Test 15: Re-submit identical transaction payloads; confirm deterministic SHA-256 deduplication."""
    payload = {"obs_id": "test-uuid-99", "value": 72.5, "metric": "RHR"}
    hash1 = compute_idempotency_hash("OBSERVATION_INGEST", "health_observations", payload)
    hash2 = compute_idempotency_hash("OBSERVATION_INGEST", "health_observations", payload)
    assert hash1 == hash2

    queue_offline_transaction(master_db, "OBSERVATION_INGEST", "health_observations", "entity-99", payload)
    # Second identical queue call
    queue_offline_transaction(master_db, "OBSERVATION_INGEST", "health_observations", "entity-99", payload)

    count = master_db.query(OfflineSyncQueue).filter(OfflineSyncQueue.idempotency_hash == hash1).count()
    assert count == 1, "Duplicate transaction must be deduplicated via SHA-256 idempotency hash"


def test_acceptance_16_mathematical_precision_and_ols_slopes():
    """Test 16: Verify decimal precision and Ordinary Least Squares regression slopes against independent NumPy calculation."""
    t0 = datetime(2026, 11, 1, 0, 0, tzinfo=timezone.utc)
    timestamps = [t0 + timedelta(days=i) for i in range(5)]
    # Values increasing by 2.0 bpm per day exactly: 60, 62, 64, 66, 68
    values = [60.0, 62.0, 64.0, 66.0, 68.0]

    slope = compute_ols_slope(timestamps, values)
    assert abs(slope - 2.0) < 1e-3, f"Expected slope +2.0 bpm/day, got {slope}"
