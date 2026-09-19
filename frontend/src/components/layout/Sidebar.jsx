import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldAlert, Cpu, ScrollText, Server, X } from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/monitor', label: 'Live Monitor', icon: Activity },
    { path: '/threats', label: 'Threats', icon: ShieldAlert },
    { path: '/ml-analysis', label: 'ML Analysis', icon: Cpu },
    { path: '/logs', label: 'Logs', icon: ScrollText },
    { path: '/system-status', label: 'System Status', icon: Server }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-800/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <nav className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-50 border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6">
          <h1 className="text-xl font-bold text-slate-800">NetSec Monitor</h1>
          <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <ul className="space-y-2 px-4 mt-2">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link 
                to={path} 
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-white shadow-sm text-slate-800 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive(path) ? 'bg-teal-400 text-white' : ''}`}>
                  <Icon size={20} />
                </div>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};
