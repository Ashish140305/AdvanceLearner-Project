export const Badge = ({ children, color = 'slate', className = '' }) => {
  const colorStyles = {
    teal: 'bg-teal-50 text-teal-700',
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-700',
    navy: 'bg-slate-800 text-white',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colorStyles[color]} ${className}`}>
      {children}
    </span>
  );
};
