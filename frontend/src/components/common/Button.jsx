export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-teal-400 text-white hover:bg-teal-500 shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 shadow-sm',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
  };

  return (
    <button 
      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
