import httpx

# Retrieve features schema
info = httpx.get("http://127.0.0.1:8000/model-info").json()
features = {feat: 0.0 for feat in info["features"]}

# Synthetic anomaly payload matching CICIDS2017 attack signature
features.update({
    "Destination Port": 80.0,
    "Flow Duration": 1293792.0,
    "Total Fwd Packets": 3.0,
    "Total Backward Packets": 7.0,
    "Total Length of Fwd Packets": 26.0,
    "Total Length of Bwd Packets": 11607.0,
    "Fwd Packet Length Max": 20.0,
    "Fwd Packet Length Min": 0.0,
    "Fwd Packet Length Mean": 8.66,
    "Bwd Packet Length Max": 5840.0,
    "Bwd Packet Length Min": 0.0,
    "Bwd Packet Length Mean": 1658.14,
    "Bwd Packet Length Std": 2137.29,
    "Flow Bytes/s": 8991.39,
    "Flow Packets/s": 7.73,
    "Max Packet Length": 5840.0,
    "Packet Length Mean": 1057.54,
    "Packet Length Std": 1853.43,
    "Packet Length Variance": 3435230.67,
    "PSH Flag Count": 1.0,
    "Average Packet Size": 1163.3,
    "Subflow Fwd Bytes": 26.0,
    "Subflow Bwd Bytes": 11607.0,
    "Init_Win_bytes_forward": 8192.0,
    "Init_Win_bytes_backward": 229.0,
    "act_data_pkt_fwd": 2.0,
    "min_seg_size_forward": 20.0,
})

payload = {
    "flows": [{
        "features": features,
        "metadata": {
            "src_ip": "10.0.0.99",
            "src_port": 49152,
            "dst_ip": "198.51.100.2",
            "dst_port": 80,
            "proto": "TCP"
        }
    }]
}

res = httpx.post("http://127.0.0.1:8000/predict/batch", json=payload)
print(res.json())