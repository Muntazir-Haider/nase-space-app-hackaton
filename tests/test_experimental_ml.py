import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.analytics.experimental_ml import (
    run_benchmark_evaluation,
    build_scenario_a_data,
    build_scenario_b_data,
    build_scenario_c_data,
    extract_features,
    run_isolation_forest,
    run_local_outlier_factor,
    evaluate_rule_based_ols,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_feature_extraction():
    days, base_rhr, base_sleep, base_hrr = build_scenario_a_data()
    features = extract_features(days, base_rhr, base_sleep, base_hrr)
    assert features.shape == (10, 3)
    # Check that nominal days have reasonable z-scores (between -2.5 and +2.5)
    assert (-2.5 <= features).all()
    assert (features <= 2.5).all()


def test_scenario_b_spike_behavior():
    """
    Critical Aerospace Medicine Test:
    In Scenario B (single acute EVA spike on Day 5), the deterministic rule-based OLS engine
    must suppress false alarms (0 alerts) because it lacks 3-day multi-indicator persistence.
    Meanwhile, unconstrained ML models (Isolation Forest / LOF) flag Day 5 as an anomaly
    because it is an isolated outlier in 3D feature space.
    """
    days, base_rhr, base_sleep, base_hrr = build_scenario_b_data()
    feat = extract_features(days, base_rhr, base_sleep, base_hrr)

    # 1. Rule-Based OLS
    rb_alerts = evaluate_rule_based_ols(days, base_rhr, base_sleep, base_hrr)
    assert sum(rb_alerts) == 0, "Rule-based engine must suppress single acute exertion spike to avoid alarm fatigue"

    # 2. Isolation Forest
    _, if_is_anom = run_isolation_forest(feat, contamination=0.15, random_state=42)
    # Day 5 (index 4) should be flagged as anomaly due to extreme distance
    assert if_is_anom[4] == True, "Isolation Forest correctly flags extreme single-day outlier in feature space"


def test_scenario_c_silent_deterioration_detection():
    """
    Verifies that in Scenario C (Hero Silent Deterioration), both the rule-based OLS engine
    and the unsupervised ML models detect the physiological drift.
    """
    days, base_rhr, base_sleep, base_hrr = build_scenario_c_data()
    feat = extract_features(days, base_rhr, base_sleep, base_hrr)

    # 1. Rule-Based OLS flags alert by Day 11 (after 3 consecutive days of drift)
    rb_alerts = evaluate_rule_based_ols(days, base_rhr, base_sleep, base_hrr)
    assert any(rb_alerts), "Rule-based engine must trigger alert on sustained multi-indicator drift"
    first_rb_day = next(i + 1 for i, a in enumerate(rb_alerts) if a)
    assert first_rb_day in [10, 11]

    # 2. Isolation Forest detects elevated anomaly scores during drift window (Days 8-12)
    if_scores, if_is_anom = run_isolation_forest(feat, contamination=0.25, random_state=42)
    # Anomaly scores on days 10-12 must be significantly higher than days 1-5
    baseline_avg_score = float(if_scores[0:5].mean())
    drift_avg_score = float(if_scores[8:12].mean())
    assert drift_avg_score > baseline_avg_score, "Drift window must exhibit higher anomaly score than baseline"


def test_benchmark_report_generation():
    """Verifies that the full benchmark evaluation report runs cleanly and produces all expected comparison metrics."""
    report = run_benchmark_evaluation()
    assert report.execution_duration_ms > 0
    assert len(report.comparison_matrix) == 3

    model_names = [m.model_name for m in report.comparison_matrix]
    assert "Mission Sentinel Rule-Based OLS Engine" in model_names
    assert "Isolation Forest (Scikit-Learn)" in model_names
    assert "Local Outlier Factor (LOF)" in model_names

    # Verify explainability score ranking: Rule-based (10) > Isolation Forest (6) > LOF (4)
    rb_metric = next(m for m in report.comparison_matrix if "Rule-Based" in m.model_name)
    if_metric = next(m for m in report.comparison_matrix if "Isolation Forest" in m.model_name)
    assert rb_metric.explainability_score_out_of_10 == 10
    assert if_metric.explainability_score_out_of_10 == 6
    assert rb_metric.scenario_b_false_positives == 0

    assert len(report.daily_progression_scenario_c) == 12
    assert len(report.daily_progression_scenario_b) == 10
    assert len(report.synthesis_conclusions) >= 4


def test_api_analytics_endpoints(client):
    """Tests GET and POST /api/v1/analytics/benchmark-evaluation endpoints."""
    res_get = client.get("/api/v1/analytics/benchmark-evaluation")
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert "comparison_matrix" in data_get
    assert len(data_get["comparison_matrix"]) == 3
    assert len(data_get["daily_progression_scenario_c"]) == 12

    res_post = client.post("/api/v1/analytics/benchmark-evaluation/run")
    assert res_post.status_code == 200
    data_post = res_post.json()
    assert data_post["timestamp_utc"] is not None
    assert len(data_post["comparison_matrix"]) == 3
