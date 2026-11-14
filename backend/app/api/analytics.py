"""
Mission Sentinel — Analytics & Machine Learning Benchmark API
NASA Space Apps Challenge 2026 (Superior University, Faisalabad)

Exposes endpoints for benchmarking deterministic rule-based algorithms against
unsupervised machine learning models (Isolation Forest and Local Outlier Factor).
"""

from fastapi import APIRouter, status
from backend.app.schemas.schemas import BenchmarkEvaluationReportOut
from backend.app.services.analytics.experimental_ml import (
    run_benchmark_evaluation,
    BenchmarkEvaluationReport,
)

router = APIRouter(prefix="/analytics", tags=["Experimental ML Benchmark"])

# Cached report instance for fast immediate GET responses
_CACHED_REPORT = None


@router.get("/benchmark-evaluation", response_model=BenchmarkEvaluationReportOut)
def get_benchmark_evaluation():
    """
    Returns the comprehensive aerospace medicine benchmark report comparing
    Mission Sentinel's deterministic Rule-Based OLS Engine against unsupervised
    Isolation Forest and Local Outlier Factor across Scenarios A, B, and C.
    """
    global _CACHED_REPORT
    if _CACHED_REPORT is None:
        _CACHED_REPORT = run_benchmark_evaluation()
    return _CACHED_REPORT


@router.post("/benchmark-evaluation/run", response_model=BenchmarkEvaluationReportOut, status_code=status.HTTP_200_OK)
def trigger_benchmark_evaluation():
    """
    Executes a fresh live benchmark run measuring execution latency,
    false-positive suppression on isolated spikes, and detection latency
    on silent multi-indicator physiological drift.
    """
    global _CACHED_REPORT
    _CACHED_REPORT = run_benchmark_evaluation()
    return _CACHED_REPORT
