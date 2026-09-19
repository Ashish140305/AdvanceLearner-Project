export const ChartContainer = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 md:p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 w-full relative min-h-[250px]">
        {children}
      </div>
    </div>
  );
};
