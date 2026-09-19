import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { 
  Activity, 
  CheckCircle2, 
  ServerCrash, 
  RefreshCw, 
  AlertTriangle,
  Server,
  Cpu,
  Clock,
  Database,
  Globe,
  Wifi,
  X,
  Code
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  overallStatus, 
  services, 
  systemMetrics, 
  modelStatus, 
  apiHealth, 
  responseTimeData, 
  recentSystemEvents 
} from '../data/mockSystemStatusData';

const SystemStatus = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [localCheckTime, setLocalCheckTime] = useState(overallStatus.lastChecked);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLocalCheckTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    }, 800);
  };

  const getStatusColor = (status) => {
    if (!status) return 'slate';
    switch (status.toUpperCase()) {
      case 'OPERATIONAL': return 'emerald';
      case 'READY': return 'emerald';
      case 'CONNECTED': return 'emerald';
      case 'WARNING': return 'amber';
      case 'DEGRADED': return 'amber';
      case 'OFFLINE': return 'rose';
      default: return 'slate';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'danger': return <ServerCrash size={16} className="text-rose-500" />;
      default: return <Activity size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h1 className="text-2xl font-bold text-slate-800">System Status</h1>
             <Badge color="slate" className="bg-slate-100 text-slate-500 border-none font-bold uppercase tracking-wider text-[10px]">Simulation Mode</Badge>
          </div>
          <p className="text-slate-500 font-medium mt-1">Monitor the health and availability of the security monitoring system.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-xs font-semibold text-slate-400">Last checked: {localCheckTime}</span>
          <Button 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto justify-center" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh Status"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col - Broad State */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Overall System Health */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 min-w-16 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-sm">
               <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div className="flex-1">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                 <h2 className="text-xl font-bold text-emerald-900">All Core Systems Operational</h2>
                 <Badge color="emerald" className="self-center sm:self-auto bg-emerald-100">{overallStatus.operationalCount} / {overallStatus.totalCount} operational</Badge>
               </div>
               <p className="text-emerald-700/80 font-medium">
                 {overallStatus.message}
               </p>
            </div>
          </div>

          {/* Service Status List */}
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-slate-800">Service Status</h2>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Infrastructure</span>
            </div>
            
            <div className="space-y-3">
              {services.map((service) => (
                <div 
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                       service.status === 'Operational' ? 'bg-emerald-100 text-emerald-600' :
                       service.status === 'Degraded' ? 'bg-amber-100 text-amber-600' :
                       'bg-rose-100 text-rose-600'
                    }`}>
                      {service.status === 'Operational' ? <Server size={18} /> : 
                       service.status === 'Degraded' ? <AlertTriangle size={18} /> : 
                       <ServerCrash size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{service.name}</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5 justify-between">
                     <Badge color={getStatusColor(service.status)}>{service.status}</Badge>
                     {service.responseTime && service.responseTime !== 'N/A' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {service.responseTime}
                        </span>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Right Col - Side metadata */}
        <div className="space-y-6">

          {/* System Metrics */}
          <Card>
            <div className="flex items-center gap-2 mb-4 text-slate-800">
               <Activity size={18} className="text-teal-500" />
               <h2 className="text-lg font-bold">System Metrics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CPU Usage</span>
                  <span className="text-lg font-black text-slate-700">{systemMetrics.cpuUsage}</span>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Memory Usage</span>
                  <span className="text-lg font-black text-slate-700">{systemMetrics.memoryUsage}</span>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Network T/P</span>
                  <span className="text-sm pt-0.5 block font-black text-slate-700">{systemMetrics.networkThroughput}</span>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Conns</span>
                  <span className="text-lg font-black text-slate-700">{systemMetrics.activeConnections}</span>
               </div>
               <div className="col-span-2 bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Clock size={14} className="text-slate-400" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uptime</span>
                  </div>
                  <span className="text-sm font-bold text-white">{systemMetrics.uptime}</span>
               </div>
            </div>
          </Card>

          {/* Model Status */}
          <Card>
            <div className="flex items-center gap-2 mb-4 text-slate-800">
               <Cpu size={18} className="text-blue-500" />
               <h2 className="text-lg font-bold">ML Model Status</h2>
            </div>
            <div className="space-y-3 font-medium text-sm">
               <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Random Forest</span>
                  <Badge color={getStatusColor(modelStatus.randomForest)}>{modelStatus.randomForest}</Badge>
               </div>
               <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Isolation Forest</span>
                  <Badge color={getStatusColor(modelStatus.isolationForest)}>{modelStatus.isolationForest}</Badge>
               </div>
               <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Dataset Map</span>
                  <span className="font-bold text-slate-700">{modelStatus.dataset}</span>
               </div>
               <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Feature Dimensions</span>
                  <span className="font-bold text-slate-700">{modelStatus.features}</span>
               </div>
               <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Model Version</span>
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{modelStatus.modelVersion}</span>
               </div>
            </div>
          </Card>

          {/* Backend Health Connectivity */}
          <Card>
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-slate-800">
                  <Globe size={18} className="text-emerald-500" />
                  <h2 className="text-lg font-bold">Backend Connectivity</h2>
               </div>
            </div>
            
            <div className="space-y-3 text-sm">
              {apiHealth.map((api, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <Code size={14} className="text-slate-400" />
                     <span className="font-mono text-slate-600">{api.endpoint}</span>
                  </div>
                  <Badge color={getStatusColor(api.status)}>{api.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
      
      {/* Bottom Full Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Response Time Area Chart */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg font-bold text-slate-800">Service Response Time</h2>
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal Latency</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTimeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAPI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '4px 0' }}
                  labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}
                />
                <Area type="monotone" dataKey="API Backend" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorAPI)" activeDot={{r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2}} />
                <Area type="monotone" dataKey="History Service" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorHistory)" activeDot={{r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Events Log */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg font-bold text-slate-800">Recent System Events</h2>
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 24 Hours</span>
          </div>
          <div className="space-y-4">
            {recentSystemEvents.map((evt) => (
               <div key={evt.id} className="flex gap-4 p-3 hover:bg-slate-50 transition-colors rounded-xl border border-transparent">
                  <div className="mt-0.5">
                     {getEventTypeIcon(evt.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{evt.text}</p>
                    <span className="text-xs font-medium text-slate-400 mt-1 block">{evt.time}</span>
                  </div>
               </div>
            ))}
          </div>
        </Card>
      </div>

       {/* Detail Drawer Modal */}
       {selectedService && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-sm" onClick={() => setSelectedService(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Node Configuration</h2>
              <button onClick={() => setSelectedService(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-lg shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Broad Context block */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <Server size={18} className="text-slate-700" />
                    <span className="text-base font-bold text-slate-800">{selectedService.name}</span>
                  </div>
                  <Badge color={getStatusColor(selectedService.status)}>{selectedService.status}</Badge>
                </div>
                
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Identity</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</span>
                    <span className="text-sm font-bold text-slate-700 break-words leading-relaxed">{selectedService.description}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Response Latency</span>
                    <span className="font-mono text-sm font-bold text-slate-800 select-all">{selectedService.responseTime}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Last Sync Hash</span>
                    <span className="text-sm font-bold text-slate-800">{localCheckTime}</span>
                  </div>
                </div>
              </div>

               {/* Simulated Binding Conditional Section (If ML vs API) */}
               {selectedService.name.includes("ML") || selectedService.name.includes("Model") ? (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex gap-2 items-center">
                       <Cpu size={14} className="text-blue-500" />
                       Machine Learning Constraints
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="col-span-2 flex justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-xs font-bold text-slate-500">Dependent Pipeline</span>
                          <span className="text-xs font-bold text-slate-800">Random Forest + Isolation Forest</span>
                       </div>
                       <div className="flex justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-xs font-bold text-slate-500">Feature Dim</span>
                          <span className="text-xs font-bold text-slate-800">{modelStatus.features}</span>
                       </div>
                       <div className="flex justify-between p-3 bg-white shadow-sm border border-slate-100 rounded-lg">
                          <span className="text-xs font-bold text-slate-500">Version</span>
                          <span className="text-xs font-bold text-slate-800">{modelStatus.modelVersion}</span>
                       </div>
                    </div>
                  </div>
               ) : (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex gap-2 items-center">
                       <Globe size={14} className="text-emerald-500" />
                       Endpoint Map Strategy
                    </h4>
                    <div className="space-y-3">
                       {apiHealth.slice(0, 3).map((api, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                               <div className="flex items-center gap-2">
                                  <Code size={14} className="text-slate-400" />
                                  <span className="text-xs font-mono font-medium text-slate-600">{api.endpoint}</span>
                               </div>
                               <Badge color={getStatusColor(api.status)}>{api.status}</Badge>
                           </div>
                       ))}
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

export default SystemStatus;
