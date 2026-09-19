export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
};
