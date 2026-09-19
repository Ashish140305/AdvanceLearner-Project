import { ChartContainer } from './ChartContainer';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { threatDistributionData } from '../../data/mockData';

export const ThreatDistribution = () => {
  return (
    <ChartContainer title="Threat Distribution" subtitle="Last 24 hours analysis">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={threatDistributionData}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {threatDistributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
