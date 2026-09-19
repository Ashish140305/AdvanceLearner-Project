import { Card } from '../common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trafficData } from '../../data/mockData';

export const TrafficChart = () => {
  return (
    <Card className="h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800">Network Traffic</h3>
        <p className="text-sm text-slate-400">Inbound vs Outbound data over trailing 24 hours</p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4fd1c5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4fd1c5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            />
            <Area type="monotone" dataKey="inbound" stroke="#4fd1c5" strokeWidth={3} fillOpacity={1} fill="url(#colorInbound)" />
            <Area type="monotone" dataKey="outbound" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorOutbound)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
