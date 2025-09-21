import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';

interface TrendChartProps {
  data: Array<{
    date: string;
    calls_made: number;
    contacts_reached: number;
    appointments_set: number;
    closed_deals: number;
  }>;
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }));

  const chartConfig = {
    calls_made: {
      label: "Calls Made",
      color: "hsl(var(--chart-1))",
    },
    contacts_reached: {
      label: "Contacts Reached",
      color: "hsl(var(--chart-2))",
    },
    appointments_set: {
      label: "Appointments Set",
      color: "hsl(var(--chart-3))",
    },
    closed_deals: {
      label: "Closed Deals",
      color: "hsl(var(--chart-success))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="calls_made" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="contacts_reached" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="appointments_set" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="closed_deals" 
            stroke="hsl(var(--chart-success))" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TrendChart;