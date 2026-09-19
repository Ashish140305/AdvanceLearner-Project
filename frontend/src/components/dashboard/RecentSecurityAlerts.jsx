import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { recentAlerts } from '../../data/mockData';

export const RecentSecurityAlerts = () => {
  return (
    <Card className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Recent Security Alerts</h3>
          <p className="text-sm text-slate-400">Latest network incidents</p>
        </div>
        <button className="text-teal-400 font-bold text-sm hover:text-teal-500 transition-colors">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
              <th className="pb-3 font-semibold">Type</th>
              <th className="pb-3 font-semibold">Source IP</th>
              <th className="pb-3 font-semibold">Severity</th>
              <th className="pb-3 font-semibold">Action</th>
              <th className="pb-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {recentAlerts.map((alert) => (
              <tr key={alert.id} className="border-b border-slate-50 last:border-0 text-sm">
                <td className="py-4 font-bold text-slate-800">{alert.type}</td>
                <td className="py-4 text-slate-500">{alert.source}</td>
                <td className="py-4">
                  <Badge color={alert.severity === 'Critical' ? 'rose' : alert.severity === 'Warning' ? 'amber' : 'emerald'}>
                    {alert.severity}
                  </Badge>
                </td>
                <td className="py-4 font-medium text-slate-700">{alert.action}</td>
                <td className="py-4 text-slate-400">{alert.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
