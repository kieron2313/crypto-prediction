import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface TrendChartProps {
  data: number[];
  color: string;
  className?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, color, className = "h-16 w-32" }) => {
  const chartData = data.map((val, idx) => ({ i: idx, val }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;