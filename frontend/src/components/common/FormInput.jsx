export const FormInput = ({ label, id, type = 'text', placeholder, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
        {...props}
      />
    </div>
  );
};
