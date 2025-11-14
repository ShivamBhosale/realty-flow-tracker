import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, Target } from 'lucide-react';

interface CumulativeIncomeTrendChartProps {
  data: Array<{
    date: string;
    cumulativeIncome: number;
    targetIncome: number;
  }>;
  annualGoal: number;
  currentTotal: number;
}

export const CumulativeIncomeTrendChart: React.FC<CumulativeIncomeTrendChartProps> = ({
  data,
  annualGoal,
  currentTotal,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No income data available yet
      </div>
    );
  }

  const chartConfig = {
    cumulativeIncome: {
      label: 'Current Income',
      color: 'hsl(var(--chart-1))',
    },
    targetIncome: {
      label: 'Target Income',
      color: 'hsl(var(--chart-2))',
    },
  };

  const difference = annualGoal - currentTotal;
  const percentageComplete = ((currentTotal / annualGoal) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Current Progress
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ${currentTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {percentageComplete}% of annual goal
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Target className="h-4 w-4" />
            Annual Goal
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ${annualGoal.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Target for this year
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Remaining
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ${difference.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            To reach your goal
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
              }
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Target line - straight line showing goal */}
            <Line
              type="monotone"
              dataKey="targetIncome"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target Income"
            />
            
            {/* Actual cumulative income line */}
            <Line
              type="monotone"
              dataKey="cumulativeIncome"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Current Income"
            />

            {/* Add milestone reference lines at 25%, 50%, 75% */}
            <ReferenceLine
              y={annualGoal * 0.25}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
            />
            <ReferenceLine
              y={annualGoal * 0.5}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
            />
            <ReferenceLine
              y={annualGoal * 0.75}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
