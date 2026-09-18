# ThreatLens NDR — CICIDS2017 Real-Time Intrusion Detection System & Zero-Trust Network Monitor

[![Python](https://img.shields.io/badge/Python-3.10%20--%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Scapy](https://img.shields.io/badge/Scapy-2.5.0+-red.svg)](https://scapy.net/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.6.1-orange.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

ThreatLens is an enterprise-grade Network Detection & Response (NDR) platform powered by a **Dual-Engine Machine Learning Pipeline** trained on the official **CICIDS2017 Benchmark Dataset**. It combines deep signature classification (Random Forest) with unsupervised zero-day anomaly detection (Isolation Forest) and Layer-2 Zero-Trust hardware device tracking to detect DDoS floods, port scans, and rogue physical devices both live on physical network cards (Wi-Fi / Ethernet) and via high-throughput dataset replay.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Project Architecture & Directory Structure](#project-architecture--directory-structure)
3. [Prerequisites & System Requirements](#prerequisites--system-requirements)
4. [Installation & Setup](#installation--setup)
5. [In-Depth System Architecture & Working Logic](#in-depth-system-architecture--working-logic)
   - [A. Physical Interface Discovery & MAC Whitelisting](#a-physical-interface-discovery--mac-whitelisting)
   - [B. Layer-2 Zero-Trust Hardware Device Enforcement](#b-layer-2-zero-trust-hardware-device-enforcement)
   - [C. Bidirectional Flow Reconstruction (63 CICIDS2017 Features)](#c-bidirectional-flow-reconstruction-63-cicids2017-features)
   - [D. Flow Lifecycle & TCP Teardown Fast-Flush](#d-flow-lifecycle--tcp-teardown-fast-flush)
   - [E. Dual-Engine Inference & Correlated Threat Evaluation](#e-dual-engine-inference--correlated-threat-evaluation)
   - [F. Real-Time SOC Web Dashboard & WebSocket Telemetry](#f-real-time-soc-web-dashboard--websocket-telemetry)
6. [Step-by-Step Guide: How to Run](#step-by-step-guide-how-to-run)
   - [Step 1: Start the Central ML Inference Service](#step-1-start-the-central-ml-inference-service)
   - [Step 2: Access the Visual SOC Web Dashboard](#step-2-access-the-visual-soc-web-dashboard)
   - [Option A: Run in Live Physical Wi-Fi Mode](#option-a-run-in-live-physical-wi-fi-mode)
   - [Option B: Run in CICIDS2017 Dataset Replay Mode](#option-b-run-in-cicids2017-dataset-replay-mode)
   - [Step 3: Inject Live Attacks Over the Wire](#step-3-inject-live-attacks-over-the-wire)
7. [Testing & Verification Tools](#testing--verification-tools)
8. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Core Features

- 🛡️ **Dual-Engine Machine Learning**:
  - **Random Forest (Supervised)**: Evaluates flows against signature patterns of known attacks (DDoS, LOIC floods, Port Scans).
  - **Isolation Forest (Unsupervised)**: Identifies statistical out-of-distribution flow anomalies and zero-day threats.
- ⚡ **Vectorized C-Speed Ingestion**: Pre-allocated NumPy memory buffers map incoming JSON flow dictionaries into a 2D float32 matrix `(N, 63)` in sub-millisecond execution time.
- 🔒 **Layer-2 Zero-Trust MAC Enforcement**:
  - Actively queries the Windows/Linux neighbor table (`Get-NetNeighbor` / `arp -a`) on boot.
  - Intercepts raw Ethernet and ARP frames in real time.
  - Instantly detects unknown MAC addresses, alerts the SOC, and prevents LAN spoofing.
- 📡 **True On-The-Wire Live Packet Sniffing**:
  - Binds directly to the physical Wi-Fi or Ethernet adapter via Npcap.
  - Automatically whitelists the local host NIC and default gateway to prevent false alarms.
  - Reconstructs 63 statistical flow features identical to CICFlowMeter.
- 📊 **Interactive Web SOC Dashboard**:
  - Embedded real-time dark-mode SOC dashboard at `http://127.0.0.1:8000/`.
  - Zero-latency bidirectional WebSocket updates for live alerts, threat counters, and benign throughput counters.
- 🎯 **Realistic Attack Injection Suite (`simulate_attack.py`)**:
  - Uses Scapy's raw Layer-2 `sendp()` to inject real Ethernet/IP/TCP frames directly over the network adapter.
  - Simulates both Layer-2 Rogue Hardware Devices and realistic CICIDS2017 Port 80 DDoS bursts with TCP teardown flushing.

---

## Project Architecture & Directory Structure

```text
SecurityModel-CICIDS2017/
├── Daemon_controller/
│   └── network_daemon.py             # Physical packet sniffer, flow engine & dataset streamer
├── ml-service/
│   ├── app.py                        # FastAPI ML service, dual-engine correlation & SOC dashboard
│   ├── requirements.txt              # ML service specific dependencies
│   └── test_predict.py               # ML service sanity testing script
├── models/
│   ├── random_forest_day_validation.pkl   # Trained Random Forest model (63 features)
│   ├── isolation_forest_day_validation.pkl # Trained Isolation Forest model
│   └── isolation_forest_scaler.pkl   # Robust scaler for anomaly feature normalization
├── data/
│   └── Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv # Official CICIDS2017 DDoS dataset
├── results/
│   ├── cicids_rf_if_diagnostics.csv  # Precision, recall, and threshold diagnostics
│   ├── evidence_based_rf_if_risk_engine.csv # Model evaluation logs
│   └── rf_if_risk_matrix.csv         # Risk correlation decision matrix
├── requirements.txt                  # Consolidated project dependencies
├── simulate_attack.py                # On-the-wire raw packet attack & breach injector
├── run_dataset_detection.py          # Standalone offline dataset accuracy evaluator
├── test_attack_detection.py          # 4-stage automated unit and integration test suite
└── README.md                         # Complete project documentation
```

---

## Prerequisites & System Requirements

### 1. Operating System
- **Windows 10 / 11** (64-bit) or **Linux** (Ubuntu 20.04+ / Debian).

### 2. Python Environment
- **Python 3.10, 3.11, 3.12, or 3.13** (64-bit).

### 3. Npcap Packet Capture Driver (CRITICAL FOR WINDOWS)
Because ThreatLens sniffs raw network packets directly off your physical Wi-Fi/Ethernet interface, Windows requires the **Npcap** packet capture driver:
1. Download Npcap from the official website: [https://npcap.com/#download](https://npcap.com/#download).
2. Run the installer.
3. ⚠️ **IMPORTANT**: During installation, ensure the following checkbox is **CHECKED**:
   - ✅ **"Install Npcap in WinPcap API-compatible Mode"**
4. Complete the installation and reboot your PC if prompted.

---

## Installation & Setup

### 1. Clone or Open the Repository
```powershell
cd SecurityModel-CICIDS2017
```

### 2. Create and Activate a Virtual Environment (Recommended)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Python Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

Verify that all packages are installed:
```powershell
python -c "import fastapi, scapy, sklearn, pandas, numpy, httpx, joblib; print('[+] All dependencies verified successfully!')"
```

---

## In-Depth System Architecture & Working Logic

```
   [Physical Network Interface: Wi-Fi / Ethernet]
                         │
        (Raw Layer-2 / Layer-3 Frames)
                         ▼
        ┌─────────────────────────────────┐
        │  network_daemon.py (Sniffer)    │
        │  - AsyncSniffer (Npcap)         │
        │  - Dynamic Adapter Binding      │
        │  - Local Gateway Whitelisting   │
        └──────────────┬──────────────────┘
                       │
        ┌──────────────┴──────────────────┐
        ▼                                 ▼
[ARP / Ethernet Frames]          [IP / TCP / UDP Packets]
        │                                 │
        ▼                                 ▼
┌───────────────────────┐        ┌─────────────────────────┐
│ Zero-Trust MAC Engine │        │ FlowRecord Aggregator   │
│ - Inspects hwsrc/src  │        │ - Canonical 5-tuple key │
│ - Unknown MAC Alert   │        │ - Computes 63 metrics   │
└───────────┬───────────┘        │ - FIN/RST Teardown Flush│
            │                    └────────────┬────────────┘
            │                                 │ (Micro-Batches)
            ▼                                 ▼
    POST /api/v1/alerts/device       POST /predict/batch
            │                                 │
            └────────────────┬────────────────┘
                             ▼
               ┌───────────────────────────┐
               │    ml-service (app.py)    │
               │  - NumPy Vectorized Mat   │
               │  - Random Forest (RF)     │
               │  - Isolation Forest (IF)  │
               │  - Correlated Threat Rule │
               └─────────────┬─────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
[CLI Terminal Alerts]             [WebSocket Telemetry Stream]
"CRITICAL INTRUSION"                          │
                                              ▼
                                  [Visual Web SOC Dashboard]
                                  http://127.0.0.1:8000/
```

### A. Physical Interface Discovery & MAC Whitelisting
When `network_daemon.py` starts, `get_active_interface()` scores all working network interfaces by inspecting active IPv4 assignments, private routing tables, and interface names.
- It dynamically binds to the active **Wi-Fi** or **Ethernet** card.
- It resolves the local host MAC and gateway MAC (via ARP routing queries) and whitelists them in `AUTHORIZED_MACS` so legitimate host traffic never generates false alarms.

### B. Layer-2 Zero-Trust Hardware Device Enforcement
- On startup, the daemon queries the local OS ARP/neighbor cache using PowerShell `Get-NetNeighbor` to catalog all active devices on the subnet.
- For every captured packet, `_check_device()` inspects the source MAC of Layer-2 ARP packets and local subnet IP packets.
- If a packet originates from a hardware MAC not present in `authorized_macs`, the daemon flags:
  ```text
  [ROGUE DEVICE DETECTED] MAC: de:ad:be:ef:13:37 | IP: 10.238.227.199
  ```
  and dispatches an event to `POST /api/v1/alerts/device`, which immediately broadcasts to the Web Dashboard.

### C. Bidirectional Flow Reconstruction (63 CICIDS2017 Features)
Packets are grouped into bidirectional network flows using a canonical 5-tuple hash key:
$$\text{Key} = \min\big((IP_1, P_1), (IP_2, P_2)\big) \cup \max\big((IP_1, P_1), (IP_2, P_2)\big) \cup \{\text{Proto}\}$$
For each flow, `FlowRecord` computes all 63 statistical attributes:
1. **Flow Durations & Rates**: `Flow Duration`, `Flow Bytes/s`, `Flow Packets/s`.
2. **Packet Length Statistics**: Max, Min, Mean, Std, and Variance for Forward, Backward, and Combined flows.
3. **Inter-Arrival Times (IAT)**: Mean, Std, Max, Min, and Total for Forward, Backward, and Combined streams.
4. **TCP Flag Distribution**: FIN, SYN, RST, PSH, ACK, URG, ECE counts.
5. **TCP Protocol Attributes**: Header Lengths, Initial Window Sizes (`Init_Win_bytes_forward`, `Init_Win_bytes_backward`), `min_seg_size_forward`, and Down/Up Ratio.

### D. Flow Lifecycle & TCP Teardown Fast-Flush
- **Fast Teardown Flush**: Whenever a TCP packet with `FIN` or `RST` is captured, the flow is immediately extracted from the active flow table and sent to the export queue.
- **Idle Connection Reaper**: A background thread audits the flow table every 3 seconds and flushes UDP or idle streams inactive for >6 seconds.

### E. Dual-Engine Inference & Correlated Threat Evaluation
When micro-batches arrive at `POST /predict/batch`:
1. **Vectorized Matrix Building**: NumPy pre-allocates an `(N, 63)` float32 matrix and populates it at C-speed, sanitizing `NaN` and `Inf` to zero.
2. **Dual-Model Scoring**:
   - Random Forest produces signature attack probabilities $P(\text{Attack})$.
   - Isolation Forest transforms features through `if_scaler` and evaluates out-of-distribution anomaly distance.
3. **Correlation Decision Logic**:
   $$\text{Is\_Attack} = (P_{\text{RF}} \ge 0.15) \lor (S_{\text{IF}} \ge 0.65 \land P_{\text{RF}} \ge 0.05)$$
   - **CRITICAL**: $P_{\text{RF}} \ge 0.50$ (Confirmed severe volumetric DDoS / Botnet attack).
   - **HIGH**: $P_{\text{RF}} \ge 0.15$ (High confidence intrusion flow).
   - **NORMAL**: Legitimate background traffic ($P_{\text{RF}} < 0.01$).

### F. Real-Time SOC Web Dashboard & WebSocket Telemetry
- FastAPI serves a modern dark-mode Security Operations Center (SOC) dashboard at `http://127.0.0.1:8000/`.
- Dual-engine telemetry is streamed via WebSocket (`/ws/alerts`) to render live animated threat gauges, total flow meters, attack counters, rogue hardware warnings, and an intrusion event log.

---

## Step-by-Step Guide: How to Run

### Step 1: Start the Central ML Inference Service

Open **Terminal 1** and start the FastAPI engine:
```powershell
cd ml-service
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
You will see:
```text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```
> Keep Terminal 1 running in the background.

---

### Step 2: Access the Visual SOC Web Dashboard

Open your web browser and navigate to:
👉 **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

The dashboard will display:
- **System Status**: `CONNECTED (ML Pipeline Active)`
- **Live Metric Cards**: Total Flows Evaluated, Correlated Attacks Caught, Rogue Hardware Detected, System Health.
- **Real-Time Threat Intelligence Feed**: Live stream of flagged malicious flows and device breaches.

---

### Option A: Run in Live Physical Wi-Fi Mode

This mode binds to your physical Wi-Fi/Ethernet adapter and inspects live traffic flying across your card.

Open **Terminal 2** (run PowerShell as Administrator):
```powershell
python Daemon_controller/network_daemon.py --live
```
*(Or simply `python Daemon_controller/network_daemon.py`, as `--live` is default).*

#### Terminal Output:
```text
[+] Dynamically selected adapter: Wi-Fi (10.238.227.224)
[+] Whitelisted Host MAC: 50:5a:65:b8:cc:4d
[+] Monitoring Local LAN Subnet: 10.238.227.0/24
[+] Whitelisted Default Gateway: 10.238.227.44 (06:58:71:7a:95:1f)
[+] Attached to ML Service. Verified 63 features.
[*] Performing initial LAN device discovery from OS neighbor table...
[+] Active LAN devices discovered at startup: 2
[*] ThreatLens NDR Daemon running on interface: \Device\NPF_{...}...
[*] Sniffing live packets (IP + ARP) for intrusion detection and zero-trust device enforcement...
```
As you browse the web, the daemon reports live normal traffic:
```text
[*] Batch #12: 34 flows evaluated -> 0 threats (Traffic normal)
```

---

### Step 3: Inject Live Attacks Over the Wire

While `network_daemon.py` is sniffing in Terminal 2, open **Terminal 3** and run the attack simulator:

#### 1. Simulate Both Rogue Hardware Device & DDoS Surge (Default):
```powershell
python simulate_attack.py --mode wire --type both --count 5
```

#### 2. Simulate Only a Rogue Device MAC Violation:
```powershell
python simulate_attack.py --mode wire --type rogue
```

#### 3. Simulate Only a TCP DDoS Attack Burst:
```powershell
python simulate_attack.py --mode wire --type ddos --count 10
```

#### What Happens Live:
1. In **Terminal 3** (`simulate_attack.py`):
   - Blasts raw Layer-2 ARP frames with an unauthorized MAC address (`de:ad:be:ef:13:37`).
   - Injects raw TCP DDoS packets targeting Port 80, followed by TCP `FIN` teardown.
2. In **Terminal 2** (`network_daemon.py`):
   - Catches the ARP frame and logs:
     ```text
     [ROGUE DEVICE DETECTED] MAC: de:ad:be:ef:13:37 | IP: 10.238.227.180
     ```
   - Catches the DDoS packets, computes the 63 metrics, fast-flushes upon `FIN`, and logs:
     ```text
     [!] CRITICAL: 1 MALICIOUS FLOW(S) DETECTED IN BATCH #15:
         -> [HIGH] 205.174.165.73:58210 -> 10.238.227.224:80 (TCP) | RF: 0.2375 | IF Anomaly: HIGH
     ```
3. In **Your Web Browser** (`http://127.0.0.1:8000/`):
   - The **Correlated Attacks Caught** counter increments.
   - The **Rogue Hardware Detected** counter increments.
   - Red threat cards appear instantly in the live intelligence feed.

---

### Option B: Run in CICIDS2017 Dataset Replay Mode

If you are giving a demonstration or do not want to sniff live network interfaces, run the daemon in dataset replay mode. It streams real benign traffic and DDoS attack bursts directly from the official CSV:

Open **Terminal 2**:
```powershell
python Daemon_controller/network_daemon.py --dataset
```

#### What You Will See:
1. **Benign Traffic Phase**:
   ```text
   [*] [OK] Batch #001 (30 flows) | Threats: 0 | Phase: BENIGN (Normal LAN Traffic)
   [*] [OK] Batch #002 (30 flows) | Threats: 0 | Phase: BENIGN (Normal LAN Traffic)
   ```
2. **DDoS Attack Surge Phase** (as soon as attack rows are streamed):
   ```text
   [!] CRITICAL BREACH DETECTED: Batch #003 (30 flows) | 22 MALICIOUS INTRUSIONS CAUGHT:
       -> [CRITICAL] 205.174.165.73:50039 -> 192.168.10.50:80 | RF Score: 0.8750 | IF Anomaly: HIGH
       -> [CRITICAL] 205.174.165.73:50039 -> 192.168.10.50:80 | RF Score: 0.7625 | IF Anomaly: HIGH
   ```

---

## Testing & Verification Tools

The repository contains automated diagnostic and verification tools:

### 1. Full Automated Integration Test Suite
Tests all 4 components of the pipeline (63-feature schema completeness, API connectivity, real CICIDS2017 attack/benign evaluation, and Zero-Trust device broadcasting):
```powershell
python test_attack_detection.py
```
Expected output:
```text
==================================================
ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! (4/4)
==================================================
```

### 2. Standalone Offline Dataset Evaluator
Evaluates the pre-trained models on real CICIDS2017 samples:
```powershell
python run_dataset_detection.py
```
Expected output:
- **DDoS Detection Accuracy**: **90.0%** (Catches 9/10 attack flows).
- **Benign False Alarm Rate**: **0.0%** (0 false positives).

---

## Troubleshooting & FAQ

### Q1: `ModuleNotFoundError: No module named 'scapy'`
**Solution**: Ensure you are using the Python environment where dependencies were installed:
```powershell
python -m pip install -r requirements.txt
```

### Q2: `RuntimeError: Sniffing failed / Npcap not found`
**Solution**:
1. Download and install Npcap from [npcap.com](https://npcap.com/#download).
2. During installation, check the box: **"Install Npcap in WinPcap API-compatible Mode"**.
3. Open PowerShell as Administrator.

### Q3: Why does `simulate_attack.py` use `sendp()` instead of standard sockets or `send()`?
**Answer**: On Windows, sending standard Layer-3 IP packets to the local machine's IP address causes the Windows TCP/IP stack to route the packet internally to the loopback adapter (`127.0.0.1`), never hitting the physical Wi-Fi Npcap driver. Scapy's raw Layer-2 `sendp(Ether(...)/IP(...))` injects raw frames directly into the physical network interface, allowing Npcap to capture and analyze them live off the wire.

### Q4: How do I authorize a new device MAC so it is not flagged as a rogue device?
**Answer**: Add the MAC address (lowercase, colon-separated) to `AUTHORIZED_MACS` at the top of `Daemon_controller/network_daemon.py`:
```python
AUTHORIZED_MACS = {
    "50:5a:65:b8:cc:4d",  # Host PC
    "aa:bb:cc:dd:ee:ff",  # Authorized Office Laptop / Router
}
```

---

## Authors & Acknowledgments

- **Dataset**: Canadian Institute for Cybersecurity — **CICIDS2017 Benchmark Dataset**.
- **Architecture**: ThreatLens NDR Engineering Team.

