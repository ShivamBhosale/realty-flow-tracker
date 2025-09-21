import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface GoalProgressChartProps {
  currentDeals: number;
  targetDeals: number;
  currentVolume: number;
  targetVolume: number;
}

const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ 
  currentDeals, 
  targetDeals, 
  currentVolume, 
  targetVolume 
}) => {
  const dealsProgress = Math.min((currentDeals / targetDeals) * 100, 100);
  const volumeProgress = Math.min((currentVolume / targetVolume) * 100, 100);

  const dealsData = [
    { name: 'Completed', value: dealsProgress, fill: 'hsl(var(--chart-success))' },
    { name: 'Remaining', value: 100 - dealsProgress, fill: 'hsl(var(--muted))' },
  ];

  const volumeData = [
    { name: 'Completed', value: volumeProgress, fill: 'hsl(var(--chart-1))' },
    { name: 'Remaining', value: 100 - volumeProgress, fill: 'hsl(var(--muted))' },
  ];

  const chartConfig = {
    value: {
      label: "Progress %",
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="text-center">
        <h4 className="text-sm font-medium mb-2">Deals Progress</h4>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dealsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
                dataKey="value"
              >
                {dealsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <p className="text-xs text-muted-foreground mt-2">
          {currentDeals} of {targetDeals} deals ({dealsProgress.toFixed(1)}%)
        </p>
      </div>

      <div className="text-center">
        <h4 className="text-sm font-medium mb-2">Volume Progress</h4>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={volumeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
                dataKey="value"
              >
                {volumeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <p className="text-xs text-muted-foreground mt-2">
          ${currentVolume.toLocaleString()} of ${targetVolume.toLocaleString()} ({volumeProgress.toFixed(1)}%)
        </p>
      </div>
    </div>
  );
};

export default GoalProgressChart;