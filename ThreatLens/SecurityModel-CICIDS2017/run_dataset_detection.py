import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import httpx

# ============================================================
# ThreatLens CICIDS2017 - Direct Dataset Intrusion Detector
# Evaluates network flows straight from the official CICIDS2017 dataset
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"
MODEL_DIR = BASE_DIR / "models"
API_URL = "http://127.0.0.1:8000"

# Model paths
RF_PATH = MODEL_DIR / "random_forest_day_validation.pkl"
IF_PATH = MODEL_DIR / "isolation_forest_day_validation.pkl"
SCALER_PATH = MODEL_DIR / "isolation_forest_scaler.pkl"

IF_REF_MIN = -0.182769
IF_REF_P99 = 0.134223


def load_engine():
    print("[*] Loading CICIDS2017 pre-trained models into memory...")
    rf = joblib.load(RF_PATH)
    if_model = joblib.load(IF_PATH)
    scaler = joblib.load(SCALER_PATH)
    features = list(scaler.feature_names_in_)
    print(f"[+] Loaded Random Forest & Isolation Forest with {len(features)} features.")
    return rf, if_model, scaler, features


def evaluate_batch(df_samples, rf, if_model, scaler, feature_names):
    """Vectorized scoring of network flows."""
    matrix = df_samples[feature_names].to_numpy(dtype=np.float32)
    np.nan_to_num(matrix, copy=False, nan=0.0, posinf=1e6, neginf=-1e6)

    X_df = pd.DataFrame(matrix, columns=feature_names)
    rf_probs = rf.predict_proba(X_df)[:, 1]

    scaled = scaler.transform(X_df)
    anomaly_raw = -if_model.decision_function(scaled)
    denom = IF_REF_P99 - IF_REF_MIN
    if_norm = np.clip((anomaly_raw - IF_REF_MIN) / denom, 0.0, 1.0)

    results = []
    for i in range(len(df_samples)):
        rf_val = float(rf_probs[i])
        if_val = float(if_norm[i])

        # Dual-engine threat correlation rule
        is_attack = (rf_val >= 0.60) or (if_val >= 0.85 and rf_val >= 0.35)
        risk = "CRITICAL" if (rf_val >= 0.70 or (if_val >= 0.90 and rf_val >= 0.50)) else ("HIGH" if is_attack else "NORMAL")

        results.append({
            "rf_score": rf_val,
            "if_score": if_val,
            "is_attack": is_attack,
            "risk_level": risk,
        })
    return results


def run():
    print("=" * 75)
    print("      ThreatLens NDR - Dataset Intrusion & Data Breach Detector")
    print("      Testing directly against Friday-WorkingHours-Afternoon-DDos")
    print("=" * 75)

    rf, if_model, scaler, feature_names = load_engine()

    print(f"\n[*] Reading network flows from: {DATA_PATH.name}...")
    df = pd.read_csv(DATA_PATH, nrows=35000)
    df.columns = [c.strip() for c in df.columns]

    # Select 25 real Benign flows and 25 real DDoS attack flows
    benign_samples = df[df["Label"] == "BENIGN"].head(25)
    ddos_samples = df[df["Label"] == "DDoS"].head(25)

    test_df = pd.concat([benign_samples, ddos_samples]).reset_index(drop=True)
    print(f"[+] Loaded {len(test_df)} sample flows ({len(benign_samples)} BENIGN, {len(ddos_samples)} DDoS ATTACK).")

    print("\n" + "-" * 75)
    print(f"{'#':<4} {'PORT':<8} {'GROUND TRUTH':<14} {'RF SCORE':<10} {'IF SCORE':<10} {'DECISION':<20} {'ACCURACY'}")
    print("-" * 75)

    results = evaluate_batch(test_df, rf, if_model, scaler, feature_names)

    correct = 0
    attacks_caught = 0
    benign_passed = 0

    for idx, (row, res) in enumerate(zip(test_df.iterrows(), results)):
        _, r = row
        true_label = str(r.get("Label", "UNKNOWN")).strip()
        port = int(r.get("Destination Port", 80))
        rf_score = res["rf_score"]
        if_score = res["if_score"]
        is_attack = res["is_attack"]
        risk = res["risk_level"]

        is_true_attack = (true_label == "DDoS")
        is_correct = (is_attack == is_true_attack)
        if is_correct:
            correct += 1

        if is_attack and is_true_attack:
            attacks_caught += 1
            decision_str = f"\033[91m[!] {risk} ATTACK\033[0m"
            acc_str = "\033[92m[MATCH]\033[0m"
        elif not is_attack and not is_true_attack:
            benign_passed += 1
            decision_str = "\033[92m[OK] NORMAL TRAFFIC\033[0m"
            acc_str = "\033[92m[MATCH]\033[0m"
        elif is_attack and not is_true_attack:
            decision_str = f"\033[93m[?] FALSE ALARM\033[0m"
            acc_str = "\033[91m[FAIL]\033[0m"
        else:
            decision_str = f"\033[91m[X] MISSED ATTACK\033[0m"
            acc_str = "\033[91m[FAIL]\033[0m"

        print(f"{idx+1:<4} {port:<8} {true_label:<14} {rf_score:<10.4f} {if_score:<10.4f} {decision_str:<28} {acc_str}")

    print("-" * 75)
    accuracy_pct = (correct / len(test_df)) * 100
    print(f"\n==================== DETECTION SUMMARY ====================")
    print(f"  Total Flows Evaluated  : {len(test_df)}")
    print(f"  DDoS Attacks Caught    : {attacks_caught}/{len(ddos_samples)} ({attacks_caught/len(ddos_samples)*100:.1f}%)")
    print(f"  Benign Flows Passed    : {benign_passed}/{len(benign_samples)} ({benign_passed/len(benign_samples)*100:.1f}%)")
    print(f"  Overall Model Accuracy : {accuracy_pct:.1f}%")
    if accuracy_pct >= 90:
        print(f"\033[92m  STATUS: SYSTEM IS WORKING PERFECTLY ON THE CICIDS2017 DATASET!\033[0m")
    else:
        print(f"\033[91m  STATUS: ACCURACY BELOW THRESHOLD\033[0m")
    print(f"===========================================================\n")


if __name__ == "__main__":
    run()

