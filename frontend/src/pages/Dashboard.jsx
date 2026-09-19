import { StatCard } from '../components/dashboard/StatCard';
import { NetworkTrafficChart } from '../components/dashboard/NetworkTrafficChart';
import { ThreatDistribution } from '../components/dashboard/ThreatDistribution';
import { RecentSecurityAlerts } from '../components/dashboard/RecentSecurityAlerts';
import { SystemStatusCard } from '../components/dashboard/SystemStatusCard';
import { MLDetectionCard } from '../components/dashboard/MLDetectionCard';
import { kpiData } from '../data/mockData';
import { Monitor, Activity, ShieldAlert, ShieldCheck } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Row: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Devices" 
          value={kpiData.activeDevices.value} 
          trend={kpiData.activeDevices.trend} 
          isPositive={kpiData.activeDevices.isPositive} 
          icon={Monitor} 
          iconBg="bg-teal-400" 
        />
        <StatCard 
          title="Network Traffic" 
          value={kpiData.networkTraffic.value} 
          trend={kpiData.networkTraffic.trend} 
          isPositive={kpiData.networkTraffic.isPositive} 
          icon={Activity} 
          iconBg="bg-slate-800" 
        />
        <StatCard 
          title="Active Threats" 
          value={kpiData.activeThreats.value} 
          trend={kpiData.activeThreats.trend} 
          isPositive={kpiData.activeThreats.isPositive} 
          icon={ShieldAlert} 
          iconBg="bg-rose-500" 
        />
        <StatCard 
          title="Threats Blocked" 
          value={kpiData.threatsBlocked.value} 
          trend={kpiData.threatsBlocked.trend} 
          isPositive={kpiData.threatsBlocked.isPositive} 
          icon={ShieldCheck} 
          iconBg="bg-emerald-500" 
        />
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkTrafficChart />
        </div>
        <div className="lg:col-span-1">
          <ThreatDistribution />
        </div>
      </div>

      {/* Bottom Row: Logs and ML Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentSecurityAlerts />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <SystemStatusCard />
          <MLDetectionCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
