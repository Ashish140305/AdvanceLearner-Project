import { useState, useEffect } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { LiveNetworkTrafficChart } from '../components/monitor/LiveNetworkTrafficChart';
import { ConnectedDevicesTable } from '../components/monitor/ConnectedDevicesTable';
import { NetworkActivityFeed } from '../components/monitor/NetworkActivityFeed';
import { Button } from '../components/common/Button';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { 
  liveMonitorStats, 
  connectedDevices, 
  networkActivity, 
  liveTrafficChartData 
} from '../data/mockMonitorData';
import { Monitor, Activity, ShieldAlert, Cpu } from 'lucide-react'; // Using icons for stats

const LiveMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [chartData, setChartData] = useState(liveTrafficChartData);

  // Simulated live data effect
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newData = [...prevData.slice(1)];
        // Generate mock next point
        const lastTime = prevData[prevData.length - 1].time;
        // Simple time increment by 10s simulation
        const [h, m, s] = lastTime.split(':').map(Number);
        let date = new Date();
        date.setHours(h, m, s + 10);
        const nextTime = date.toTimeString().split(' ')[0];

        newData.push({
          time: nextTime,
          incoming: Number((Math.random() * 3 + 2).toFixed(1)),
          outgoing: Number((Math.random() * 2 + 1).toFixed(1)),
        });
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Live Network Monitor</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isMonitoring ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </div>
          </div>
          <p className="text-slate-500 font-medium mt-1">Real-time visibility into devices, connections and network traffic.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => {
            // refresh simulates a state bump
            if(!isMonitoring) {
              setChartData([...liveTrafficChartData]);
            }
          }}>
            <RefreshCw size={18} className={isMonitoring ? 'animate-spin-slow' : ''} style={{ animationDuration: '3s' }} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          <Button 
            variant={isMonitoring ? "secondary" : "primary"} 
            className="flex items-center gap-2 transition-all" 
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? <Pause size={18} /> : <Play size={18} />}
            {isMonitoring ? 'Pause Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Network Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Devices" 
          value={liveMonitorStats.activeDevices.value} 
          trend={liveMonitorStats.activeDevices.trend} 
          isPositive={liveMonitorStats.activeDevices.isPositive} 
          icon={Monitor} 
          iconBg="bg-teal-400" 
        />
        <StatCard 
          title="Active Connections" 
          value={liveMonitorStats.activeConnections.value} 
          trend={liveMonitorStats.activeConnections.trend} 
          isPositive={liveMonitorStats.activeConnections.isPositive} 
          icon={Activity} 
          iconBg="bg-blue-500" 
        />
        <StatCard 
          title="Incoming Traffic" 
          value={liveMonitorStats.incomingTraffic.value} 
          trend={liveMonitorStats.incomingTraffic.trend} 
          isPositive={liveMonitorStats.incomingTraffic.isPositive} 
          icon={ShieldAlert} 
          iconBg="bg-slate-800" 
        />
        <StatCard 
          title="Outgoing Traffic" 
          value={liveMonitorStats.outgoingTraffic.value} 
          trend={liveMonitorStats.outgoingTraffic.trend} 
          isPositive={liveMonitorStats.outgoingTraffic.isPositive} 
          icon={Cpu} 
          iconBg="bg-slate-600" 
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 gap-6">
        <LiveNetworkTrafficChart data={chartData} isLive={isMonitoring} />
      </div>

      {/* Tables and Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <ConnectedDevicesTable devices={connectedDevices} />
        </div>
        <div className="lg:col-span-1">
          <NetworkActivityFeed activities={networkActivity} />
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
