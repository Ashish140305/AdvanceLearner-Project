import ipaddress
import math
import queue
import subprocess
import sys
import threading
import time
from collections import defaultdict

import httpx
import numpy as np
from scapy.all import (
    ARP,
    Ether,
    IP,
    TCP,
    UDP,
    AsyncSniffer,
    conf,
    get_working_ifaces,
    getmacbyip,
)

# ============================================================
# ThreatLens NDR - Production Network Daemon (CICIDS2017)
# ============================================================

BATCH_SIZE = 50
FLUSH_INTERVAL = 1.0  # seconds
API_BASE_URL = "http://127.0.0.1:8000"
BATCH_INGEST_URL = f"{API_BASE_URL}/predict/batch"
DEVICE_ALERT_URL = f"{API_BASE_URL}/api/v1/alerts/device"
MODEL_INFO_URL = f"{API_BASE_URL}/model-info"

# Configure whitelisted MACs (lowercase, colon-separated)
AUTHORIZED_MACS = {
    # Default host interface MAC (AzureWave OUI 50:5a:65)
    "50:5a:65:b8:cc:4d",
}


def normalize_mac(mac_str: str) -> str:
    """Normalizes MAC address to lowercase colon-separated format."""
    if not mac_str:
        return ""
    clean = mac_str.strip().lower().replace("-", ":")
    return clean


def is_special_mac(mac: str) -> bool:
    """Identifies broadcast or multicast MAC addresses."""
    if not mac or len(mac) < 17:
        return True
    if mac == "ff:ff:ff:ff:ff:ff":
        return True
    if mac.startswith("01:00:5e") or mac.startswith("33:33:"):
        return True
    return False


def get_active_interface():
    """Dynamically locates the physical Wi-Fi/Ethernet interface carrying default LAN traffic."""
    candidates = []

    for iface in get_working_ifaces():
        ip = getattr(iface, "ip", None)
        name = str(getattr(iface, "name", "")).lower()
        desc = str(getattr(iface, "description", "")).lower()

        # Skip unassigned or loopback/APIPA IPs
        if not ip or ip.startswith("127.") or ip.startswith("169.254."):
            continue

        try:
            ip_obj = ipaddress.IPv4Address(ip)
            if not ip_obj.is_private:
                continue
        except ValueError:
            continue

        score = 0
        if any(k in name or k in desc for k in ["wi-fi", "wireless", "802.11"]):
            score += 10
        if any(k in name or k in desc for k in ["ethernet", "realtek", "intel"]):
            score += 5
        if any(k in name or k in desc for k in ["hyper-v", "virtual", "tap", "tun"]):
            score -= 10

        candidates.append((score, iface))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        best_iface = candidates[0][1]
        print(f"[+] Dynamically selected adapter: {best_iface.name} ({best_iface.ip})")
        return best_iface

    print("[!] Warning: Auto-detection fell back to Scapy default adapter.")
    return conf.iface


class FlowRecord:
    """Computes bidirectional statistical features matching the 63 CICIDS2017 schema."""

    def __init__(self, src_ip, src_port, dst_ip, dst_port, proto):
        self.src_ip = src_ip
        self.src_port = src_port
        self.dst_ip = dst_ip
        self.dst_port = dst_port
        self.proto = proto

        self.start_time = time.time()
        self.last_seen = self.start_time

        self.fwd_pkt_lens = []
        self.bwd_pkt_lens = []
        self.flow_iats = []

        self.fin_cnt = 0
        self.syn_cnt = 0
        self.rst_cnt = 0
        self.psh_cnt = 0
        self.ack_cnt = 0
        self.urg_cnt = 0
        self.ece_cnt = 0

        self.fwd_hdr_len = 0
        self.bwd_hdr_len = 0
        self.fwd_iats = []
        self.bwd_iats = []
        self.last_fwd_time = None
        self.last_bwd_time = None

        self.init_win_fwd = 0
        self.init_win_bwd = 0
        self.fwd_psh_cnt = 0
        self.fwd_urg_cnt = 0
        self.act_data_pkt_fwd = 0
        self.min_seg_size_forward = 32

    def update(self, pkt, is_forward: bool):
        now = time.time()
        if self.last_seen:
            self.flow_iats.append((now - self.last_seen) * 1e6)
        self.last_seen = now

        ip_hdr_len = 20
        if pkt.haslayer(IP):
            ihl = getattr(pkt[IP], "ihl", 5) or 5
            ip_hdr_len = ihl * 4

        trans_hdr_len = 0
        payload_len = 0

        if pkt.haslayer(TCP):
            tcp = pkt[TCP]
            dataofs = getattr(tcp, "dataofs", 5) or 5
            trans_hdr_len = dataofs * 4
            payload = getattr(tcp, "payload", None)
            payload_len = len(payload) if payload else 0
            flags = str(getattr(tcp, "flags", ""))

            if "F" in flags:
                self.fin_cnt += 1
            if "S" in flags:
                self.syn_cnt += 1
            if "R" in flags:
                self.rst_cnt += 1
            if "P" in flags:
                self.psh_cnt += 1
                if is_forward:
                    self.fwd_psh_cnt += 1
            if "A" in flags:
                self.ack_cnt += 1
            if "U" in flags:
                self.urg_cnt += 1
                if is_forward:
                    self.fwd_urg_cnt += 1
            if "E" in flags:
                self.ece_cnt += 1

            win = getattr(tcp, "window", 0) or 0
            if is_forward and self.init_win_fwd == 0:
                self.init_win_fwd = win
            elif not is_forward and self.init_win_bwd == 0:
                self.init_win_bwd = win

        elif pkt.haslayer(UDP):
            trans_hdr_len = 8
            payload = getattr(pkt[UDP], "payload", None)
            payload_len = len(payload) if payload else 0

        total_hdr_len = ip_hdr_len + trans_hdr_len

        if is_forward:
            if self.last_fwd_time is not None:
                self.fwd_iats.append((now - self.last_fwd_time) * 1e6)
            self.last_fwd_time = now
            self.fwd_pkt_lens.append(payload_len)
            self.fwd_hdr_len += total_hdr_len
            if payload_len > 0:
                self.act_data_pkt_fwd += 1
            if trans_hdr_len > 0:
                self.min_seg_size_forward = min(self.min_seg_size_forward, trans_hdr_len)
        else:
            if self.last_bwd_time is not None:
                self.bwd_iats.append((now - self.last_bwd_time) * 1e6)
            self.last_bwd_time = now
            self.bwd_pkt_lens.append(payload_len)
            self.bwd_hdr_len += total_hdr_len

    def compute_metrics(self) -> dict:
        """Calculates all 63 CICIDS2017 features matching the trained model schema."""
        duration_sec = max(self.last_seen - self.start_time, 0.000001)
        duration_micros = duration_sec * 1e6

        fwd_lens = (
            np.array(self.fwd_pkt_lens, dtype=np.float64)
            if self.fwd_pkt_lens
            else np.zeros(1, dtype=np.float64)
        )
        bwd_lens = (
            np.array(self.bwd_pkt_lens, dtype=np.float64)
            if self.bwd_pkt_lens
            else np.zeros(1, dtype=np.float64)
        )
        flow_lens = np.concatenate([fwd_lens, bwd_lens])

        total_fwd_pkts = len(self.fwd_pkt_lens)
        total_bwd_pkts = len(self.bwd_pkt_lens)
        total_pkts = total_fwd_pkts + total_bwd_pkts

        total_fwd_bytes = float(np.sum(fwd_lens))
        total_bwd_bytes = float(np.sum(bwd_lens))
        total_bytes = total_fwd_bytes + total_bwd_bytes

        fl_iat = (
            np.array(self.flow_iats, dtype=np.float64)
            if self.flow_iats
            else np.zeros(1, dtype=np.float64)
        )
        fwd_iat = (
            np.array(self.fwd_iats, dtype=np.float64)
            if self.fwd_iats
            else np.zeros(1, dtype=np.float64)
        )
        bwd_iat = (
            np.array(self.bwd_iats, dtype=np.float64)
            if self.bwd_iats
            else np.zeros(1, dtype=np.float64)
        )

        return {
            "Destination Port": float(self.dst_port),
            "Flow Duration": float(duration_micros),
            "Total Fwd Packets": float(total_fwd_pkts),
            "Total Backward Packets": float(total_bwd_pkts),
            "Total Length of Fwd Packets": total_fwd_bytes,
            "Total Length of Bwd Packets": total_bwd_bytes,
            "Fwd Packet Length Max": float(np.max(fwd_lens)),
            "Fwd Packet Length Min": float(np.min(fwd_lens)),
            "Fwd Packet Length Mean": float(np.mean(fwd_lens)),
            "Fwd Packet Length Std": float(np.std(fwd_lens)),
            "Bwd Packet Length Max": float(np.max(bwd_lens)),
            "Bwd Packet Length Min": float(np.min(bwd_lens)),
            "Bwd Packet Length Mean": float(np.mean(bwd_lens)),
            "Bwd Packet Length Std": float(np.std(bwd_lens)),
            "Flow Bytes/s": float(total_bytes / duration_sec),
            "Flow Packets/s": float(total_pkts / duration_sec),
            "Flow IAT Mean": float(np.mean(fl_iat)),
            "Flow IAT Std": float(np.std(fl_iat)),
            "Flow IAT Max": float(np.max(fl_iat)),
            "Flow IAT Min": float(np.min(fl_iat)),
            "Fwd IAT Total": float(np.sum(fwd_iat)),
            "Fwd IAT Mean": float(np.mean(fwd_iat)),
            "Fwd IAT Std": float(np.std(fwd_iat)),
            "Fwd IAT Max": float(np.max(fwd_iat)),
            "Fwd IAT Min": float(np.min(fwd_iat)),
            "Bwd IAT Total": float(np.sum(bwd_iat)),
            "Bwd IAT Mean": float(np.mean(bwd_iat)),
            "Bwd IAT Std": float(np.std(bwd_iat)),
            "Bwd IAT Max": float(np.max(bwd_iat)),
            "Bwd IAT Min": float(np.min(bwd_iat)),
            "Fwd PSH Flags": float(self.fwd_psh_cnt),
            "Fwd URG Flags": float(self.fwd_urg_cnt),
            "Fwd Header Length": float(self.fwd_hdr_len),
            "Bwd Header Length": float(self.bwd_hdr_len),
            "Fwd Packets/s": float(total_fwd_pkts / duration_sec),
            "Bwd Packets/s": float(total_bwd_pkts / duration_sec),
            "Min Packet Length": float(np.min(flow_lens)),
            "Max Packet Length": float(np.max(flow_lens)),
            "Packet Length Mean": float(np.mean(flow_lens)),
            "Packet Length Std": float(np.std(flow_lens)),
            "Packet Length Variance": float(np.var(flow_lens)),
            "FIN Flag Count": float(self.fin_cnt),
            "RST Flag Count": float(self.rst_cnt),
            "PSH Flag Count": float(self.psh_cnt),
            "ACK Flag Count": float(self.ack_cnt),
            "URG Flag Count": float(self.urg_cnt),
            "ECE Flag Count": float(self.ece_cnt),
            "Down/Up Ratio": float(total_bwd_pkts / max(total_fwd_pkts, 1)),
            "Average Packet Size": float(total_bytes / max(total_pkts, 1)),
            "Subflow Fwd Bytes": total_fwd_bytes,
            "Subflow Bwd Bytes": total_bwd_bytes,
            "Init_Win_bytes_forward": float(self.init_win_fwd),
            "Init_Win_bytes_backward": float(self.init_win_bwd),
            "act_data_pkt_fwd": float(self.act_data_pkt_fwd),
            "min_seg_size_forward": float(self.min_seg_size_forward),
            "Active Mean": float(duration_micros),
            "Active Std": 0.0,
            "Active Max": float(duration_micros),
            "Active Min": float(duration_micros),
            "Idle Mean": 0.0,
            "Idle Std": 0.0,
            "Idle Max": 0.0,
            "Idle Min": 0.0,
        }


class ProductionDaemon:

    def __init__(self, interface=None):
        self.interface = interface if interface is not None else get_active_interface()
        self.flow_table = {}
        self.table_lock = threading.Lock()
        self.export_queue = queue.Queue(maxsize=20000)

        # Initialize known and authorized MACs
        self.authorized_macs = set()
        for mac in AUTHORIZED_MACS:
            clean = normalize_mac(mac)
            if clean:
                self.authorized_macs.add(clean)

        self.known_macs = set(self.authorized_macs)

        # Automatically resolve and whitelist local host MAC and gateway
        self.host_ip = getattr(self.interface, "ip", "127.0.0.1")
        self.host_mac = normalize_mac(getattr(self.interface, "mac", ""))
        if self.host_mac:
            self.authorized_macs.add(self.host_mac)
            self.known_macs.add(self.host_mac)
            print(f"[+] Whitelisted Host MAC: {self.host_mac}")

        # Resolve local subnet
        try:
            self.local_subnet = ipaddress.IPv4Network(f"{self.host_ip}/24", strict=False)
            print(f"[+] Monitoring Local LAN Subnet: {self.local_subnet}")
        except Exception:
            self.local_subnet = None

        # Resolve gateway MAC
        self._resolve_gateway()

        self.http = httpx.Client(
            timeout=3.0,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
        )
        self.required_features = []
        self.running = True
        self._pkt_count = 0
        self._batch_count = 0
        self._sync_schema()
        self._discover_lan_neighbors()

    def _resolve_gateway(self):
        """Discovers default gateway IP and MAC to prevent gateway false positives."""
        try:
            route_info = conf.route.route("0.0.0.0")
            if route_info and len(route_info) >= 3:
                gw_ip = route_info[2]
                gw_mac = getmacbyip(gw_ip)
                if gw_mac:
                    gw_mac_clean = normalize_mac(gw_mac)
                    self.authorized_macs.add(gw_mac_clean)
                    self.known_macs.add(gw_mac_clean)
                    print(f"[+] Whitelisted Default Gateway: {gw_ip} ({gw_mac_clean})")
        except Exception as e:
            print(f"[*] Note: Gateway discovery skipped: {e}")

    def _discover_lan_neighbors(self):
        """Scans local ARP cache on startup to report currently active devices."""
        print("[*] Performing initial LAN device discovery from OS neighbor table...")
        discovered = 0
        try:
            # Query PowerShell Get-NetNeighbor or arp -a
            cmd = 'Get-NetNeighbor -AddressFamily IPv4 | Where-Object { $_.State -ne "Unreachable" } | Select-Object IPAddress, LinkLayerAddress'
            proc = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True, timeout=5)
            if proc.returncode == 0:
                for line in proc.stdout.splitlines():
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        ip, raw_mac = parts[0], parts[1]
                        mac = normalize_mac(raw_mac)
                        if mac and not is_special_mac(mac):
                            discovered += 1
                            status = "AUTHORIZED" if mac in self.authorized_macs else "UNKNOWN/MONITORED"
                            print(f"    - Device on LAN: IP: {ip:<16} MAC: {mac} [{status}]")
                            self.known_macs.add(mac)
        except Exception:
            pass
        print(f"[+] Active LAN devices discovered at startup: {discovered}")

    def _sync_schema(self):
        """Fetches the 63 required column names from the active ML service."""
        try:
            res = self.http.get(MODEL_INFO_URL)
            res.raise_for_status()
            self.required_features = res.json().get("features", [])
            print(f"[+] Attached to ML Service. Verified {len(self.required_features)} features.")
        except Exception as e:
            print(f"[!] Warning: Could not reach {MODEL_INFO_URL}. Ensure ML Service is running:\n    {e}")

    def _canonical_key(self, ip1, p1, ip2, p2, proto):
        return (ip1, p1, ip2, p2, proto) if (ip1, p1) < (ip2, p2) else (ip2, p2, ip1, p1, proto)

    def _check_device(self, pkt):
        """Inspects Layer-2 Ethernet and ARP frames for rogue hardware enforcement."""
        mac = None
        ip = "Layer-2"

        if pkt.haslayer(ARP):
            mac = normalize_mac(pkt[ARP].hwsrc)
            ip = pkt[ARP].psrc
        elif pkt.haslayer(IP) and pkt.haslayer(Ether):
            src_ip = pkt[IP].src
            # Only consider device MAC if source IP is on our local private LAN subnet
            if self.local_subnet:
                try:
                    ip_obj = ipaddress.IPv4Address(src_ip)
                    if ip_obj in self.local_subnet:
                        mac = normalize_mac(pkt[Ether].src)
                        ip = src_ip
                except ValueError:
                    pass

        if not mac or is_special_mac(mac):
            return

        if mac not in self.known_macs:
            self.known_macs.add(mac)
            is_rogue = mac not in self.authorized_macs
            if is_rogue:
                print(f"\n\033[93m[ROGUE DEVICE DETECTED] MAC: {mac} | IP: {ip}\033[0m")
                try:
                    self.http.post(
                        DEVICE_ALERT_URL,
                        json={"mac_address": mac, "ip_address": ip, "timestamp": time.time()},
                    )
                except Exception:
                    pass

    def packet_handler(self, pkt):
        self._check_device(pkt)

        if not pkt.haslayer(IP):
            return

        self._pkt_count += 1
        if self._pkt_count % 25 == 0:
            active_flows = len(self.flow_table)
            print(
                f"\r[*] Packets captured: {self._pkt_count} | Active flows: {active_flows} | Batches sent: {self._batch_count}",
                end="",
                flush=True,
            )

        proto = "TCP" if pkt.haslayer(TCP) else ("UDP" if pkt.haslayer(UDP) else None)
        if not proto:
            return

        sport = pkt[TCP].sport if proto == "TCP" else pkt[UDP].sport
        dport = pkt[TCP].dport if proto == "TCP" else pkt[UDP].dport
        src_ip, dst_ip = pkt[IP].src, pkt[IP].dst

        key = self._canonical_key(src_ip, sport, dst_ip, dport, proto)

        with self.table_lock:
            if key not in self.flow_table:
                self.flow_table[key] = FlowRecord(src_ip, sport, dst_ip, dport, proto)

            flow = self.flow_table[key]
            is_forward = (src_ip == flow.src_ip) and (sport == flow.src_port)
            flow.update(pkt, is_forward)

            # Fast flush on TCP Teardown (FIN or RST flags)
            if proto == "TCP":
                flags = str(getattr(pkt[TCP], "flags", ""))
                if "F" in flags or "R" in flags:
                    self._queue_flow(key)

    def _queue_flow(self, key):
        if key in self.flow_table:
            try:
                flow = self.flow_table.pop(key)
                stats = flow.compute_metrics()

                # Map calculated metrics to match the required feature ordering
                features_payload = {}
                feature_list = self.required_features if self.required_features else list(stats.keys())
                for feat in feature_list:
                    clean = feat.strip()
                    val = stats.get(clean, stats.get(feat, 0.0))
                    features_payload[feat] = float(val) if not (math.isnan(val) or math.isinf(val)) else 0.0

                item = {
                    "features": features_payload,
                    "metadata": {
                        "src_ip": flow.src_ip,
                        "src_port": flow.src_port,
                        "dst_ip": flow.dst_ip,
                        "dst_port": flow.dst_port,
                        "proto": flow.proto,
                    },
                }

                try:
                    self.export_queue.put_nowait(item)
                except queue.Full:
                    pass
            except Exception as e:
                print(f"\n[!] Error queueing flow: {e}")

    def _batch_sender_worker(self):
        """Dispatches micro-batches of flows to POST /predict/batch."""
        batch = []
        last_flush = time.time()

        while self.running:
            try:
                item = self.export_queue.get(timeout=0.1)
                batch.append(item)
            except queue.Empty:
                pass

            now = time.time()
            if len(batch) >= BATCH_SIZE or (batch and (now - last_flush) > FLUSH_INTERVAL):
                if not self.required_features:
                    self._sync_schema()
                try:
                    resp = self.http.post(BATCH_INGEST_URL, json={"flows": batch})
                    if resp.status_code == 200:
                        self._batch_count += 1
                        data = resp.json()
                        alerts = data.get("alerts_triggered", 0)
                        flagged = data.get("flagged_flows", [])

                        if alerts > 0:
                            print(
                                f"\n\033[91m[!] CRITICAL: {alerts} MALICIOUS FLOW(S) DETECTED IN BATCH #{self._batch_count}:\033[0m"
                            )
                            for item in flagged:
                                meta = item.get("metadata", {})
                                rf = item.get("rf_score", 0.0)
                                anom = item.get("if_anomaly_level", "NORMAL")
                                risk = item.get("risk_level", "HIGH")
                                print(
                                    f"    -> [{risk}] {meta.get('src_ip')}:{meta.get('src_port')} -> "
                                    f"{meta.get('dst_ip')}:{meta.get('dst_port')} ({meta.get('proto')}) | "
                                    f"RF: {rf:.4f} | IF Anomaly: {anom}"
                                )
                        else:
                            print(
                                f"\r[*] Batch #{self._batch_count}: {len(batch)} flows evaluated -> 0 threats (Traffic normal)",
                                end="",
                                flush=True,
                            )
                    else:
                        print(f"\n[!] Batch inference rejected: HTTP {resp.status_code}")
                except httpx.ConnectError:
                    pass  # Service not yet started
                except Exception as e:
                    print(f"\n[!] Batch export error: {e}")

                batch = []
                last_flush = time.time()

    def flow_reaper(self):
        """Flushes idle connections (streaming, video, UDP) every 3 seconds."""
        while self.running:
            time.sleep(3.0)
            now = time.time()
            to_flush = []

            with self.table_lock:
                for key, flow in self.flow_table.items():
                    if (now - flow.last_seen > 6.0) or (now - flow.start_time > 20.0):
                        to_flush.append(key)

                for key in to_flush:
                    self._queue_flow(key)

    def start(self):
        sender_thread = threading.Thread(target=self._batch_sender_worker, daemon=True)
        sender_thread.start()

        reaper_thread = threading.Thread(target=self.flow_reaper, daemon=True)
        reaper_thread.start()

        print(f"[*] ThreatLens NDR Daemon running on interface: {self.interface}...")
        print("[*] Sniffing live packets (IP + ARP) for intrusion detection and zero-trust device enforcement...")

        # Sniff both IP and ARP frames
        sniffer = AsyncSniffer(
            prn=self.packet_handler,
            filter="",
            store=False,
            iface=self.interface,
        )
        sniffer.start()
        sniffer.join()


def run_dataset_streaming_daemon(batch_size=30, interval=1.5):
    """
    Streams flows directly from Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv
    into the ML service in alternating batches of Benign traffic and DDoS attack bursts.
    Provides instant, deterministic attack detection and zero-trust device monitoring.
    """
    import pandas as pd
    from pathlib import Path

    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"

    print("=" * 72)
    print("  ThreatLens NDR - CICIDS2017 Real-Time Intrusion & Breach Daemon")
    print("  Mode: Direct Dataset Stream & Dual-Engine Detection")
    print("=" * 72)

    client = httpx.Client(timeout=10.0)

    # 1. Sync features with ML service
    print(f"[*] Attaching to ML Service at {MODEL_INFO_URL}...")
    try:
        res = client.get(MODEL_INFO_URL)
        res.raise_for_status()
        required_features = res.json().get("features", [])
        print(f"[+] Attached to ML Service. Verified {len(required_features)} features.")
    except Exception as e:
        print(f"\n[!] Could not connect to ML service at {MODEL_INFO_URL}.")
        print("    Please ensure the ML service is running in a separate terminal:")
        print("    cd ml-service; python -m uvicorn app:app --host 127.0.0.1 --port 8000\n")
        return

    # 2. Load dataset
    print(f"[*] Loading network flows from: {data_path.name}...")
    df = pd.read_csv(data_path, nrows=40000)
    df.columns = [c.strip() for c in df.columns]

    benign_rows = df[df["Label"] == "BENIGN"].reset_index(drop=True)
    ddos_rows = df[df["Label"] == "DDoS"].reset_index(drop=True)
    print(f"[+] Dataset ready: {len(benign_rows)} Benign flows, {len(ddos_rows)} DDoS flows.\n")

    # Broadcast device status
    try:
        client.post(DEVICE_ALERT_URL, json={
            "mac_address": "50:5a:65:b8:cc:4d",
            "ip_address": "192.168.10.50",
            "alert_type": "PROTECTED_HOST_ACTIVE",
            "timestamp": time.time()
        })
    except Exception:
        pass

    batch_idx = 0
    b_ptr = 0
    d_ptr = 0

    print("[*] Streaming live network flows through Dual-Engine ML Pipeline...")
    print("[*] (Press CTRL+C anytime to stop)\n")

    try:
        while True:
            batch_idx += 1
            # Alternate batches: Benign (batches 1, 2) -> DDoS Attack Surge (batch 3) -> repeat
            is_attack_batch = (batch_idx % 3 == 0)

            def sanitize_feat(v):
                try:
                    f = float(v)
                    return 0.0 if (math.isnan(f) or math.isinf(f)) else f
                except Exception:
                    return 0.0

            batch_flows = []
            if not is_attack_batch:
                # Select benign flows
                chunk = benign_rows.iloc[b_ptr : b_ptr + batch_size]
                b_ptr = (b_ptr + batch_size) % max(1, len(benign_rows) - batch_size)
                src_ip = f"192.168.10.{10 + (batch_idx % 15)}"
                for _, row in chunk.iterrows():
                    feat_dict = {f: sanitize_feat(row.get(f, 0.0)) for f in required_features}
                    batch_flows.append({
                        "features": feat_dict,
                        "metadata": {
                            "src_ip": src_ip,
                            "src_port": 49152 + (batch_idx * 7) % 15000,
                            "dst_ip": "192.168.10.50",
                            "dst_port": int(row.get("Destination Port", 80)),
                            "proto": "TCP"
                        }
                    })
                phase_label = "BENIGN (Normal LAN Traffic)"
            else:
                # Select DDoS attack flows
                chunk = ddos_rows.iloc[d_ptr : d_ptr + batch_size]
                d_ptr = (d_ptr + batch_size) % max(1, len(ddos_rows) - batch_size)
                attacker_ip = "205.174.165.73"  # Known CICIDS2017 DDoS Botnet IP
                for _, row in chunk.iterrows():
                    feat_dict = {f: sanitize_feat(row.get(f, 0.0)) for f in required_features}
                    batch_flows.append({
                        "features": feat_dict,
                        "metadata": {
                            "src_ip": attacker_ip,
                            "src_port": 50000 + (batch_idx * 13) % 15000,
                            "dst_ip": "192.168.10.50",
                            "dst_port": int(row.get("Destination Port", 80)),
                            "proto": "TCP"
                        }
                    })
                phase_label = "\033[91mDDoS ATTACK SURGE (Botnet 205.174.165.73 -> Port 80)\033[0m"

            # Post batch to ML engine
            try:
                resp = client.post(BATCH_INGEST_URL, json={"flows": batch_flows})
                if resp.status_code == 200:
                    data = resp.json()
                    alerts = data.get("alerts_triggered", 0)
                    flagged = data.get("flagged_flows", [])

                    if alerts > 0:
                        print(f"\n\033[91m[!] CRITICAL BREACH DETECTED: Batch #{batch_idx} ({len(batch_flows)} flows) | {alerts} MALICIOUS INTRUSIONS CAUGHT:\033[0m")
                        for item in flagged[:4]:  # Show top 4 alerts
                            meta = item.get("metadata", {})
                            rf = item.get("rf_score", 0.0)
                            anom = item.get("if_anomaly_level", "HIGH")
                            risk = item.get("risk_level", "CRITICAL")
                            print(f"    -> [{risk}] {meta.get('src_ip')}:{meta.get('src_port')} -> {meta.get('dst_ip')}:{meta.get('dst_port')} | RF Score: {rf:.4f} | IF Anomaly: {anom}")
                        if alerts > 4:
                            print(f"    -> ... and {alerts - 4} more malicious flows flagged in this burst.")
                    else:
                        print(f"[*] [OK] Batch #{batch_idx:03d} ({len(batch_flows)} flows) | Threats: 0 | Phase: {phase_label}")

            except Exception as e:
                print(f"[!] Error sending batch #{batch_idx}: {e}")

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n[*] Stopping Dataset Streamer cleanly.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="ThreatLens NDR Daemon (CICIDS2017)")
    parser.add_argument("--live", action="store_true", help="Sniff live physical network interface (Default)")
    parser.add_argument("--dataset", action="store_true", help="Stream and replay flows directly from CICIDS2017 CSV dataset")
    args = parser.parse_args()

    if args.dataset:
        run_dataset_streaming_daemon()
    else:
        # Default mode: Live physical network interface sniffing
        daemon = ProductionDaemon()
        try:
            daemon.start()
        except KeyboardInterrupt:
            print("\nStopping daemon gracefully.")
            daemon.running = False
            sys.exit(0)