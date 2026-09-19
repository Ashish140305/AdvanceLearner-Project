import { useState, useMemo } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { Cpu, Activity, ShieldAlert, BarChart3, RefreshCw, X, ArrowRight, Server, Database } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { 
  modelOverview, 
  modelInfo, 
  detectionSummary, 
  mlEngineStatus, 
  generateChartData, 
  recentPredictions 
} from '../data/mockMLData';

const MLAnalysis = () => {
  const [predictions] = useState(recentPredictions);
  const [charts, setCharts] = useState(generateChartData());
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate updating mock data
    setTimeout(() => {
      setCharts(generateChartData());
      setLastUpdated(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 800);
  };

  const getRiskColor = (risk) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL': return 'rose';
      case 'HIGH': return 'amber';
      case 'ANOMALY': return 'amber';
      case 'NORMAL': 
      case 'BENIGN': return 'emerald';
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">ML Analysis</h1>
            <Badge color="teal" className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>ML Engine Active</Badge>
            <Badge color="slate">Simulation Mode</Badge>
          </div>
          <p className="text-slate-500 font-medium mt-1">Analyze machine learning predictions and network anomalies.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Last updated: {lastUpdated}</span>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh}>
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin-fast' : ''} />
            <span className="hidden sm:inline">Refresh Models</span>
          </Button>
        </div>
      </div>

      {/* Model Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Model" value={<span className="text-sm leading-snug block">Random Forest +<br/>Isolation Forest</span>} trend="Hybrid detection engine" isPositive={true} icon={Cpu} iconBg="bg-blue-500" />
        <StatCard title="Flows Processed" value={modelOverview.flowsProcessed} trend="Network flows analyzed" isPositive={true} icon={Activity} iconBg="bg-teal-400" />
        <StatCard title="Attacks Detected" value={modelOverview.attacksDetected} trend="Detected network threats" isPositive={false} icon={ShieldAlert} iconBg="bg-rose-500" />
        <StatCard title="Detection Status" value={modelOverview.status} trend="ML inference engine" isPositive={true} icon={BarChart3} iconBg="bg-slate-800" />
      </div>

      {/* Grid: Model Info & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Model Information */}
        <Card>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Model Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <span className="text-sm font-semibold text-slate-500">Dataset</span>
              <span className="text-sm font-bold text-slate-800">{modelInfo.dataset}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <span className="text-sm font-semibold text-slate-500">Features Extracted</span>
              <span className="text-sm font-bold text-slate-800">{modelInfo.featureCount}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <span className="text-sm font-semibold text-slate-500">Model Version</span>
              <span className="text-sm font-bold text-slate-800">{modelInfo.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500">Type</span>
              <span className="text-xs font-bold text-slate-800 text-right w-1/2">{modelInfo.detectionType}</span>
            </div>
          </div>
        </Card>

        {/* Detection Summary */}
        <Card>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Detection Summary</h2>
          <p className="text-xs font-semibold text-slate-500 mb-4">MOCK DATA</p>
          <div className="grid grid-cols-2 gap-3 pb-1">
            <div className="bg-rose-50 p-4 flex flex-col justify-center rounded-xl">
              <span className="text-3xl font-bold text-rose-600 mb-1">{detectionSummary.highRisk + detectionSummary.critical}</span>
              <span className="text-[10px] uppercase font-bold text-rose-500">High/Critical Risk</span>
            </div>
            <div className="bg-emerald-50 p-4 flex flex-col justify-center rounded-xl">
              <span className="text-3xl font-bold text-emerald-600 mb-1">{detectionSummary.benign}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-500">Benign Traffic</span>
            </div>
            <div className="bg-amber-50 p-4 flex flex-col justify-center rounded-xl w-full col-span-2">
              <div className="flex justify-between items-center">
                 <span className="text-2xl font-bold text-amber-600">{detectionSummary.anomalies}</span>
                 <span className="text-xs font-bold text-amber-500 uppercase">Anomalies</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RF Score Chart */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">Random Forest Analysis</h2>
            <p className="text-sm font-semibold text-slate-500">Classification score generated by the Random Forest model.</p>
          </div>
          <div className="h-[250px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 1]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="rfScore" name="RF Score" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorRf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* IF Score Chart */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">Isolation Forest Analysis</h2>
            <p className="text-sm font-semibold text-slate-500">Anomaly scores generated from network behavior.</p>
          </div>
          <div className="h-[250px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 1]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <ReferenceLine y={0.7} label={{ position: 'top', value: 'Anomaly Threshold (0.7)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ifScore" name="IF Score" stroke="#1e293b" strokeWidth={3} dot={{r: 3, fill: '#1e293b', strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Signal Comparison */}
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">Detection Signal Comparison</h2>
            <p className="text-sm font-semibold text-slate-500">Comparison of classification and anomaly signals over time.</p>
          </div>
          <div className="h-[300px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 1]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="rfScore" name="Random Forest Classification Signal" stroke="#2dd4bf" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ifScore" name="Isolation Forest Anomaly Signal" stroke="#1e293b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Predictions Table */}
      <Card>
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recent ML Predictions</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Live inference logs evaluated by the combined logic engine</p>
          </div>
          <Badge color="amber">MOCK DATA</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-bold px-3">Timestamp</th>
                <th className="pb-3 font-bold px-3">Source IP</th>
                <th className="pb-3 font-bold px-3">Dest IP : Port</th>
                <th className="pb-3 font-bold px-3 text-center">RF Score</th>
                <th className="pb-3 font-bold px-3 text-center">IF Score</th>
                <th className="pb-3 font-bold px-3">Anom Level</th>
                <th className="pb-3 font-bold px-3">Risk Level</th>
                <th className="pb-3 font-bold px-3">Type</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {predictions.map((pred) => (
                <tr 
                  key={pred.id} 
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPrediction(pred)}
                >
                  <td className="py-4 px-3 font-medium text-slate-500">{pred.timestamp}</td>
                  <td className="py-4 px-3 font-mono text-slate-700 font-bold">{pred.srcIp}</td>
                  <td className="py-4 px-3 font-mono text-slate-500 font-medium">{pred.dstIp} : {pred.dstPort}</td>
                  <td className="py-4 px-3 text-center font-bold text-teal-600">{pred.rfScore}</td>
                  <td className="py-4 px-3 text-center font-bold text-slate-700">{pred.ifScore}</td>
                  <td className="py-4 px-3"><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{pred.anomalyLevel}</span></td>
                  <td className="py-4 px-3"><Badge color={getRiskColor(pred.riskLevel)}>{pred.riskLevel}</Badge></td>
                  <td className="py-4 px-3"><Badge color={getDetectionTypeColor(pred.detectionType)}>{pred.detectionType}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ML Engine Status small card footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-center">
         <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</span>
            <span className="text-sm font-bold text-slate-700">{mlEngineStatus.status}</span>
         </div>
         <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Inference Engine</span>
            <span className="text-sm font-bold text-slate-700">{mlEngineStatus.inference}</span>
         </div>
         <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">API Endpoint</span>
            <span className="text-sm font-bold text-slate-700">{mlEngineStatus.api}</span>
         </div>
         <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">WebSocket Server</span>
            <span className="text-sm font-bold text-slate-700">{mlEngineStatus.websocket}</span>
         </div>
      </div>

      {/* Detail Drawer Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-sm" onClick={() => setSelectedPrediction(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Prediction Logic Details</h2>
              <button onClick={() => setSelectedPrediction(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-lg shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detection Details</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Source IP</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{selectedPrediction.srcIp}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Destination</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{selectedPrediction.dstIp} : {selectedPrediction.dstPort}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Timestamp</span>
                    <span className="text-sm font-bold text-slate-800">{selectedPrediction.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Random Forest</h4>
                    <div className="flex flex-col p-4 bg-teal-50 border border-teal-100 rounded-xl">
                       <span className="text-[10px] font-bold text-teal-600 uppercase mb-1">RF Score</span>
                       <span className="text-3xl font-black text-teal-700 tracking-tight">{selectedPrediction.rfScore}</span>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Isolation Forest</h4>
                    <div className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex justify-between items-end mb-1">
                         <span className="text-[10px] font-bold text-slate-600 uppercase">IF Score</span>
                         <span className="text-[10px] font-bold text-slate-500">{selectedPrediction.anomalyLevel}</span>
                       </div>
                       <span className="text-3xl font-black text-slate-800 tracking-tight">{selectedPrediction.ifScore}</span>
                    </div>
                 </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Risk Assessment</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                   <div className="flex-1 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Risk Level</span>
                     <div className="mx-auto"><Badge color={getRiskColor(selectedPrediction.riskLevel)}>{selectedPrediction.riskLevel}</Badge></div>
                   </div>
                   <div className="flex-1 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detection Classification</span>
                     <div className="mx-auto"><Badge color={getDetectionTypeColor(selectedPrediction.detectionType)}>{selectedPrediction.detectionType}</Badge></div>
                   </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Logic Explanation</h4>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800 leading-relaxed shadow-sm">
                    {Number(selectedPrediction.rfScore) > 0.5 
                      ? "Network activity produced an elevated Random Forest classification score alongside relative Isolation Forest readings. Combined logic classified the activity as malicious."
                      : "Random Forest classification score remained low. Isolation Forest anomaly scores were independently factored by backend logic to determine benign mapping."}
                  </p>
                  <p className="text-[10px] uppercase font-bold mt-4 text-blue-400">Mock Implementation View</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLAnalysis;
