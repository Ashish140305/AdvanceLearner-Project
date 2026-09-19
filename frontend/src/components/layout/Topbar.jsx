import { Menu, Search, Bell, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Topbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const pathName = location.pathname.split('/')[1];
  const title = pathName ? pathName.charAt(0).toUpperCase() + pathName.slice(1) : 'Dashboard';

  return (
    <header className="flex items-center justify-between px-6 py-4 lg:py-6 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden text-slate-500 hover:text-slate-800 focus:outline-none"
        >
          <Menu size={24} />
        </button>
        <div>
          <div className="text-xs text-slate-400 font-medium mb-0.5">Pages / {title}</div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-800">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Type here..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 w-64 bg-white"
          />
        </div>
        <button className="text-slate-400 hover:text-slate-800 transition-colors">
          <Bell size={20} />
        </button>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors font-medium text-sm">
          <User size={20} />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </div>
    </header>
  );
};
