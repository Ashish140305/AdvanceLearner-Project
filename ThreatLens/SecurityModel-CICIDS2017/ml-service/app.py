from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

# ============================================================
# CICIDS2017 ML Service
# Loads the trained Random Forest + Isolation Forest models
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR.parent / "models"

RF_PATH = MODEL_DIR / "random_forest_day_validation.pkl"
IF_PATH = MODEL_DIR / "isolation_forest_day_validation.pkl"
SCALER_PATH = MODEL_DIR / "isolation_forest_scaler.pkl"

# Frozen IF normalization references from the model-development phase.
# IF anomaly score = -IsolationForest.decision_function()
IF_REFERENCE_MIN = -0.182769
IF_REFERENCE_P99 = 0.134223

app = FastAPI(
    title="CICIDS2017 ML Detection Service",
    version="1.0.0",
    description="Random Forest classification + Isolation Forest anomaly scoring"
)

# ------------------------------------------------------------
# Load models once when the service starts
# ------------------------------------------------------------

try:
    rf_model = joblib.load(RF_PATH)
    if_model = joblib.load(IF_PATH)
    if_scaler = joblib.load(SCALER_PATH)

    # The saved scaler contains the exact final 63-feature order.
    FEATURE_NAMES = list(if_scaler.feature_names_in_)

except Exception as e:
    raise RuntimeError(
        f"Could not load CICIDS2017 model artifacts. "
        f"Expected files in: {MODEL_DIR}\nError: {e}"
    )


# ------------------------------------------------------------
# Request schema
# ------------------------------------------------------------

class PredictionRequest(BaseModel):
    # Send the 63 CICIDS2017 feature values as a JSON object.
    features: Dict[str, Any] = Field(
        ...,
        description="Dictionary containing the 63 final CICIDS2017 features"
    )


# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

def validate_and_prepare_features(features: Dict[str, Any]) -> pd.DataFrame:
    """
    Validate that all required model features are present and
    return them in the exact order used during training.
    """

    if not isinstance(features, dict):
        raise HTTPException(
            status_code=400,
            detail="'features' must be a JSON object/dictionary."
        )

    missing = [f for f in FEATURE_NAMES if f not in features]

    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Missing required CICIDS2017 features.",
                "missing_features": missing,
                "required_feature_count": len(FEATURE_NAMES)
            }
        )

    # Ignore extra fields. Only model features are used.
    row = {feature: features[feature] for feature in FEATURE_NAMES}

    try:
        df = pd.DataFrame([row], columns=FEATURE_NAMES)

        for col in FEATURE_NAMES:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not convert feature values to numeric values: {e}"
        )

    invalid = df.isna().any(axis=1).iloc[0]

    if invalid:
        bad_columns = df.columns[df.isna().iloc[0]].tolist()
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Feature values must be numeric and non-missing.",
                "invalid_features": bad_columns
            }
        )

    # Reject infinities.
    if not np.isfinite(df.to_numpy(dtype=float)).all():
        raise HTTPException(
            status_code=400,
            detail="Feature values must be finite. NaN and infinity are not allowed."
        )

    return df.astype(float)


def get_rf_score(X: pd.DataFrame) -> float:
    """Random Forest attack score."""
    return float(rf_model.predict_proba(X)[:, 1][0])


def get_if_score(X: pd.DataFrame) -> float:
    """
    Convert Isolation Forest decision function into the normalized
    anomaly score used during the CICIDS2017 analysis.
    """

    X_scaled = if_scaler.transform(X)

    # IsolationForest: lower decision_function = more anomalous.
    anomaly_raw = float(-if_model.decision_function(X_scaled)[0])

    denominator = IF_REFERENCE_P99 - IF_REFERENCE_MIN

    if denominator <= 0:
        raise RuntimeError("Invalid Isolation Forest normalization references.")

    normalized = (anomaly_raw - IF_REFERENCE_MIN) / denominator

    return float(np.clip(normalized, 0.0, 1.0))


def get_risk_level(rf_score: float) -> str:
    """
    Frozen validation-derived RF primary risk policy:

    < 0.01       NORMAL
    0.01 - <0.10 WATCH
    0.10 - <0.30 EARLY_WARNING
    0.30 - <0.70 HIGH
    >= 0.70      CRITICAL
    """

    if rf_score < 0.01:
        return "NORMAL"
    elif rf_score < 0.10:
        return "WATCH"
    elif rf_score < 0.30:
        return "EARLY_WARNING"
    elif rf_score < 0.70:
        return "HIGH"
    else:
        return "CRITICAL"


def get_if_anomaly_level(if_score: float) -> str:
    """Separate Isolation Forest anomaly/context indicator."""

    if if_score < 0.10:
        return "LOW"
    elif if_score < 0.30:
        return "MODERATE"
    elif if_score < 0.50:
        return "ELEVATED"
    elif if_score < 0.70:
        return "HIGH"
    else:
        return "VERY_HIGH"


# ------------------------------------------------------------
# API endpoints
# ------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "cicids2017-ml-service",
        "random_forest": True,
        "isolation_forest": True,
        "feature_count": len(FEATURE_NAMES)
    }


@app.get("/model-info")
def model_info():
    return {
        "dataset": "CICIDS2017",
        "feature_count": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "risk_policy": {
            "NORMAL": "RF < 0.01",
            "WATCH": "0.01 <= RF < 0.10",
            "EARLY_WARNING": "0.10 <= RF < 0.30",
            "HIGH": "0.30 <= RF < 0.70",
            "CRITICAL": "RF >= 0.70"
        },
        "isolation_forest_policy": {
            "LOW": "IF < 0.10",
            "MODERATE": "0.10 <= IF < 0.30",
            "ELEVATED": "0.30 <= IF < 0.50",
            "HIGH": "0.50 <= IF < 0.70",
            "VERY_HIGH": "IF >= 0.70"
        }
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    X = validate_and_prepare_features(request.features)

    try:
        rf_score = get_rf_score(X)
        if_score = get_if_score(X)

        risk_level = get_risk_level(rf_score)
        if_anomaly_level = get_if_anomaly_level(if_score)

        return {
            "rf_score": round(rf_score, 6),
            "if_score": round(if_score, 6),
            "risk_level": risk_level,
            "if_anomaly_level": if_anomaly_level
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {e}"
        )


@app.get("/")
def root():
    return {
        "service": "CICIDS2017 ML Detection Service",
        "status": "running",
        "endpoints": [
            "GET /health",
            "GET /model-info",
            "POST /predict"
        ]
    }
