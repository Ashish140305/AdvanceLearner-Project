export const kpiData = {
  activeDevices: { value: '3,248', trend: '+12%', isPositive: true },
  networkTraffic: { value: '14.2 TB', trend: '+5%', isPositive: true },
  activeThreats: { value: '12', trend: '-2', isPositive: true },
  threatsBlocked: { value: '1,490', trend: '+15%', isPositive: true },
};

export const mlStatusData = {
  status: 'Active',
  anomalyScore: '0.042',
  analyzedEvents: '2.4M',
  modelStatus: 'Healthy'
};

export const trafficData = [
  { time: '00:00', inbound: 400, outbound: 240 },
  { time: '04:00', inbound: 300, outbound: 139 },
  { time: '08:00', inbound: 200, outbound: 980 },
  { time: '12:00', inbound: 238, outbound: 390 },
  { time: '16:00', inbound: 189, outbound: 480 },
  { time: '20:00', inbound: 239, outbound: 380 },
  { time: '24:00', inbound: 349, outbound: 430 },
];

export const recentAlerts = [
  { id: 1, type: 'Port Scan', source: '192.168.1.144', severity: 'Medium', action: 'Blocked', time: '2 mins ago' },
  { id: 2, type: 'Malware Signature', source: '10.0.0.52', severity: 'Critical', action: 'Quarantined', time: '15 mins ago' },
  { id: 3, type: 'Unusual Login', source: 'Admin PC', severity: 'Warning', action: 'Flagged', time: '1 hour ago' },
];

export const threatDistributionData = [
  { name: 'Normal', value: 85, color: '#4fd1c5' },
  { name: 'Suspicious', value: 8, color: '#f59e0b' },
  { name: 'Malware', value: 3, color: '#f43f5e' },
  { name: 'Port Scan', value: 2, color: '#8b5cf6' },
  { name: 'Brute Force', value: 2, color: '#1e293b' },
];

export const systemStatusData = {
  backend: 'Operational',
  mlModel: 'Healthy',
  monitoring: 'Active',
  activeNodes: 142,
  cpuUsage: '42%',
  memoryUsage: '64%'
};
