import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { mlStatusData } from '../../data/mockData';
import { Activity, ShieldCheck, Database, Zap } from 'lucide-react';

export const MLDetectionCard = () => {
  return (
    <Card>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-800">ML Detection</h3>
          <p className="text-sm text-slate-400">Real-time AI threat analysis</p>
        </div>
        <Badge color="emerald">Active</Badge>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><Zap size={18} /></div>
            <span className="font-semibold text-slate-700 text-sm">Prediction Status</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{mlStatusData.status}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Activity size={18} /></div>
            <span className="font-semibold text-slate-700 text-sm">Anomaly Score</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{mlStatusData.anomalyScore}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
            <Database size={20} className="mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-slate-400 font-bold uppercase">Analyzed</p>
            <p className="text-lg font-black text-slate-800">{mlStatusData.analyzedEvents}</p>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
            <ShieldCheck size={20} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-xs text-slate-400 font-bold uppercase">Health</p>
            <p className="text-lg font-black text-emerald-600">{mlStatusData.modelStatus}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
