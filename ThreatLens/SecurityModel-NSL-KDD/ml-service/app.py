from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

import joblib
import pandas as pd
import numpy as np
import os


app = FastAPI(
    title="AI Network Security ML Service",
    version="1.0.0"
)


# ============================================================
# Paths
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")


# ============================================================
# Load trained artifacts
# ============================================================

rf_model = joblib.load(
    os.path.join(MODEL_DIR, "random_forest_tuned.pkl")
)

isolation_forest = joblib.load(
    os.path.join(MODEL_DIR, "isolation_forest.pkl")
)

preprocessor = joblib.load(
    os.path.join(MODEL_DIR, "preprocessor.pkl")
)

hybrid_config = joblib.load(
    os.path.join(MODEL_DIR, "hybrid_config.pkl")
)

risk_config = joblib.load(
    os.path.join(MODEL_DIR, "risk_engine_config.pkl")
)

behavior_baseline = joblib.load(
    os.path.join(MODEL_DIR, "behavior_baseline.pkl")
)


# ============================================================
# Input schema
# ============================================================

class PredictionRequest(BaseModel):
    features: Dict[str, Any]


# ============================================================
# Helper functions
# ============================================================

def get_risk_level(risk_score: float) -> str:

    thresholds = risk_config["risk_thresholds"]

    if risk_score < thresholds["normal"]:
        return "NORMAL"

    elif risk_score < thresholds["watch"]:
        return "WATCH"

    elif risk_score < thresholds["high"]:
        return "HIGH"

    else:
        return "CRITICAL"


def generate_alert(risk_score: float) -> str:

    level = get_risk_level(risk_score)

    if level == "CRITICAL":
        return "CRITICAL ALERT"

    elif level == "HIGH":
        return "EARLY WARNING"

    elif level == "WATCH":
        return "WATCH"

    else:
        return "NORMAL"


# ============================================================
# Health endpoint
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "ml-service",
        "models_loaded": True
    }


# ============================================================
# Prediction endpoint
# ============================================================

@app.post("/predict")
def predict(request: PredictionRequest):

    try:

        # Convert input JSON into DataFrame
        event_df = pd.DataFrame([request.features])

        # ----------------------------------------------------
        # Behavioral baseline
        # ----------------------------------------------------

        behavior_features = behavior_baseline["features"]

        missing_features = [
            feature
            for feature in behavior_features
            if feature not in event_df.columns
        ]

        if missing_features:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Missing behavioral features",
                    "missing_features": missing_features
                }
            )

        behavior_data = event_df[behavior_features].astype(float)

        baseline_mean = pd.Series(
            behavior_baseline["mean"]
        )

        baseline_std = pd.Series(
            behavior_baseline["std"]
        ).replace(0, 1)

        behavior_deviation = (
            (behavior_data.iloc[0] - baseline_mean)
            / baseline_std
        ).abs()

        behavior_deviation_score = behavior_deviation.mean()

        behavior_upper_bound = behavior_baseline["upper_bound"]

        behavior_score = np.clip(
            behavior_deviation_score /
            behavior_upper_bound,
            0,
            1
        )


        # ----------------------------------------------------
        # Preprocessing
        # ----------------------------------------------------

        processed_event = preprocessor.transform(event_df)


        # ----------------------------------------------------
        # Random Forest score
        # ----------------------------------------------------

        rf_score = rf_model.predict_proba(
            processed_event
        )[0, 1]


        # ----------------------------------------------------
        # Isolation Forest score
        # ----------------------------------------------------

        if_raw_score = -isolation_forest.decision_function(
            processed_event
        )[0]

        if_min = hybrid_config["normalization_min"]
        if_max = hybrid_config["normalization_max"]

        if_score = (
            (if_raw_score - if_min) /
            (if_max - if_min)
        )

        if_score = np.clip(
            if_score,
            0,
            1
        )


        # ----------------------------------------------------
        # Combined risk score
        # ----------------------------------------------------

        rf_weight = risk_config["rf_weight"]
        if_weight = risk_config["isolation_forest_weight"]
        behavior_weight = risk_config["behavior_weight"]

        risk_score = (
            rf_weight * rf_score +
            if_weight * if_score +
            behavior_weight * behavior_score
        )

        risk_score = float(
            np.clip(risk_score, 0, 1)
        )


        # ----------------------------------------------------
        # Risk classification
        # ----------------------------------------------------

        risk_level = get_risk_level(risk_score)

        alert = generate_alert(risk_score)


        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {
            "rf_score": round(float(rf_score), 6),
            "if_score": round(float(if_score), 6),
            "behavior_score": round(float(behavior_score), 6),
            "risk_score": round(risk_score, 6),
            "risk_level": risk_level,
            "alert": alert
        }


    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )