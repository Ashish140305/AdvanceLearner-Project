from pathlib import Path
import time
import pandas as pd
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
from pydantic import BaseModel, Field

# ============================================================
# CICIDS2017 ML Service
# Production-Hardened Dual-Model Inference & Alerting Engine
# ============================================================
BASE_DIR = Path(__file__).resolve().parent

if (BASE_DIR.parent / "models").exists():
    MODEL_DIR = BASE_DIR.parent / "models"
elif (BASE_DIR / "models").exists():
    MODEL_DIR = BASE_DIR / "models"
else:
    MODEL_DIR = BASE_DIR.parent / "models"

RF_PATH = MODEL_DIR / "random_forest_day_validation.pkl"
IF_PATH = MODEL_DIR / "isolation_forest_day_validation.pkl"
SCALER_PATH = MODEL_DIR / "isolation_forest_scaler.pkl"


# Frozen IF normalization references from model training
IF_REFERENCE_MIN = -0.182769
IF_REFERENCE_P99 = 0.134223

app = FastAPI(
    title="CICIDS2017 Real-Time NDR Service",
    version="2.0.0",
    description="Vectorized Random Forest + Isolation Forest streaming detection",
)

# Enable CORS for the SOC frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Active WebSocket Connections Pool
# ------------------------------------------------------------


class ConnectionManager:

  def __init__(self):
    self.active_connections: List[WebSocket] = []

  async def connect(self, websocket: WebSocket):
    await websocket.accept()
    self.active_connections.append(websocket)

  def disconnect(self, websocket: WebSocket):
    if websocket in self.active_connections:
      self.active_connections.remove(websocket)

  async def broadcast(self, message: dict):
    for connection in list(self.active_connections):
      try:
        await connection.send_json(message)
      except Exception:
        self.disconnect(connection)


manager = ConnectionManager()

STATS = {
    "total_flows": 0,
    "total_attacks": 0,
    "total_rogue_devices": 0,
}
EVENT_HISTORY = []

# ------------------------------------------------------------
# Load models once into memory
# ------------------------------------------------------------

try:
  rf_model = joblib.load(RF_PATH)
  if_model = joblib.load(IF_PATH)
  if_scaler = joblib.load(SCALER_PATH)
  FEATURE_NAMES = list(if_scaler.feature_names_in_)
  NUM_FEATURES = len(FEATURE_NAMES)
except Exception as e:
  raise RuntimeError(
      f"Could not load CICIDS2017 model artifacts from: {MODEL_DIR}\nError: {e}"
  )

# ------------------------------------------------------------
# Schemas
# ------------------------------------------------------------


class PredictionRequest(BaseModel):
  features: Dict[str, Any] = Field(
      ..., description="Single flow record with 63 features"
  )
  metadata: Dict[str, Any] = Field(
      default_factory=dict,
      description="Optional flow context (IPs, Ports, Timestamps)",
  )


class BatchPredictionRequest(BaseModel):
  flows: List[Dict[str, Any]] = Field(
      ..., description="Batch array of flow objects containing features"
  )


class DeviceAlertRequest(BaseModel):
  mac_address: str
  ip_address: str
  alert_type: str = "UNKNOWN_DEVICE"
  timestamp: float


# ------------------------------------------------------------
# Vectorized Logic Helpers
# ------------------------------------------------------------


def get_risk_level(rf_score: float) -> str:
  if rf_score < 0.01:
    return "NORMAL"
  if rf_score < 0.10:
    return "WATCH"
  if rf_score < 0.30:
    return "EARLY_WARNING"
  if rf_score < 0.70:
    return "HIGH"
  return "CRITICAL"


def get_if_anomaly_level(if_score: float) -> str:
  if if_score < 0.10:
    return "LOW"
  if if_score < 0.30:
    return "MODERATE"
  if if_score < 0.50:
    return "ELEVATED"
  if if_score < 0.70:
    return "HIGH"
  return "VERY_HIGH"


# ------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------


DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ThreatLens SOC - CICIDS2017 Intrusion Monitor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0b0f19; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 24px; }
    header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b; margin-bottom: 24px; }
    h1 { font-size: 24px; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
    .badge { background: #0284c7; color: #fff; font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; }
    .status-pill { display: flex; align-items: center; gap: 8px; background: #1e293b; padding: 6px 14px; border-radius: 20px; font-size: 13px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #131c2e; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; }
    .card h3 { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.5px; }
    .card .val { font-size: 28px; font-weight: 700; color: #f8fafc; }
    .actions { display: flex; gap: 12px; margin-bottom: 24px; }
    button { background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    button:hover { background: #1d4ed8; }
    button.alt { background: #dc2626; }
    button.alt:hover { background: #b91c1c; }
    .feed { background: #131c2e; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; }
    .feed-header { padding: 14px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; font-weight: 600; font-size: 14px; color: #cbd5e1; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #0f172a; padding: 10px 16px; color: #64748b; font-size: 11px; text-transform: uppercase; }
    td { padding: 12px 16px; border-bottom: 1px solid #1e293b; }
    .crit { color: #f87171; font-weight: 700; background: rgba(239, 68, 68, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.3); }
    .high { color: #fbbf24; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3); }
    .norm { color: #34d399; font-weight: 600; background: rgba(16, 185, 129, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3); }
    .rogue { color: #f43f5e; font-weight: 700; background: rgba(244, 63, 94, 0.15); padding: 3px 8px; border-radius: 4px; }
    .btn-label { font-size: 12px; color: #94a3b8; margin-bottom: 8px; font-weight: 500; }
  </style>
</head>
<body>
  <header>
    <h1>ThreatLens NDR <span class="badge">CICIDS2017 Real-Time SOC</span></h1>
    <div class="status-pill"><div class="status-dot" id="ws-dot"></div><span id="ws-status">Connecting...</span></div>
  </header>
  <div class="grid">
    <div class="card"><h3>Total Flows Analyzed</h3><div class="val" id="cnt-total">0</div></div>
    <div class="card"><h3>Critical Attacks Flagged</h3><div class="val" id="cnt-crit" style="color:#ef4444;">0</div></div>
    <div class="card"><h3>Rogue Hardware Devices</h3><div class="val" id="cnt-rogue" style="color:#f59e0b;">0</div></div>
    <div class="card"><h3>Engine Features Active</h3><div class="val" style="color:#38bdf8;">63</div></div>
  </div>
  <div style="margin-bottom: 24px;">
    <div class="btn-label">Manual Test Triggers (Click to inject simulated attacks/devices directly into the live engine):</div>
    <div class="actions">
      <button onclick="triggerDDoS()">Trigger Dataset DDoS Burst</button>
      <button class="alt" onclick="triggerRogue()">Simulate Rogue Hardware</button>
    </div>
  </div>
  <div class="feed">
    <div class="feed-header">Live Security Intrusion & Flow Stream</div>
    <table>
      <thead><tr><th>Time</th><th>Severity</th><th>Type</th><th>Source -> Target</th><th>RF Score</th><th>Details</th></tr></thead>
      <tbody id="alerts-body"><tr><td colspan="6" style="text-align:center; color:#64748b; padding:24px;">Listening for live network traffic and attacks...</td></tr></tbody>
    </table>
  </div>
  <script>
    let ws;
    async function loadHistory() {
      try {
        const res = await fetch('/api/v1/history');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('cnt-total').innerText = data.stats.total_flows;
          document.getElementById('cnt-crit').innerText = data.stats.total_attacks;
          document.getElementById('cnt-rogue').innerText = data.stats.total_rogue_devices;
          const body = document.getElementById('alerts-body');
          if (data.history && data.history.length > 0) {
            body.innerHTML = '';
            data.history.forEach(d => renderRow(d, false));
          }
        }
      } catch(e) {}
    }
    function renderRow(d, prepend=true) {
      const body = document.getElementById('alerts-body');
      const row = document.createElement('tr');
      const time = d.timestamp ? new Date(d.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString();
      if (d.type === 'CORRELATED_INTRUSION') {
        const cls = d.risk_level === 'CRITICAL' ? 'crit' : 'high';
        row.innerHTML = `<td>${time}</td><td><span class="${cls}">${d.risk_level}</span></td><td>INTRUSION</td><td>${d.src_ip} -> ${d.dst_ip}:${d.dst_port}</td><td>${d.rf_score}</td><td>IF Anomaly: ${d.if_score} (${d.if_anomaly_level})</td>`;
      } else if (d.type === 'DEVICE_BREACH') {
        row.innerHTML = `<td>${time}</td><td><span class="rogue">BREACH</span></td><td>ROGUE DEVICE</td><td>MAC: ${d.mac}</td><td>-</td><td>IP: ${d.ip}</td>`;
      } else if (d.type === 'BENIGN_BATCH') {
        row.innerHTML = `<td>${time}</td><td><span class="norm">NORMAL</span></td><td>BATCH (${d.flows_count} flows)</td><td>${d.src_ip} -> ${d.dst_ip}</td><td>${d.max_rf}</td><td>All flows benign</td>`;
      }
      if (prepend) {
        body.insertBefore(row, body.firstChild);
      } else {
        body.appendChild(row);
      }
    }
    function connect() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${location.host}/ws/alerts`);
      ws.onopen = () => { document.getElementById('ws-dot').style.background='#22c55e'; document.getElementById('ws-status').innerText='WebSocket Connected'; };
      ws.onclose = () => { document.getElementById('ws-dot').style.background='#ef4444'; document.getElementById('ws-status').innerText='Disconnected (Reconnecting...)'; setTimeout(connect, 2000); };
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        const body = document.getElementById('alerts-body');
        if (body.children.length === 1 && body.children[0].innerText.includes('Listening')) {
          body.innerHTML = '';
        }
        if (d.type === 'CORRELATED_INTRUSION') {
          let c = parseInt(document.getElementById('cnt-crit').innerText) || 0;
          document.getElementById('cnt-crit').innerText = c + 1;
        } else if (d.type === 'DEVICE_BREACH') {
          let r = parseInt(document.getElementById('cnt-rogue').innerText) || 0;
          document.getElementById('cnt-rogue').innerText = r + 1;
        } else if (d.type === 'BENIGN_BATCH') {
          let t = parseInt(document.getElementById('cnt-total').innerText) || 0;
          document.getElementById('cnt-total').innerText = t + (d.flows_count || 0);
        }
        renderRow(d, true);
      };
    }
    async function triggerDDoS() {
      await fetch('/simulate/ddos', { method: 'POST' }).catch(()=>{});
    }
    async function triggerRogue() {
      await fetch('/api/v1/alerts/device', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ mac_address: 'd4:3b:04:19:9e:02', ip_address: '10.238.227.189', timestamp: Date.now()/1000 })
      });
    }
    loadHistory();
    connect();
  </script>
</body>
</html>"""

@app.get("/", response_class=HTMLResponse)
def dashboard():
  return DASHBOARD_HTML

@app.post("/simulate/ddos")
async def simulate_ddos_sample():
  """Quick-trigger endpoint for frontend button testing."""
  sample_features = {f: 0.0 for f in FEATURE_NAMES}
  sample_features.update({
      "Destination Port": 80.0, "Flow Duration": 1293792.0, "Total Fwd Packets": 3.0,
      "Total Backward Packets": 7.0, "Total Length of Fwd Packets": 26.0,
      "Total Length of Bwd Packets": 11607.0, "Fwd Packet Length Max": 20.0,
      "Bwd Packet Length Max": 5840.0, "Bwd Packet Length Mean": 1658.14,
      "Bwd Packet Length Std": 2137.29, "Flow Bytes/s": 8991.39, "Flow Packets/s": 7.73,
      "Max Packet Length": 5840.0, "Packet Length Mean": 1057.54, "Packet Length Std": 1853.43,
      "Packet Length Variance": 3435230.67, "PSH Flag Count": 1.0, "Average Packet Size": 1163.3,
      "Subflow Fwd Bytes": 26.0, "Subflow Bwd Bytes": 11607.0, "Init_Win_bytes_forward": 8192.0,
      "Init_Win_bytes_backward": 229.0, "act_data_pkt_fwd": 2.0, "min_seg_size_forward": 20.0,
  })
  payload = BatchPredictionRequest(flows=[{
      "features": sample_features,
      "metadata": {"src_ip": "192.168.10.50", "src_port": 50886, "dst_ip": "192.168.10.1", "dst_port": 80, "proto": "TCP"}
  }])
  return await predict_batch(payload)

@app.get("/health")
def health():
  return {
      "status": "healthy",
      "service": "cicids2017-ndr-engine",
      "features_expected": NUM_FEATURES,
      "active_soc_clients": len(manager.active_connections),
  }


@app.get("/model-info")
def model_info():
  return {
      "dataset": "CICIDS2017",
      "feature_count": NUM_FEATURES,
      "features": FEATURE_NAMES,
  }


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
  """Websocket endpoint for live SOC monitoring dashboards."""
  await manager.connect(websocket)
  try:
    while True:
      # Keep-alive heartbeat listener
      await websocket.receive_text()
  except WebSocketDisconnect:
    manager.disconnect(websocket)


@app.post("/api/v1/alerts/device")
async def handle_device_alert(device: DeviceAlertRequest):
  """Receives Layer-2 rogue hardware detections from the background daemon."""
  STATS["total_rogue_devices"] += 1
  alert_payload = {
      "type": "DEVICE_BREACH",
      "severity": "CRITICAL",
      "mac": device.mac_address,
      "ip": device.ip_address,
      "message": f"Unauthorized device detected on LAN: {device.mac_address}",
      "timestamp": device.timestamp,
  }
  EVENT_HISTORY.append(alert_payload)
  if len(EVENT_HISTORY) > 100:
    EVENT_HISTORY.pop(0)
  await manager.broadcast(alert_payload)
  return {"status": "broadcasted"}

@app.get("/api/v1/history")
def get_history():
  """Returns current live counters and recent event history for dashboard initialization."""
  return {
      "stats": STATS,
      "history": EVENT_HISTORY[-60:],
  }

@app.post("/predict/batch")
async def predict_batch(request: BatchPredictionRequest):
  """High-performance vectorized batch scoring (NumPy C-speed)."""
  flows = request.flows
  if not flows:
    return {"status": "empty", "total_processed": 0, "alerts_triggered": 0, "flagged_flows": []}

  n_samples = len(flows)
  STATS["total_flows"] += n_samples

  # Pre-allocate 2D float32 memory matrix
  matrix = np.zeros((n_samples, NUM_FEATURES), dtype=np.float32)

  # Extract 63 attributes by mapped column indices
  for row_idx, item in enumerate(flows):
    feat_dict = item.get("features", item)
    for col_idx, col_name in enumerate(FEATURE_NAMES):
      matrix[row_idx, col_idx] = float(feat_dict.get(col_name, 0.0))

  # Guard against NaNs or infinite values from network calculations
  np.nan_to_num(matrix, copy=False, nan=0.0, posinf=1e6, neginf=-1e6)

  try:
   # 1. Random Forest & Scaler expect a DataFrame with column names
    X_df = pd.DataFrame(matrix, columns=FEATURE_NAMES)
    rf_probs = rf_model.predict_proba(X_df)[:, 1]

    # 2. Scaler transforms DataFrame, outputting a NumPy array
    scaled_matrix = if_scaler.transform(X_df)

    # 3. Isolation Forest expects a raw NumPy array (no feature names)
    anomaly_raw = -if_model.decision_function(scaled_matrix)

    denominator = IF_REFERENCE_P99 - IF_REFERENCE_MIN
    normalized_if = np.clip((anomaly_raw - IF_REFERENCE_MIN) / denominator, 0.0, 1.0)

    # Accumulate flagged flows for both WebSocket and HTTP response
    flagged_flows = []

    # 3. Correlated Threat Evaluation
    for i in range(n_samples):
      rf_val = float(rf_probs[i])
      if_val = float(normalized_if[i])
      risk = get_risk_level(rf_val)
      if_level = get_if_anomaly_level(if_val)

      # CORRELATION RULE:
      # 1. Confirmed Attack: RF >= 0.15 (calibrated for live network flows, <0.8% FPR on Benign)
      # 2. Critical Attack: RF >= 0.50
      # 3. Suspicious Anomaly: IF >= 0.65 AND RF >= 0.05
      is_attack = (rf_val >= 0.15) or (if_val >= 0.65 and rf_val >= 0.05)
      if is_attack:
        meta = flows[i].get("metadata", {})
        alert_payload = {
            "type": "CORRELATED_INTRUSION",
            "risk_level": "CRITICAL" if (rf_val >= 0.50 or (if_val >= 0.80 and rf_val >= 0.30)) else "HIGH",
            "rf_score": round(rf_val, 4),
            "if_score": round(if_val, 4),
            "if_anomaly_level": if_level,
            "metadata": meta,
            "src_ip": meta.get("src_ip", "Unknown"),
            "dst_ip": meta.get("dst_ip", "Unknown"),
            "dst_port": meta.get("dst_port", 0),
            "timestamp": time.time(),
        }
        await manager.broadcast(alert_payload)
        flagged_flows.append(alert_payload)
        EVENT_HISTORY.append(alert_payload)

    if flagged_flows:
      STATS["total_attacks"] += len(flagged_flows)
    else:
      # Broadcast benign summary so dashboard counters and feed update live
      benign_summary = {
          "type": "BENIGN_BATCH",
          "severity": "NORMAL",
          "flows_count": n_samples,
          "max_rf": round(float(np.max(rf_probs)), 4),
          "timestamp": time.time(),
          "src_ip": flows[0].get("metadata", {}).get("src_ip", "LAN Device"),
          "dst_ip": flows[0].get("metadata", {}).get("dst_ip", "WAN Server"),
          "dst_port": flows[0].get("metadata", {}).get("dst_port", 80),
      }
      EVENT_HISTORY.append(benign_summary)
      await manager.broadcast(benign_summary)

    if len(EVENT_HISTORY) > 100:
      EVENT_HISTORY.pop(0)

    return {
        "status": "success",
        "total_processed": n_samples,
        "alerts_triggered": len(flagged_flows),
        "flagged_flows": flagged_flows,
    }

  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Batch inference failure: {e}")
@app.post("/predict")
async def predict_single(request: PredictionRequest):
  """Maintained for backward compatibility and test scripts."""
  row_data = [
      float(request.features.get(f, 0.0)) for f in FEATURE_NAMES
  ]
  matrix = np.array([row_data], dtype=np.float32)
  np.nan_to_num(matrix, copy=False, nan=0.0)

  X_df = pd.DataFrame(matrix, columns=FEATURE_NAMES)
  rf_score = float(rf_model.predict_proba(X_df)[:, 1][0])
  scaled_matrix = if_scaler.transform(X_df)
  anomaly_raw = float(-if_model.decision_function(scaled_matrix)[0])

  denominator = IF_REFERENCE_P99 - IF_REFERENCE_MIN
  if_score = float(np.clip((anomaly_raw - IF_REFERENCE_MIN) / denominator, 0.0, 1.0))

  risk_level = get_risk_level(rf_score)
  if_anomaly_level = get_if_anomaly_level(if_score)

  if risk_level in ["HIGH", "CRITICAL"]:
    await manager.broadcast({
        "type": "NETWORK_ANOMALY",
        "risk_level": risk_level,
        "rf_score": round(rf_score, 4),
        "if_score": round(if_score, 4),
        "if_anomaly_level": if_anomaly_level,
        "metadata": request.metadata,
    })

  return {
      "rf_score": round(rf_score, 6),
      "if_score": round(if_score, 6),
      "risk_level": risk_level,
      "if_anomaly_level": if_anomaly_level,
  }