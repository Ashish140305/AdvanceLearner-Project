import { Card } from '../common/Card';

export const NetworkActivityFeed = ({ activities }) => {
  return (
    <Card className="h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Network Activity</h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">Recent events and alerts</p>
      </div>
      <div className="space-y-6">
        {activities.map((item) => {
          const Icon = item.icon;
          let iconBg = 'bg-slate-100 text-slate-600';
          
          if (item.severity === 'info') iconBg = 'bg-blue-50 text-blue-500';
          if (item.severity === 'warning') iconBg = 'bg-amber-50 text-amber-500';
          if (item.severity === 'danger') iconBg = 'bg-rose-50 text-rose-500';
          if (item.severity === 'success') iconBg = 'bg-emerald-50 text-emerald-500';

          return (
            <div key={item.id} className="flex gap-4">
              <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${iconBg}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{item.event}</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{item.target}</p>
                <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
