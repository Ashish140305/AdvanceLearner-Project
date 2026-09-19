import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldAlert, Cpu, ScrollText, Server } from 'lucide-react';

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <nav className="w-64 p-4 p-4">
        <h1 className="text-xl font-bold mb-8">NetSec Monitor</h1>
        <ul className="space-y-2">
          <li><Link to="/dashboard" className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-2xl"><LayoutDashboard size={20}/> Dashboard</Link></li>
          <li><Link to="/monitor" className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-2xl"><Activity size={20}/> Live Monitor</Link></li>
          <li><Link to="/threats" className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-2xl"><ShieldAlert size={20}/> Threats</Link></li>
          <li><Link to="/analysis" className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-2xl"><Cpu size={20}/> ML Analysis</Link></li>
          <li><Link to="/logs" className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-2xl"><ScrollText size={20}/> Logs</Link></li>
          <li><Link to="/status" className="flex items-center gap-2 p-2 hover:bg-white hover:shadow-sm rounded-2xl"><Server size={20}/> System Status</Link></li>
        </ul>
      </nav>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
