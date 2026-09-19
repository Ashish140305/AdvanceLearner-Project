export const mockThreats = [
  {
    id: 'THR-1042',
    threatType: 'Port Scanning',
    sourceIP: '192.168.1.18',
    destination: '192.168.1.1',
    severity: 'High',
    status: 'Active',
    detectionTime: '2 mins ago',
    protocol: 'TCP',
    port: 'Multiple',
    description: 'System detected rapid sequential port connection attempts indicating a possible network discovery scan.',
    confidence: '96%',
    anomalyScore: '0.89',
    evidence: 'Observed 200+ connection requests across sequential ports within 5 seconds, deviating severely from device baseline.',
    recommendedAction: 'Block source IP temporarily and investigate the host for unauthorized tools.'
  },
  {
    id: 'THR-1043',
    threatType: 'Unusual Network Traffic',
    sourceIP: '192.168.1.24',
    destination: '192.168.1.10',
    severity: 'Medium',
    status: 'Investigating',
    detectionTime: '15 mins ago',
    protocol: 'UDP',
    port: '53',
    description: 'Abnormal volume of DNS requests originating from a standard workstation.',
    confidence: '82%',
    anomalyScore: '0.74',
    evidence: 'DNS lookup volume exceeded normal operational baseline by 400% over a 10-minute window.',
    recommendedAction: 'Verify if the device is misconfigured or running a script.'
  },
  {
    id: 'THR-1044',
    threatType: 'Brute Force Attempt',
    sourceIP: '192.168.1.31',
    destination: '192.168.1.5',
    severity: 'Critical',
    status: 'Blocked',
    detectionTime: '45 mins ago',
    protocol: 'TCP',
    port: '22',
    description: 'Multiple failed SSH login attempts detected from internal IoT segment to an administration server.',
    confidence: '99%',
    anomalyScore: '0.98',
    evidence: '50 failed login attempts within 2 minutes using common administrative usernames.',
    recommendedAction: 'Keep block active, rotate server SSH keys, and isolate IoT device.'
  },
  {
    id: 'THR-1045',
    threatType: 'Suspicious Connection',
    sourceIP: '192.168.1.12',
    destination: '192.168.1.20',
    severity: 'Medium',
    status: 'Active',
    detectionTime: '1 hr ago',
    protocol: 'TCP',
    port: '445',
    description: 'Unexpected SMB connection attempt between two client workstations.',
    confidence: '78%',
    anomalyScore: '0.65',
    evidence: 'Lateral movement attempt detected on SMB port from a device that historically only connects to standard gateways.',
    recommendedAction: 'Verify user intent. Restrict workstation-to-workstation SMB traffic if not required.'
  },
  {
    id: 'THR-1046',
    threatType: 'Possible Data Exfiltration',
    sourceIP: '192.168.1.27',
    destination: 'External Network',
    severity: 'Critical',
    status: 'Investigating',
    detectionTime: '2 hrs ago',
    protocol: 'HTTPS',
    port: '443',
    description: 'Large outbound data transfer to an unknown external IP address not associated with corporate services.',
    confidence: '91%',
    anomalyScore: '0.94',
    evidence: 'Transferred 4.2 GB of outbound data in 15 minutes, historically unprecedented for this device.',
    recommendedAction: 'Immediately terminate connection and inspect data transfer logs.'
  },
  {
    id: 'THR-1047',
    threatType: 'Malware Signature Match',
    sourceIP: '192.168.1.19',
    destination: 'Internal Network',
    severity: 'High',
    status: 'Resolved',
    detectionTime: '5 hrs ago',
    protocol: 'HTTP',
    port: '80',
    description: 'Network traffic payload matched a known malware signature.',
    confidence: '100%',
    anomalyScore: '1.0',
    evidence: 'Signature match: Win32/TrojanDownloader. Device isolated immediately.',
    recommendedAction: 'Re-image the affected workstation.'
  }
];

export const getThreatStats = (threats) => {
  return {
    active: threats.filter(t => t.status === 'Active').length,
    critical: threats.filter(t => t.severity === 'Critical' && t.status !== 'Resolved').length,
    warnings: threats.filter(t => (t.severity === 'High' || t.severity === 'Medium') && t.status !== 'Resolved').length,
    resolved: threats.filter(t => t.status === 'Resolved').length
  };
};
