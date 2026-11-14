from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timezone
from dateutil import parser as date_parser
import numpy as np

# Threshold constants grounded in NASA HRP research
RHR_SLOPE_THRESHOLD = 0.8         # +0.8 bpm / day
RHR_Z_THRESHOLD = 1.5             # +1.5 standard deviations
SLEEP_SLOPE_THRESHOLD = -0.25     # -0.25 hours / day
SLEEP_Z_THRESHOLD = -1.5          # -1.5 standard deviations
HRR_SLOPE_THRESHOLD = -1.5        # -1.5 bpm / day
HRR_Z_THRESHOLD = -1.5            # -1.5 standard deviations

MIN_TREND_SAMPLES = 3

@dataclass
class ObservationPoint:
    id: str
    value: float
    observation_time: str

@dataclass
class TrendResult:
    indicator_key: str
    sample_count: int
    ols_slope: float
    baseline_mean: float
    baseline_std_dev: float
    latest_value: float
    latest_z_score: float
    mean_z_score: float
    is_adverse: bool
    observation_ids: List[str]
    window_start: str
    window_end: str

def compute_ols_slope(timestamps: List[datetime], values: List[float]) -> float:
    """
    Computes the Ordinary Least Squares (OLS) linear regression slope
    in units of value change per 24-hour day.
    """
    if len(values) < 2:
        return 0.0
    
    t0 = timestamps[0]
    # Represent time as elapsed days from t0
    x = np.array([(t - t0).total_seconds() / 86400.0 for t in timestamps], dtype=float)
    y = np.array(values, dtype=float)
    
    x_range = x[-1] - x[0]
    if x_range <= 0.0 or np.all(x == x[0]):
        # All samples at identical time
        return 0.0
    
    # y = m * x + c -> slope is m
    slope, _ = np.polyfit(x, y, 1)
    return round(float(slope), 4)

def evaluate_indicator_trend(
    indicator_key: str,
    observations: List[ObservationPoint],
    baseline_mean: float,
    baseline_std_dev: float,
) -> TrendResult:
    """
    Evaluates 3-to-5 day sliding window trend for a specific indicator
    against its active baseline parameters.
    """
    if not observations:
        return TrendResult(
            indicator_key=indicator_key,
            sample_count=0,
            ols_slope=0.0,
            baseline_mean=baseline_mean,
            baseline_std_dev=baseline_std_dev,
            latest_value=0.0,
            latest_z_score=0.0,
            mean_z_score=0.0,
            is_adverse=False,
            observation_ids=[],
            window_start="",
            window_end="",
        )

    # Sort observations chronologically
    sorted_obs = sorted(
        observations,
        key=lambda o: date_parser.isoparse(o.observation_time)
    )

    timestamps = [date_parser.isoparse(o.observation_time) for o in sorted_obs]
    values = [o.value for o in sorted_obs]
    obs_ids = [o.id for o in sorted_obs]
    sample_count = len(sorted_obs)

    # Calculate z-scores using active baseline
    std_safe = baseline_std_dev if baseline_std_dev > 0.0 else 0.01
    z_scores = [(v - baseline_mean) / std_safe for v in values]
    
    latest_val = round(float(values[-1]), 2)
    latest_z = round(float(z_scores[-1]), 2)
    mean_z = round(float(np.mean(z_scores)), 2)

    # Compute OLS slope if minimum samples met
    if sample_count >= MIN_TREND_SAMPLES:
        slope = compute_ols_slope(timestamps, values)
    else:
        slope = 0.0

    # Determine adverse drift based on NASA HRP thresholds
    is_adverse = False
    if sample_count >= MIN_TREND_SAMPLES:
        if indicator_key == "RESTING_HEART_RATE":
            # Upward cardiovascular drift
            if slope >= RHR_SLOPE_THRESHOLD and (mean_z >= RHR_Z_THRESHOLD or latest_z >= RHR_Z_THRESHOLD):
                is_adverse = True
        elif indicator_key == "SLEEP_DURATION":
            # Downward circadian sleep debt
            if slope <= SLEEP_SLOPE_THRESHOLD and (mean_z <= SLEEP_Z_THRESHOLD or latest_z <= SLEEP_Z_THRESHOLD):
                is_adverse = True
        elif indicator_key == "HEART_RATE_RECOVERY_1MIN":
            # Delayed post-exercise cardiac deceleration
            if slope <= HRR_SLOPE_THRESHOLD and (mean_z <= HRR_Z_THRESHOLD or latest_z <= HRR_Z_THRESHOLD):
                is_adverse = True

    return TrendResult(
        indicator_key=indicator_key,
        sample_count=sample_count,
        ols_slope=round(slope, 3),
        baseline_mean=round(baseline_mean, 3),
        baseline_std_dev=round(baseline_std_dev, 3),
        latest_value=latest_val,
        latest_z_score=latest_z,
        mean_z_score=mean_z,
        is_adverse=is_adverse,
        observation_ids=obs_ids,
        window_start=sorted_obs[0].observation_time,
        window_end=sorted_obs[-1].observation_time,
    )
