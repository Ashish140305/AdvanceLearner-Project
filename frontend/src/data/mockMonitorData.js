import { Monitor, Server, Smartphone, Printer, Cpu, Activity, ShieldAlert, Wifi } from 'lucide-react';

export const liveMonitorStats = {
  activeDevices: { value: "24", trend: "+3 in the last hour", isPositive: true },
  activeConnections: { value: "138", trend: "+12 currently", isPositive: true },
  incomingTraffic: { value: "4.8 MB/s", trend: "Steady", isPositive: true },
  outgoingTraffic: { value: "3.2 MB/s", trend: "Normal range", isPositive: true }
};

export const connectedDevices = [
  { id: 1, name: "Admin Laptop", ip: "192.168.1.12", mac: "00:1B:44:11:3A:B7", type: "Laptop", status: "Online", traffic: "1.2 MB/s", lastSeen: "Just now", icon: Monitor },
  { id: 2, name: "Office Desktop", ip: "192.168.1.15", mac: "00:14:22:01:23:45", type: "Desktop", status: "Online", traffic: "0.8 MB/s", lastSeen: "Just now", icon: Monitor },
  { id: 3, name: "Mobile Device", ip: "192.168.1.24", mac: "B0:34:95:67:89:AB", type: "Mobile", status: "Online", traffic: "0.1 MB/s", lastSeen: "2 min ago", icon: Smartphone },
  { id: 4, name: "Network Printer", ip: "192.168.1.5", mac: "C4:12:F5:44:19:D4", type: "Printer", status: "Idle", traffic: "0.0 MB/s", lastSeen: "5 min ago", icon: Printer },
  { id: 5, name: "Main Router", ip: "192.168.1.1", mac: "08:00:27:12:34:56", type: "Router", status: "Online", traffic: "8.0 MB/s", lastSeen: "Just now", icon: Server },
  { id: 6, name: "IoT Sensor Hub", ip: "192.168.1.31", mac: "00:A0:C9:14:C8:29", type: "IoT", status: "Offline", traffic: "0.0 MB/s", lastSeen: "1 hr ago", icon: Cpu },
  { id: 7, name: "Guest Mobile", ip: "192.168.1.55", mac: "3A:5B:9C:78:E2:11", type: "Mobile", status: "Suspicious", traffic: "3.5 MB/s", lastSeen: "Just now", icon: Smartphone }
];

export const networkActivity = [
  { id: 1, event: "New device detected", target: "192.168.1.24 connected", time: "2 mins ago", severity: "info", icon: Wifi },
  { id: 2, event: "Unusual traffic detected", target: "192.168.1.18 exceeded normal traffic", time: "15 mins ago", severity: "warning", icon: Activity },
  { id: 3, event: "Device disconnected", target: "192.168.1.31 went offline", time: "1 hour ago", severity: "neutral", icon: Server },
  { id: 4, event: "Connection established", target: "192.168.1.12 connected to gateway", time: "3 hours ago", severity: "success", icon: Monitor },
  { id: 5, event: "Suspicious port scan", target: "192.168.1.55 multiple failed knocks", time: "4 hours ago", severity: "danger", icon: ShieldAlert }
];

export const liveTrafficChartData = [
  { time: '10:00:00', incoming: 2.1, outgoing: 1.2 },
  { time: '10:00:10', incoming: 3.5, outgoing: 2.0 },
  { time: '10:00:20', incoming: 4.8, outgoing: 1.8 },
  { time: '10:00:30', incoming: 3.2, outgoing: 2.5 },
  { time: '10:00:40', incoming: 2.8, outgoing: 1.5 },
  { time: '10:00:50', incoming: 4.2, outgoing: 3.2 },
  { time: '10:01:00', incoming: 5.1, outgoing: 2.8 },
];
