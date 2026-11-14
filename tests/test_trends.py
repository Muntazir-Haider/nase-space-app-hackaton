import pytest
from datetime import datetime, timezone, timedelta
import numpy as np
from backend.app.services.analytics.ols_trends import (
    ObservationPoint,
    compute_ols_slope,
    evaluate_indicator_trend,
    RHR_SLOPE_THRESHOLD,
    SLEEP_SLOPE_THRESHOLD,
    HRR_SLOPE_THRESHOLD,
)

def test_ols_slope_mathematical_precision():
    # Exactly +2.0 units per day over 4 consecutive days
    t0 = datetime(2026, 11, 10, 6, 0, 0, tzinfo=timezone.utc)
    timestamps = [t0 + timedelta(days=i) for i in range(4)]
    values = [60.0, 62.0, 64.0, 66.0]

    slope = compute_ols_slope(timestamps, values)
    assert slope == 2.0

    # Negative slope: -0.5 units per day
    neg_values = [8.0, 7.5, 7.0, 6.5]
    neg_slope = compute_ols_slope(timestamps, neg_values)
    assert neg_slope == -0.5

def test_rhr_adverse_trend_detection():
    # Baseline: mean 60.0, std_dev 2.0
    # Over 4 days: 62.0 -> 64.5 -> 67.0 -> 70.0 (Slope ~ +2.67 bpm/d, latest z = +5.0)
    t0 = datetime(2026, 11, 10, 6, 0, 0, tzinfo=timezone.utc)
    obs = [
        ObservationPoint(id=f"obs-{i}", value=v, observation_time=(t0 + timedelta(days=i)).isoformat())
        for i, v in enumerate([62.0, 64.5, 67.0, 70.0])
    ]

    result = evaluate_indicator_trend(
        indicator_key="RESTING_HEART_RATE",
        observations=obs,
        baseline_mean=60.0,
        baseline_std_dev=2.0,
    )

    assert result.is_adverse is True
    assert result.ols_slope >= RHR_SLOPE_THRESHOLD
    assert result.latest_z_score >= 1.5
    assert result.sample_count == 4

def test_sleep_debt_adverse_trend_detection():
    # Baseline: mean 7.5, std_dev 0.5
    # Over 4 days: 7.0 -> 6.5 -> 5.8 -> 5.0 (Slope ~ -0.66 hr/d, latest z = -5.0)
    t0 = datetime(2026, 11, 10, 6, 0, 0, tzinfo=timezone.utc)
    obs = [
        ObservationPoint(id=f"obs-{i}", value=v, observation_time=(t0 + timedelta(days=i)).isoformat())
        for i, v in enumerate([7.0, 6.5, 5.8, 5.0])
    ]

    result = evaluate_indicator_trend(
        indicator_key="SLEEP_DURATION",
        observations=obs,
        baseline_mean=7.5,
        baseline_std_dev=0.5,
    )

    assert result.is_adverse is True
    assert result.ols_slope <= SLEEP_SLOPE_THRESHOLD
    assert result.latest_z_score <= -1.5

def test_nominal_stable_trend_invariance():
    # Stable readings around baseline (mean 60.0, std 2.0): 60.2, 59.8, 60.5, 60.1
    t0 = datetime(2026, 11, 10, 6, 0, 0, tzinfo=timezone.utc)
    obs = [
        ObservationPoint(id=f"obs-{i}", value=v, observation_time=(t0 + timedelta(days=i)).isoformat())
        for i, v in enumerate([60.2, 59.8, 60.5, 60.1])
    ]

    result = evaluate_indicator_trend(
        indicator_key="RESTING_HEART_RATE",
        observations=obs,
        baseline_mean=60.0,
        baseline_std_dev=2.0,
    )

    assert result.is_adverse is False
    assert abs(result.ols_slope) < RHR_SLOPE_THRESHOLD

def test_insufficient_samples_suppresses_trend():
    # Only 2 points (< 3 required)
    t0 = datetime(2026, 11, 10, 6, 0, 0, tzinfo=timezone.utc)
    obs = [
        ObservationPoint(id="obs-1", value=75.0, observation_time=t0.isoformat()),
        ObservationPoint(id="obs-2", value=80.0, observation_time=(t0 + timedelta(days=1)).isoformat()),
    ]

    result = evaluate_indicator_trend(
        indicator_key="RESTING_HEART_RATE",
        observations=obs,
        baseline_mean=60.0,
        baseline_std_dev=2.0,
    )

    assert result.sample_count == 2
    assert result.ols_slope == 0.0
    assert result.is_adverse is False
