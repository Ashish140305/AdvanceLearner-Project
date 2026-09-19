import { useState, useMemo } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ShieldAlert, AlertTriangle, AlertCircle, ShieldCheck, RefreshCw, Search, X, ChevronRight } from 'lucide-react';
import { mockThreats, getThreatStats } from '../data/mockThreatData';

const Threats = () => {
  const [threats, setThreats] = useState(mockThreats);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useMemo(() => getThreatStats(threats), [threats]);

  const filteredThreats = useMemo(() => {
    return threats.filter(threat => {
      const matchesSearch = threat.threatType.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            threat.sourceIP.includes(searchQuery) ||
                            threat.destination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || threat.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || threat.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [threats, searchQuery, severityFilter, statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'rose';
      case 'High': return 'amber';
      case 'Medium': return 'teal';
      case 'Low': return 'slate';
      default: return 'slate';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Active': return 'rose';
      case 'Investigating': return 'amber';
      case 'Blocked': return 'navy';
      case 'Resolved': return 'emerald';
      default: return 'slate';
    }
  };

  const handleUpdateStatus = (id, newStatus) => {
    setThreats(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedThreat && selectedThreat.id === id) {
      setSelectedThreat({ ...selectedThreat, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Threat Detection</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor, investigate and manage detected network threats.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh}>
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin-fast' : ''} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Threats" value={stats.active} icon={ShieldAlert} iconBg="bg-rose-500" />
        <StatCard title="Critical Threats" value={stats.critical} icon={AlertTriangle} iconBg="bg-rose-500" />
        <StatCard title="Warnings" value={stats.warnings} icon={AlertCircle} iconBg="bg-amber-500" />
        <StatCard title="Resolved" value={stats.resolved} icon={ShieldCheck} iconBg="bg-emerald-500" />
      </div>

      {/* Threat List Card */}
      <Card>
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Detected Threats</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Unified view of all security events</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search threats..."
                className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 w-full sm:w-64 focus:ring-2 focus:ring-teal-400 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            </div>
            
            <select 
              className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-400 outline-none appearance-none"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-400 outline-none appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Investigating">Investigating</option>
              <option value="Blocked">Blocked</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-bold px-2">Threat</th>
                <th className="pb-3 font-bold px-2">Source IP</th>
                <th className="pb-3 font-bold px-2">Destination</th>
                <th className="pb-3 font-bold px-2">Severity</th>
                <th className="pb-3 font-bold px-2">Detection Time</th>
                <th className="pb-3 font-bold px-2">Status</th>
                <th className="pb-3 font-bold px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredThreats.length > 0 ? (
                filteredThreats.map((threat) => (
                  <tr 
                    key={threat.id} 
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedThreat(threat)}
                  >
                    <td className="py-4 px-2 font-bold text-slate-800">{threat.threatType}</td>
                    <td className="py-4 px-2 font-mono text-slate-600 font-semibold">{threat.sourceIP}</td>
                    <td className="py-4 px-2 font-mono text-slate-600 font-semibold">{threat.destination}</td>
                    <td className="py-4 px-2">
                      <Badge color={getSeverityBadgeColor(threat.severity)}>{threat.severity}</Badge>
                    </td>
                    <td className="py-4 px-2 font-medium text-slate-500">{threat.detectionTime}</td>
                    <td className="py-4 px-2">
                      <Badge color={getStatusBadgeColor(threat.status)}>{threat.status}</Badge>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg shadow-sm transition-all bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThreat(threat);
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 font-medium">No threats match your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Threat Detail Modal / Drawer */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-sm" onClick={() => setSelectedThreat(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Threat Details</h2>
              <button onClick={() => setSelectedThreat(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-lg shadow-sm">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-bold text-slate-800 leading-tight">{selectedThreat.threatType}</h3>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge color={getSeverityBadgeColor(selectedThreat.severity)}>{selectedThreat.severity} Severity</Badge>
                  <Badge color={getStatusBadgeColor(selectedThreat.status)}>{selectedThreat.status}</Badge>
                </div>
                <p className="text-slate-600 font-medium mt-4 bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100 shadow-sm">
                  {selectedThreat.description}
                </p>
              </div>

              {/* Network Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Network Information</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Source IP</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{selectedThreat.sourceIP}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Destination</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{selectedThreat.destination}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Protocol / Port</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{selectedThreat.protocol} : {selectedThreat.port}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Detection Time</span>
                    <span className="text-sm font-bold text-slate-800">{selectedThreat.detectionTime}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* ML / Detection Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ML / Detection Metrics</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Detection Method</span>
                    <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">Machine Learning Model</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Confidence</span>
                    <span className="text-xl font-black tracking-tight text-teal-600">{selectedThreat.confidence}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Anomaly Score</span>
                    <span className="text-xl font-black tracking-tight text-rose-500">{selectedThreat.anomalyScore}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Evidence */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Evidence</h4>
                <p className="text-sm font-medium text-slate-700 border-l-2 border-amber-400 pl-3 py-1">
                  {selectedThreat.evidence}
                </p>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Recommended Action */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recommended Action</h4>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedThreat.recommendedAction}
                </p>
              </div>

            </div>

            {/* Drawer Footer Controls */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-3">
              {(selectedThreat.status !== 'Resolved' && selectedThreat.status !== 'Blocked') && (
                <Button variant="secondary" onClick={() => handleUpdateStatus(selectedThreat.id, 'Blocked')}>
                  Block Source
                </Button>
              )}
              {selectedThreat.status !== 'Resolved' && (
                <Button variant="primary" onClick={() => handleUpdateStatus(selectedThreat.id, 'Resolved')}>
                  Mark as Resolved
                </Button>
              )}
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedThreat(null)}>
                Close
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Threats;
