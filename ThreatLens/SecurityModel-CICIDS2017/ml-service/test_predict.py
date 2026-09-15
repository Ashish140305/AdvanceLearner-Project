import json
import urllib.request
from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# Paths
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
MODEL_DIR = PROJECT_DIR / "models"
DATA_DIR = PROJECT_DIR / "data"

SCALER_PATH = MODEL_DIR / "isolation_forest_scaler.pkl"

CSV_PATH = (
    DATA_DIR
    / "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"
)


# ============================================================
# Load exact model feature order
# ============================================================

scaler = joblib.load(SCALER_PATH)
FEATURE_NAMES = list(scaler.feature_names_in_)

print("Required model features:", len(FEATURE_NAMES))


# ============================================================
# Find one real BENIGN row
# ============================================================

benign_row = None

for chunk in pd.read_csv(CSV_PATH, chunksize=5000):

    chunk.columns = chunk.columns.str.strip()

    if "Label" not in chunk.columns:
        raise RuntimeError("Could not find 'Label' column.")

    benign = chunk[
        chunk["Label"].astype(str).str.strip().str.upper() == "BENIGN"
    ]

    if not benign.empty:
        benign_row = benign.iloc[0]
        break


if benign_row is None:
    raise RuntimeError("No BENIGN row found in the CSV.")


# ============================================================
# Check required features
# ============================================================

missing = [
    feature
    for feature in FEATURE_NAMES
    if feature not in benign_row.index
]

if missing:
    print("\nMissing features:")

    for feature in missing:
        print(" -", feature)

    raise RuntimeError(
        "Dataset does not contain all required model features."
    )


# ============================================================
# Create API request
# ============================================================

features = {}

for feature in FEATURE_NAMES:
    value = benign_row[feature]
    features[feature] = float(value)


payload = {
    "features": features
}

data = json.dumps(payload).encode("utf-8")


# ============================================================
# Send request to FastAPI
# ============================================================

request = urllib.request.Request(
    "http://127.0.0.1:8000/predict",
    data=data,
    headers={
        "Content-Type": "application/json"
    },
    method="POST"
)


print("\nSending real CICIDS2017 BENIGN row to ML service...")


try:

    with urllib.request.urlopen(request) as response:
        result = json.loads(
            response.read().decode()
        )

except Exception as e:
    raise RuntimeError(
        f"API request failed: {e}"
    )


# ============================================================
# Display result
# ============================================================

print("\n========================================")
print("REAL DATASET ROW")
print("========================================")

print("Actual Label:", benign_row["Label"])


print("\n========================================")
print("MODEL RESPONSE")
print("========================================")

print(
    json.dumps(
        result,
        indent=4
    )
)