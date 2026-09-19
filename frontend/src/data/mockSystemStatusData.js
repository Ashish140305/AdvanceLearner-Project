export const overallStatus = {
  isOperational: true,
  operationalCount: 6,
  totalCount: 7,
  message: "Network monitoring and ML detection services are running normally. Expected elevated response times on History queries.",
  lastChecked: "6:42:18 PM"
};

export const systemMetrics = {
  cpuUsage: "34%",
  memoryUsage: "61%",
  networkThroughput: "8.2 MB/s",
  activeConnections: 138,
  uptime: "3d 14h 27m"
};

export const modelStatus = {
  randomForest: "Operational",
  isolationForest: "Operational",
  dataset: "CICIDS2017",
  features: 63,
  modelVersion: "v1.0.0",
  inferenceEngine: "Ready"
};

export const apiHealth = [
  { endpoint: "/health", name: "Health Check", status: "Operational" },
  { endpoint: "/model-info", name: "Model Information", status: "Operational" },
  { endpoint: "/api/v1/history", name: "History", status: "Degraded" },
  { endpoint: "/predict", name: "Prediction", status: "Ready" },
  { endpoint: "/predict/batch", name: "Batch Prediction", status: "Ready" },
  { endpoint: "/ws/alerts", name: "Alert Stream", status: "Connected" }
];

export const responseTimeData = [
  { time: '18:15', 'API Backend': 40, 'History Service': 120, 'Detection': 60 },
  { time: '18:20', 'API Backend': 42, 'History Service': 140, 'Detection': 65 },
  { time: '18:25', 'API Backend': 45, 'History Service': 220, 'Detection': 62 },
  { time: '18:30', 'API Backend': 41, 'History Service': 310, 'Detection': 70 }, 
  { time: '18:35', 'API Backend': 40, 'History Service': 295, 'Detection': 68 },
  { time: '18:40', 'API Backend': 43, 'History Service': 315, 'Detection': 61 }
];

export const services = [
  { id: 'srv-1', name: 'Network Monitor', status: 'Operational', description: 'Monitoring LAN devices and network traffic.', responseTime: 'N/A' },
  { id: 'srv-2', name: 'ML Detection Engine', status: 'Operational', description: 'Processing network flows for threat detection.', responseTime: '62 ms' },
  { id: 'srv-3', name: 'Random Forest Model', status: 'Operational', description: 'Classification model available for inference.', responseTime: 'N/A' },
  { id: 'srv-4', name: 'Isolation Forest Model', status: 'Operational', description: 'Anomaly detection model available for inference.', responseTime: 'N/A' },
  { id: 'srv-5', name: 'API Backend', status: 'Operational', description: 'Backend API responding normally.', responseTime: '42 ms' },
  { id: 'srv-6', name: 'WebSocket Alerts', status: 'Operational', description: 'Real-time alert stream available.', responseTime: 'Connected' },
  { id: 'srv-7', name: 'History Service', status: 'Degraded', description: 'Historical detection and network events available. Elevated response time.', responseTime: '315 ms' }
];

export const recentSystemEvents = [
  { id: 1, text: "History service response time degraded", time: "6:28 PM", type: "warning" },
  { id: 2, text: "ML Detection Engine started", time: "6:38 PM", type: "info" },
  { id: 3, text: "Model information refreshed", time: "6:35 PM", type: "info" },
  { id: 4, text: "WebSocket connection established", time: "6:32 PM", type: "success" },
  { id: 5, text: "System daily boot initialized", time: "1:00 AM", type: "info" }
];
