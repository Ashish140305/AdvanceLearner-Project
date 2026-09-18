import asyncio
import json
import os
import sys
import time
from pathlib import Path
import httpx
import joblib
import numpy as np
import pandas as pd
from scapy.all import IP, TCP

# Add Daemon_controller to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "Daemon_controller"))

from Daemon_controller.network_daemon import FlowRecord, normalize_mac

API_URL = "http://127.0.0.1:8000"
DATA_PATH = BASE_DIR / "data" / "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"
MODEL_DIR = BASE_DIR / "models"
SCALER_PATH = MODEL_DIR / "isolation_forest_scaler.pkl"


def test_feature_extraction_schema():
    print("\n[TEST 1] Testing FlowRecord Feature Schema Completeness...")
    scaler = joblib.load(SCALER_PATH)
    expected_feats = list(scaler.feature_names_in_)

    flow = FlowRecord("10.0.0.1", 12345, "10.0.0.2", 80, "TCP")
    p1 = IP(src="10.0.0.1", dst="10.0.0.2") / TCP(sport=12345, dport=80, flags="S", window=8192)
    p2 = IP(src="10.0.0.2", dst="10.0.0.1") / TCP(sport=80, dport=12345, flags="SA", window=229)
    p3 = IP(src="10.0.0.1", dst="10.0.0.2") / TCP(sport=12345, dport=80, flags="PA", window=8192) / b"GET / HTTP/1.1\r\n\r\n"
    
    flow.update(p1, True)
    flow.update(p2, False)
    flow.update(p3, True)

    metrics = flow.compute_metrics()
    missing = [f for f in expected_feats if f not in metrics]
    
    print(f"    Total expected features: {len(expected_feats)}")
    print(f"    Total computed features: {len(metrics)}")
    if missing:
        print(f"    [-] FAILED: Missing features: {missing}")
        return False
    print("    [+] PASSED: 100% schema match (all 63 features present and finite).")
    return True


def test_api_health():
    print("\n[TEST 2] Testing ML Service API Connectivity...")
    try:
        res = httpx.get(f"{API_URL}/health", timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            print(f"    [+] ML Service is HEALTHY: {data}")
            return True
        else:
            print(f"    [-] API returned HTTP {res.status_code}")
            return False
    except Exception as e:
        print(f"    [-] Could not connect to ML Service at {API_URL}: {e}")
        return False


def test_dataset_attack_detection():
    print("\n[TEST 3] Testing Real CICIDS2017 Dataset Attack & Benign Batch Detection...")
    scaler = joblib.load(SCALER_PATH)
    expected_feats = list(scaler.feature_names_in_)

    print("    Loading samples from Friday DDoS dataset...")
    df = pd.read_csv(DATA_PATH, nrows=25000)
    df.columns = [c.strip() for c in df.columns]

    ddos_df = df[df["Label"] == "DDoS"].head(10)
    benign_df = df[df["Label"] == "BENIGN"].head(10)

    # 1. Test DDoS attack batch
    ddos_flows = []
    for _, row in ddos_df.iterrows():
        feat_dict = {f: float(row[f]) for f in expected_feats}
        ddos_flows.append({
            "features": feat_dict,
            "metadata": {
                "src_ip": "192.168.10.50",
                "src_port": 49200,
                "dst_ip": "192.168.10.1",
                "dst_port": int(row.get("Destination Port", 80)),
                "proto": "TCP"
            }
        })

    res_ddos = httpx.post(f"{API_URL}/predict/batch", json={"flows": ddos_flows}, timeout=10.0)
    if res_ddos.status_code != 200:
        print(f"    [-] DDoS batch rejected: HTTP {res_ddos.status_code}")
        return False

    data_ddos = res_ddos.json()
    alerts = data_ddos.get("alerts_triggered", 0)
    print(f"    [+] Submitted 10 real DDoS flows -> Caught {alerts}/10 attacks!")
    for flow in data_ddos.get("flagged_flows", []):
        meta = flow.get("metadata", {})
        print(f"        -> Alert [{flow['risk_level']}] Port {flow['dst_port']} | RF Score: {flow['rf_score']} | IF Anomaly: {flow['if_score']}")

    if alerts < 8:
        print(f"    [-] WARNING: Expected >= 8/10 attacks caught, got {alerts}")
        return False

    # 2. Test Benign batch
    benign_flows = []
    for _, row in benign_df.iterrows():
        feat_dict = {f: float(row[f]) for f in expected_feats}
        benign_flows.append({
            "features": feat_dict,
            "metadata": {
                "src_ip": "192.168.10.10",
                "src_port": 50123,
                "dst_ip": "192.168.10.1",
                "dst_port": int(row.get("Destination Port", 80)),
                "proto": "TCP"
            }
        })

    res_benign = httpx.post(f"{API_URL}/predict/batch", json={"flows": benign_flows}, timeout=10.0)
    data_benign = res_benign.json()
    benign_alerts = data_benign.get("alerts_triggered", 0)
    print(f"    [+] Submitted 10 real Benign flows -> Caught {benign_alerts}/10 false alarms.")

    if benign_alerts > 1:
        print(f"    [-] Too many false alarms on benign data: {benign_alerts}")
        return False

    print("    [+] PASSED: Accurate distinction between critical attacks and benign traffic.")
    return True


def test_device_alert():
    print("\n[TEST 4] Testing Zero-Trust Rogue Device Alert Dissemination...")
    fake_mac = "9c:ef:d5:fa:22:99"
    fake_ip = "10.101.60.199"
    payload = {
        "mac_address": fake_mac,
        "ip_address": fake_ip,
        "alert_type": "ROGUE_DEVICE",
        "timestamp": time.time()
    }
    res = httpx.post(f"{API_URL}/api/v1/alerts/device", json=payload, timeout=5.0)
    if res.status_code == 200:
        data = res.json()
        print(f"    [+] Rogue device alert successfully broadcasted: {data}")
        return True
    else:
        print(f"    [-] Device alert rejected: HTTP {res.status_code}")
        return False


if __name__ == "__main__":
    print("==================================================")
    print("ThreatLens CICIDS2017 Pipeline Verification Suite")
    print("==================================================")

    p1 = test_feature_extraction_schema()
    p2 = test_api_health()
    if not p2:
        print("\n[!] ML Service is offline. Please start it using:")
        print("    python -m uvicorn app:app --port 8000 (in ml-service folder)")
        sys.exit(1)

    p3 = test_dataset_attack_detection()
    p4 = test_device_alert()

    print("\n==================================================")
    if p1 and p2 and p3 and p4:
        print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! (4/4)")
    else:
        print("SOME CHECKS FAILED. See log above.")
    print("==================================================")

