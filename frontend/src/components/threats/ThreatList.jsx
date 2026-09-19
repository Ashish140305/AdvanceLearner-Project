import { Card } from '../common/Card';

export const ThreatList = () => {
  return (
    <Card>
      <h3 className="font-bold text-gray-800">Recent Threats</h3>
      <p className="text-gray-400 text-sm mt-2">No active threats detected.</p>
    </Card>
  );
};
