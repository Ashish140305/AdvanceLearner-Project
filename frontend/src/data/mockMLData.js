export const modelOverview = {
  modelType: "Random Forest + Isolation Forest",
  flowsProcessed: "12,486",
  attacksDetected: "37",
  status: "Active"
};

export const modelInfo = {
  dataset: "CICIDS2017",
  models: "Random Forest\nIsolation Forest",
  detectionType: "Hybrid Classification + Anomaly Detection",
  featureCount: "63",
  status: "Active",
  version: "v1.0.0",
  lastUpdated: new Date().toISOString()
};

export const detectionSummary = {
  threatsDetected: 37,
  highRisk: 12,
  critical: 5,
  benign: 8421,
  anomalies: 84
};

export const mlEngineStatus = {
  status: "Active",
  model: "Random Forest + Isolation Forest",
  dataset: "CICIDS2017",
  inference: "Ready",
  api: "Not Connected (Simulation Mode)",
  websocket: "Not Connected"
};

// Generate somewhat realistic mock time-series data for RF and IF scores
export const generateChartData = () => {
  const data = [];
  let rfBase = 0.1;
  let ifBase = 0.15;
  const now = new Date();
  
  for (let i = 10; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    // Add some random noise and occasional spikes to simulate network evaluation
    const isSpike = Math.random() > 0.8;
    
    let rfScore = isSpike ? rfBase + (Math.random() * 0.6) : rfBase + (Math.random() * 0.1);
    let ifScore = isSpike ? ifBase + (Math.random() * 0.7) : ifBase + (Math.random() * 0.15);
    
    data.push({
      time: time.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
      rfScore: Math.min(1.0, Math.max(0, rfScore)).toFixed(2),
      ifScore: Math.min(1.0, Math.max(0, ifScore)).toFixed(2),
    });
  }
  return data;
};

export const chartData = generateChartData();

export const recentPredictions = [
  {
    id: "PRED-100",
    srcIp: "192.168.1.18",
    dstIp: "192.168.1.1",
    dstPort: "80",
    rfScore: "0.82",
    ifScore: "0.76",
    anomalyLevel: "High",
    riskLevel: "HIGH",
    detectionType: "CORRELATED_INTRUSION",
    timestamp: "14:32:18"
  },
  {
    id: "PRED-101",
    srcIp: "192.168.1.24",
    dstIp: "192.168.1.10",
    dstPort: "443",
    rfScore: "0.12",
    ifScore: "0.21",
    anomalyLevel: "Normal",
    riskLevel: "Normal",
    detectionType: "BENIGN",
    timestamp: "14:33:05"
  },
  {
    id: "PRED-102",
    srcIp: "192.168.1.31",
    dstIp: "192.168.1.5",
    dstPort: "22",
    rfScore: "0.95",
    ifScore: "0.88",
    anomalyLevel: "Critical",
    riskLevel: "CRITICAL",
    detectionType: "ATTACK",
    timestamp: "14:34:12"
  },
  {
    id: "PRED-103",
    srcIp: "192.168.1.15",
    dstIp: "192.168.1.50",
    dstPort: "21",
    rfScore: "0.08",
    ifScore: "0.65",
    anomalyLevel: "Medium",
    riskLevel: "Anomaly",
    detectionType: "BENIGN_BATCH",
    timestamp: "14:35:40"
  },
  {
    id: "PRED-104",
    srcIp: "192.168.1.19",
    dstIp: "10.0.0.8",
    dstPort: "445",
    rfScore: "0.78",
    ifScore: "0.82",
    anomalyLevel: "High",
    riskLevel: "HIGH",
    detectionType: "DEVICE_BREACH",
    timestamp: "14:38:22"
  }
];
