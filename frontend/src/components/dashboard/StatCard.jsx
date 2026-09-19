import { Card } from '../common/Card';

export const StatCard = ({ title, value, trend, isPositive, icon: Icon, iconBg = "bg-teal-400" }) => {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {trend && (
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
      {Icon && (
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg} text-white shadow-sm`}>
          <Icon size={24} />
        </div>
      )}
    </Card>
  );
};
