import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const ConnectedDevicesTable = ({ devices }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Online': return 'teal';
      case 'Idle': return 'slate';
      case 'Suspicious': return 'rose';
      case 'Offline': return 'slate'; // darker style could be used if exists, slate is safe
      default: return 'slate';
    }
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Connected Devices</h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">Real-time status of all LAN endpoints</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3 font-bold px-2">Device</th>
              <th className="pb-3 font-bold px-2">IP Address</th>
              <th className="pb-3 font-bold px-2">MAC Address</th>
              <th className="pb-3 font-bold px-2">Type</th>
              <th className="pb-3 font-bold px-2">Status</th>
              <th className="pb-3 font-bold px-2">Traffic</th>
              <th className="pb-3 font-bold px-2 whitespace-nowrap">Last Seen</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {devices.map((device) => {
              const Icon = device.icon;
              return (
                <tr key={device.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <Icon size={16} />
                      </div>
                      <span className="font-bold text-slate-800">{device.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 font-mono text-slate-600 font-semibold">{device.ip}</td>
                  <td className="py-4 px-2 font-mono text-slate-400 text-xs">{device.mac}</td>
                  <td className="py-4 px-2 font-semibold text-slate-600">{device.type}</td>
                  <td className="py-4 px-2">
                    <Badge color={getStatusColor(device.status)}>{device.status}</Badge>
                  </td>
                  <td className="py-4 px-2 font-semibold text-slate-800">{device.traffic}</td>
                  <td className="py-4 px-2 text-slate-500 font-medium whitespace-nowrap">{device.lastSeen}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
