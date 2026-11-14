from sqlalchemy.orm import Session
from backend.app.models.entities import IndicatorDefinition

DEFAULT_INDICATORS = [
    {
        "indicator_key": "RESTING_HEART_RATE",
        "category": "CARDIOVASCULAR",
        "display_name": "Resting Heart Rate",
        "standard_unit": "bpm",
        "nominal_min": 50.0,
        "nominal_max": 85.0,
        "critical_min": 30.0,
        "critical_max": 220.0,
        "sampling_frequency_hours": 24.0,
        "nasa_hrp_reference": "NASA HRP HRR-CV (Risk of Cardiovascular Adaptations)",
        "description": "Daily resting pulse measurement taken upon waking to monitor cephalad fluid shifts and autonomic tone.",
    },
    {
        "indicator_key": "SLEEP_DURATION",
        "category": "SLEEP",
        "display_name": "Sleep Duration",
        "standard_unit": "hours",
        "nominal_min": 6.0,
        "nominal_max": 8.5,
        "critical_min": 0.0,
        "critical_max": 24.0,
        "sampling_frequency_hours": 24.0,
        "nasa_hrp_reference": "NASA HRP HRR-Sleep (Risk of Performance Decrements due to Sleep Loss)",
        "description": "Total nocturnal sleep duration to detect circadian disruption and cumulative sleep debt.",
    },
    {
        "indicator_key": "HEART_RATE_RECOVERY_1MIN",
        "category": "EXERCISE_RECOVERY",
        "display_name": "Heart Rate Recovery at 1 Min",
        "standard_unit": "bpm",
        "nominal_min": 15.0,
        "nominal_max": 45.0,
        "critical_min": 0.0,
        "critical_max": 100.0,
        "sampling_frequency_hours": 24.0,
        "nasa_hrp_reference": "NASA HRP Exercise (Risk of Decrements in Health Due to Inadequate Exercise)",
        "description": "Drop in heart rate 60 seconds post-cessation of countermeasure exercise (ARED/T2) measuring cardiac recovery velocity.",
    },
    {
        "indicator_key": "CABIN_CO2_PPM",
        "category": "ENVIRONMENTAL",
        "display_name": "Cabin Carbon Dioxide",
        "standard_unit": "ppm",
        "nominal_min": 400.0,
        "nominal_max": 2500.0,
        "critical_min": 0.0,
        "critical_max": 20000.0,
        "sampling_frequency_hours": 1.0,
        "nasa_hrp_reference": "NASA HIDH Life Support Standards",
        "description": "Atmospheric CO2 concentration in crew quarters and operational modules.",
    },
    {
        "indicator_key": "AMBIENT_RADIATION_USV",
        "category": "ENVIRONMENTAL",
        "display_name": "Ambient Radiation Dosimetry",
        "standard_unit": "uSv/day",
        "nominal_min": 200.0,
        "nominal_max": 600.0,
        "critical_min": 0.0,
        "critical_max": 50000.0,
        "sampling_frequency_hours": 24.0,
        "nasa_hrp_reference": "NASA HRP Radiation (Risk of Space Radiation Health Effects)",
        "description": "Daily ionizing radiation dose rate recorded by active spacecraft dosimeters.",
    },
]

def seed_default_indicators(db: Session):
    for ind_data in DEFAULT_INDICATORS:
        existing = db.query(IndicatorDefinition).filter_by(indicator_key=ind_data["indicator_key"]).first()
        if not existing:
            indicator = IndicatorDefinition(**ind_data)
            db.add(indicator)
    db.commit()
