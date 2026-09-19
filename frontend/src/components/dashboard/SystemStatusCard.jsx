import { Card } from '../common/Card';
import { systemStatusData } from '../../data/mockData';
import { Server, Cpu, HardDrive, Network, CheckCircle2 } from 'lucide-react';

export const SystemStatusCard = () => {
  return (
    <Card className="h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800">System Status</h3>
        <p className="text-sm text-slate-400">Core infrastructure health</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Server size={18} /></div>
            <span className="font-semibold text-slate-700 text-sm">Backend API</span>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
            <CheckCircle2 size={16} />
            {systemStatusData.backend}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><Network size={18} /></div>
            <span className="font-semibold text-slate-700 text-sm">Monitoring Core</span>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
            <CheckCircle2 size={16} />
            {systemStatusData.monitoring}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
            <Cpu size={20} className="mx-auto text-slate-400 mb-1" />
            <p className="text-xs text-slate-400 font-bold uppercase">CPU</p>
            <p className="text-lg font-black text-slate-800">{systemStatusData.cpuUsage}</p>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
            <HardDrive size={20} className="mx-auto text-slate-400 mb-1" />
            <p className="text-xs text-slate-400 font-bold uppercase">Memory</p>
            <p className="text-lg font-black text-slate-800">{systemStatusData.memoryUsage}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
