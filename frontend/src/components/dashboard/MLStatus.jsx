import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { mlStatusData } from '../../data/mockData';
import { Activity, ShieldCheck, Database, Zap } from 'lucide-react';

export const MLStatus = () => {
  return (
    <Card className="h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-800">ML Detection Engine</h3>
          <p className="text-sm text-slate-400">Real-time AI threat analysis</p>
        </div>
        <Badge color="emerald">Online</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <Zap size={16} className="text-teal-400"/>
            <span className="text-xs uppercase tracking-wider font-bold">Prediction</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{mlStatusData.status}</p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <Activity size={16} className="text-amber-500"/>
            <span className="text-xs uppercase tracking-wider font-bold">Anomaly Src</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{mlStatusData.anomalyScore}</p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <Database size={16} className="text-blue-500"/>
            <span className="text-xs uppercase tracking-wider font-bold">Analyzed</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{mlStatusData.analyzedEvents}</p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <ShieldCheck size={16} className="text-emerald-500"/>
            <span className="text-xs uppercase tracking-wider font-bold">Health</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{mlStatusData.modelStatus}</p>
        </div>
      </div>
    </Card>
  );
};
