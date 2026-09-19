import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LiveMonitor from './pages/LiveMonitor';
import Threats from './pages/Threats';
import MLAnalysis from './pages/MLAnalysis';
import Logs from './pages/Logs';
import SystemStatus from './pages/SystemStatus';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitor" element={<LiveMonitor />} />
          <Route path="threats" element={<Threats />} />
          <Route path="analysis" element={<Navigate to="/ml-analysis" replace />} />
          <Route path="ml-analysis" element={<MLAnalysis />} />
          <Route path="logs" element={<Logs />} />
          <Route path="system-status" element={<SystemStatus />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
