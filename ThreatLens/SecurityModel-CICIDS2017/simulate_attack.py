"""
ThreatLens NDR - Advanced Attack & Intrusion Simulator (CICIDS2017)
===================================================================
Transmits real raw network packets (Layer-2 Ethernet & Layer-3 TCP/IP)
over the physical network adapter to test live on-the-wire intrusion
detection and Zero-Trust device enforcement.

Modes:
  1. --mode wire (Default): Injects raw frames onto the physical Wi-Fi/LAN interface.
     - Rogue Hardware Device: Broadcasts unauthorized MACs (ARP/Ethernet).
     - DDoS Attack Bursts: Blasts CICIDS2017 Port 80 floods with TCP teardown.
  2. --mode api: Dispatches direct feature vectors from CSV to the ML REST API.
"""

import argparse
import ipaddress
import random
import sys
import time
from pathlib import Path

# Colors for terminal feedback
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_YELLOW = "\033[93m"
C_CYAN = "\033[96m"
C_BOLD = "\033[1m"
C_RESET = "\033[0m"

API_BASE_URL = "http://127.0.0.1:8000"


def get_active_interface():
    """Detects active physical network adapter."""
    try:
        from scapy.all import get_working_ifaces, conf
    except ImportError:
        print(f"{C_RED}[!] Scapy is required for raw packet injection. Install via 'pip install scapy'.{C_RESET}")
        sys.exit(1)

    candidates = []
    for iface in get_working_ifaces():
        ip = getattr(iface, "ip", None)
        name = str(getattr(iface, "name", "")).lower()
        desc = str(getattr(iface, "description", "")).lower()

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
        return candidates[0][1]

    return conf.iface


def inject_wire_rogue_device(iface, count: int = 1):
    """
    Transmits raw Layer-2 ARP and Ethernet frames with an unauthorized hardware MAC.
    network_daemon.py will sniff these packets live, identify the MAC policy violation,
    log [ROGUE DEVICE DETECTED], and notify the SOC dashboard.
    """
    from scapy.all import sendp, Ether, ARP

    print(f"\n{C_YELLOW}[*] ======================================================={C_RESET}")
    print(f"{C_YELLOW}[*] PHASE 1: INJECTING ROGUE HARDWARE DEVICE ONTO LAN WIRE{C_RESET}")
    print(f"{C_YELLOW}[*] ======================================================={C_RESET}")

    host_ip = getattr(iface, "ip", "10.238.227.224")
    # Generate an unknown rogue hardware MAC
    rogue_macs = [
        "de:ad:be:ef:13:37",
        "00:11:22:33:44:55",
        "6c:40:08:91:2a:4e"
    ]

    for i in range(count):
        rogue_mac = rogue_macs[i % len(rogue_macs)]
        # Pick an IP on the local subnet
        try:
            octets = host_ip.split(".")
            rogue_ip = f"{octets[0]}.{octets[1]}.{octets[2]}.{180 + i}"
        except Exception:
            rogue_ip = "10.238.227.199"

        print(f"[*] Transmitting Layer-2 ARP Probe from Rogue MAC {C_BOLD}{rogue_mac}{C_RESET} (Spoofed IP: {rogue_ip})...")
        arp_pkt = Ether(src=rogue_mac, dst="ff:ff:ff:ff:ff:ff") / ARP(
            op=1,
            hwsrc=rogue_mac,
            psrc=rogue_ip,
            hwdst="00:00:00:00:00:00",
            pdst=host_ip,
        )

        sendp(arp_pkt, iface=iface, verbose=0)
        print(f"{C_GREEN}[+] Injected ARP frame #{i+1} onto {getattr(iface, 'name', 'adapter')}.{C_RESET}")
        print(f"    -> Look at your network_daemon terminal for: {C_YELLOW}[ROGUE DEVICE DETECTED] MAC: {rogue_mac}{C_RESET}")
        time.sleep(0.5)


def inject_wire_ddos_flows(iface, count: int = 5):
    """
    Blasts real raw TCP DDoS packets over the physical network interface targeting Port 80.
    Generates forward HTTP request bursts and backward responses matching the CICIDS2017
    attack signature, followed by TCP teardown FIN to trigger immediate flow queuing.
    """
    from scapy.all import sendp, Ether, IP, TCP, Raw

    print(f"\n{C_RED}[*] ======================================================={C_RESET}")
    print(f"{C_RED}[*] PHASE 2: INJECTING CICIDS2017 DDOS BURST ONTO THE WIRE{C_RESET}")
    print(f"{C_RED}[*] ======================================================={C_RESET}")

    host_ip = getattr(iface, "ip", "10.238.227.224")
    host_mac = getattr(iface, "mac", "50:5a:65:b8:cc:4d")
    attacker_ip = "205.174.165.73"  # Official CICIDS2017 DDoS Botnet IP
    attacker_mac = "00:11:22:33:44:55"

    print(f"[*] Target Machine: {host_ip}:80 (MAC: {host_mac})")
    print(f"[*] Botnet Attacker: {attacker_ip} (MAC: {attacker_mac})")
    print(f"[*] Injecting {count} attack flow bursts onto interface '{getattr(iface, 'name', 'adapter')}'...\n")

    for flow_idx in range(1, count + 1):
        sport = 50000 + random.randint(100, 9999)

        # 1. Forward SYN (Initiates TCP Handshake)
        p1 = Ether(src=attacker_mac, dst=host_mac) / IP(src=attacker_ip, dst=host_ip) / TCP(
            sport=sport, dport=80, flags="S", window=8192
        )
        sendp(p1, iface=iface, verbose=0)
        time.sleep(0.02)

        # 2. Backward SYN+ACK (Server Handshake Response)
        p2 = Ether(src=host_mac, dst=attacker_mac) / IP(src=host_ip, dst=attacker_ip) / TCP(
            sport=80, dport=sport, flags="SA", window=229
        )
        sendp(p2, iface=iface, verbose=0)
        time.sleep(0.02)

        # 3. Forward HTTP DDoS GET Request (20-byte payload matching CICIDS2017 DDoS signature)
        http_payload = b"GET / HTTP/1.1\r\n\r\n"
        p3 = Ether(src=attacker_mac, dst=host_mac) / IP(src=attacker_ip, dst=host_ip) / TCP(
            sport=sport, dport=80, flags="PA", window=8192
        ) / Raw(http_payload)
        sendp(p3, iface=iface, verbose=0)
        time.sleep(0.02)

        # 4. Backward Data Responses (Chunks of 1400 bytes total ~5600 bytes)
        for _ in range(4):
            p4 = Ether(src=host_mac, dst=attacker_mac) / IP(src=host_ip, dst=attacker_ip) / TCP(
                sport=80, dport=sport, flags="A", window=229
            ) / Raw(b"X" * 1400)
            sendp(p4, iface=iface, verbose=0)
            time.sleep(0.01)

        # 5. TCP Teardown FIN Packet (Triggers instant fast-flush in network_daemon.py)
        p5 = Ether(src=attacker_mac, dst=host_mac) / IP(src=attacker_ip, dst=host_ip) / TCP(
            sport=sport, dport=80, flags="FA", window=8192
        )
        sendp(p5, iface=iface, verbose=0)

        print(f"{C_GREEN}[+] Injected Flow #{flow_idx:02d}: {attacker_ip}:{sport} -> {host_ip}:80 (TCP FIN flushed){C_RESET}")
        time.sleep(0.3)

    print(f"\n{C_CYAN}[*] Attack injection complete!{C_RESET}")
    print(f"{C_CYAN}[*] Check your network_daemon terminal for:{C_RESET}")
    print(f"    {C_RED}[!] CRITICAL: MALICIOUS FLOW(S) DETECTED{C_RESET}")
    print(f"{C_CYAN}[*] Check your SOC Web Dashboard at: {C_BOLD}http://127.0.0.1:8000/{C_RESET}\n")


def simulate_api_mode(count: int = 10):
    """Fallback mode: Dispatches samples directly to the FastAPI REST endpoint."""
    import httpx
    import pandas as pd

    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"

    print(f"\n[*] Simulating {count} CICIDS2017 DDoS attack flows via API...")
    try:
        info = httpx.get(f"{API_BASE_URL}/model-info", timeout=3.0).json()
        expected_feats = info.get("features", [])
    except Exception as e:
        print(f"[!] Could not reach ML service at {API_BASE_URL}: {e}")
        return

    df = pd.read_csv(data_path, nrows=35000)
    df.columns = [c.strip() for c in df.columns]
    ddos_samples = df[df["Label"] == "DDoS"].head(count)

    flows = []
    for idx, (_, row) in enumerate(ddos_samples.iterrows()):
        feat_dict = {}
        for f in expected_feats:
            val = row.get(f, 0.0)
            try:
                val = float(val)
                feat_dict[f] = 0.0 if (val != val or abs(val) == float("inf")) else val
            except Exception:
                feat_dict[f] = 0.0

        flows.append({
            "features": feat_dict,
            "metadata": {
                "src_ip": "205.174.165.73",
                "src_port": 50000 + idx,
                "dst_ip": "192.168.10.50",
                "dst_port": int(row.get("Destination Port", 80)),
                "proto": "TCP",
            },
        })

    resp = httpx.post(f"{API_BASE_URL}/predict/batch", json={"flows": flows}, timeout=10.0)
    if resp.status_code == 200:
        data = resp.json()
        alerts = data.get("alerts_triggered", 0)
        print(f"{C_GREEN}[+] Dispatched {len(flows)} flows -> {alerts} Attack Alerts Triggered!{C_RESET}")
        for f in data.get("flagged_flows", []):
            print(f"    - [{f['risk_level']}] {f['src_ip']}:{f['metadata'].get('src_port')} -> {f['dst_ip']}:{f['dst_port']} | RF: {f['rf_score']} | IF: {f['if_score']}")
    else:
        print(f"[!] Server returned HTTP {resp.status_code}: {resp.text}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ThreatLens Network Attack & Breach Simulator (CICIDS2017)")
    parser.add_argument(
        "--mode",
        choices=["wire", "api"],
        default="wire",
        help="Attack injection mode: 'wire' (real raw network packet injection) or 'api' (direct REST API)",
    )
    parser.add_argument(
        "--type",
        choices=["ddos", "rogue", "both"],
        default="both",
        help="Type of breach to simulate: 'ddos' (TCP Port 80 surge), 'rogue' (unauthorized hardware MAC), or 'both'",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=5,
        help="Number of attack flows or device probes to transmit (default: 5)",
    )
    args = parser.parse_args()

    print(f"\n{C_BOLD}========================================================================{C_RESET}")
    print(f"{C_BOLD}  ThreatLens Network Intrusion & Breach Simulator (CICIDS2017)         {C_RESET}")
    print(f"{C_BOLD}========================================================================{C_RESET}")

    if args.mode == "wire":
        iface = get_active_interface()
        print(f"[+] Dynamically selected network adapter: {C_BOLD}{getattr(iface, 'name', 'adapter')}{C_RESET}")
        print(f"[+] Physical IP: {getattr(iface, 'ip', 'N/A')} | MAC: {getattr(iface, 'mac', 'N/A')}")

        if args.type in ["rogue", "both"]:
            inject_wire_rogue_device(iface, count=min(args.count, 3))
        if args.type in ["ddos", "both"]:
            inject_wire_ddos_flows(iface, count=args.count)
    else:
        simulate_api_mode(count=args.count)
