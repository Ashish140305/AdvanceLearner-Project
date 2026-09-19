import { useState, useMemo } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  BarChart3, 
  RefreshCw, 
  Download,
  Search,
  Server,
  X,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Database
} from 'lucide-react';
import { logSummaryStats, mockLogs } from '../data/mockLogsData';

const Logs = () => {
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for Drawer Details
  const [selectedLog, setSelectedLog] = useState(null);

  const handleClearFilters = () => {
    setSearchTerm('');
    setEventTypeFilter('All');
    setSeverityFilter('All');
    setStatusFilter('All');
    setTimeFilter('All');
    setCurrentPage(1);
  };

  const handleExport = () => {
    // Generate simple CSV logic for the filtered set
    if (filteredLogs.length === 0) return;
    const headers = ["Timestamp", "Event Type", "Source IP", "Destination IP", "Protocol", "Severity", "Detection", "Status"];
    const rows = filteredLogs.map(log => 
      [log.timestamp, log.eventType, log.sourceIp, `${log.destinationIp}:${log.destinationPort}`, log.protocol, log.severity, log.detectionType, log.status]
    );
    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `network_logs_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.sourceIp.includes(searchTerm) || 
        log.destinationIp.includes(searchTerm) || 
        log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detectionType.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesEventType = eventTypeFilter === 'All' || log.eventType === eventTypeFilter;
      const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      // Time filter is mock-only (all data matches natively)
      
      return matchesSearch && matchesEventType && matchesSeverity && matchesStatus;
    });
  }, [searchTerm, eventTypeFilter, severityFilter, statusFilter, timeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const currentRecords = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSeverityColor = (severity) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'rose';
      case 'HIGH': return 'amber';
      case 'MEDIUM': return 'blue';
      case 'LOW': return 'slate';
      default: return 'slate';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'BLOCKED': return 'rose';
      case 'INVESTIGATING': return 'amber';
      case 'ALLOWED': return 'emerald';
      case 'RESOLVED': return 'slate';
      default: return 'slate';
    }
  };

  const getDetectionTypeColor = (type) => {
    switch (type.toUpperCase()) {
      case 'CORRELATED_INTRUSION': return 'rose';
      case 'ATTACK': return 'rose';
      case 'DEVICE_BREACH': return 'rose';
      case 'BENIGN_BATCH': return 'teal';
      case 'BENIGN': return 'emerald';
      default: return 'slate';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type.toUpperCase()) {
      case 'NETWORK': return <Activity size={16} className="text-blue-500" />;
      case 'SECURITY': return <ShieldAlert size={16} className="text-amber-500" />;
      case 'ML DETECTION': return <Cpu size={16} className="text-teal-500" />;
      case 'SYSTEM': return <Server size={16} className="text-slate-500" />;
      default: return <BarChart3 size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Network Logs</h1>
          <p className="text-slate-500 font-medium mt-1">Review historical network activity and security events.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white" onClick={handleExport}>
            <Download size={18} />
            <span className="hidden sm:inline">Export Logs</span>
          </Button>
        </div>
      </div>

      {/* Log Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Events" value={logSummaryStats.totalEvents} trend="Historical archive" isPositive={true} icon={Database} iconBg="bg-slate-800" />
        <StatCard title="Security Alerts" value={logSummaryStats.securityAlerts} trend="Rule-matched alerts" isPositive={false} icon={ShieldAlert} iconBg="bg-amber-500" />
        <StatCard title="Anomalous Events" value={logSummaryStats.anomalousEvents} trend="ML-detected warnings" isPositive={false} icon={Cpu} iconBg="bg-rose-500" />
        <StatCard title="Blocked Events" value={logSummaryStats.blockedEvents} trend="System mitigated" isPositive={true} icon={Activity} iconBg="bg-teal-500" />
      </div>

      {/* Filters & Log Table */}
      <Card>
        
        {/* Filters Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by IP address, event or detection type..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-600 focus:outline-none"
              value={eventTypeFilter}
              onChange={(e) => { setEventTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">Event Type: All</option>
              <option value="Network">Network</option>
              <option value="Security">Security</option>
              <option value="ML Detection">ML Detection</option>
              <option value="System">System</option>
            </select>
            
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-600 focus:outline-none"
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">Severity: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-600 focus:outline-none"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">Status: All</option>
              <option value="Allowed">Allowed</option>
              <option value="Blocked">Blocked</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
            
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-600 focus:outline-none"
              value={timeFilter}
              onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">Time: All</option>
              <option value="Last 15 minutes">Last 15 minutes</option>
              <option value="Last hour">Last hour</option>
              <option value="Today">Today</option>
            </select>

            <button 
              onClick={handleClearFilters}
              className="p-2 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Clear Filters"
            >
              <FilterX size={18} />
            </button>
          </div>
        </div>

        {/* Table wrapper block */}
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-bold text-slate-800">Event Logs</h2>
           <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historical Audit</span>
        </div>
        
        {/* Responsive horizontal scroll table wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-bold px-3">Timestamp</th>
                <th className="pb-3 font-bold px-3">Event Type</th>
                <th className="pb-3 font-bold px-3">Source IP</th>
                <th className="pb-3 font-bold px-3">Destination</th>
                <th className="pb-3 font-bold px-3 text-center">Protocol</th>
                <th className="pb-3 font-bold px-3 text-center">Severity</th>
                <th className="pb-3 font-bold px-3">Detection</th>
                <th className="pb-3 font-bold px-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {currentRecords.length > 0 ? currentRecords.map((log) => (
                <tr 
                  key={log.id} 
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="py-4 px-3 font-medium text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       {getEventTypeIcon(log.eventType)}
                       <span className="font-bold text-slate-700 text-xs">{log.eventType}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono text-slate-700 font-bold whitespace-nowrap">{log.sourceIp}</td>
                  <td className="py-4 px-3 font-mono text-slate-500 font-medium whitespace-nowrap">{log.destinationIp}:{log.destinationPort}</td>
                  <td className="py-4 px-3 text-center font-bold text-slate-400 whitespace-nowrap">{log.protocol}</td>
                  <td className="py-4 px-3 text-center whitespace-nowrap"><Badge color={getSeverityColor(log.severity)}>{log.severity}</Badge></td>
                  <td className="py-4 px-3 whitespace-nowrap"><Badge color={getDetectionTypeColor(log.detectionType)}>{log.detectionType}</Badge></td>
                  <td className="py-4 px-3 whitespace-nowrap"><Badge color={getStatusColor(log.status)}>{log.status}</Badge></td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">No log events found matching current criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-500">
               Showing {Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)}–{Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} events
            </span>
            <select 
              className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-600 focus:outline-none"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="px-2 py-1" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-bold text-slate-700 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
               {currentPage} / {Math.max(1, totalPages)}
            </span>
            <Button variant="outline" className="px-2 py-1" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

      </Card>

      {/* Detail Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Event Details</h2>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-lg shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Top Context block */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    {getEventTypeIcon(selectedLog.eventType)}
                    <span className="text-sm font-bold text-slate-800">{selectedLog.eventType}</span>
                  </div>
                  <Badge color={getStatusColor(selectedLog.status)}>{selectedLog.status}</Badge>
                </div>
                
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Network Vector</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Source IP</span>
                    <span className="font-mono text-sm font-bold text-slate-800 select-all">{selectedLog.sourceIp}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Destination</span>
                    <span className="font-mono text-sm font-bold text-slate-800 select-all">{selectedLog.destinationIp}</span>
                  </div>
                   <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Port</span>
                    <span className="font-mono text-sm font-bold text-slate-700">{selectedLog.destinationPort}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Protocol</span>
                    <span className="text-sm font-bold text-slate-800">{selectedLog.protocol}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Timestamp</span>
                    <span className="text-sm font-bold text-slate-800">{selectedLog.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Tags */}
              <div className="flex flex-col sm:flex-row gap-3">
                 <div className="flex-1 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Severity</span>
                   <div className="mx-auto"><Badge color={getSeverityColor(selectedLog.severity)}>{selectedLog.severity}</Badge></div>
                 </div>
                 <div className="flex-1 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detection Classification</span>
                   <div className="mx-auto"><Badge color={getDetectionTypeColor(selectedLog.detectionType)}>{selectedLog.detectionType}</Badge></div>
                 </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {selectedLog.description}
                  </p>
                </div>
              </div>

              {/* Conditional ML Section */}
              {selectedLog.eventType === 'ML Detection' && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex gap-2 items-center">
                     <Cpu size={14} className="text-teal-500" />
                     Machine Learning Engine Output
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-teal-600 uppercase mb-1">RF Score</span>
                        <span className="text-lg font-black text-teal-700">{selectedLog.rfScore}</span>
                     </div>
                     <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">IF Score</span>
                        <span className="text-lg font-black text-slate-700">{selectedLog.ifScore}</span>
                     </div>
                     <div className="flex flex-col p-3 bg-white border shadow-sm border-slate-100 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Anomaly Level</span>
                        <span className="text-xs font-bold text-slate-700">{selectedLog.anomalyLevel}</span>
                     </div>
                     <div className="flex flex-col p-3 bg-white border shadow-sm border-slate-100 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Risk Level</span>
                        <span className="text-xs font-bold text-slate-700 uppercase">{selectedLog.riskLevel}</span>
                     </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
