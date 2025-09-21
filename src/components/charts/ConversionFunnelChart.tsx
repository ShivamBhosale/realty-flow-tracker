import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ConversionFunnelChartProps {
  data: {
    calls_made: number;
    contacts_reached: number;
    appointments_set: number;
    appointments_attended: number;
    listing_presentations: number;
    listings_taken: number;
  };
}

const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Calls Made',
      value: data.calls_made,
      fill: 'hsl(var(--chart-1))',
    },
    {
      name: 'Contacts Reached',
      value: data.contacts_reached,
      fill: 'hsl(var(--chart-2))',
    },
    {
      name: 'Appointments Set',
      value: data.appointments_set,
      fill: 'hsl(var(--chart-3))',
    },
    {
      name: 'Appointments Attended',
      value: data.appointments_attended,
      fill: 'hsl(var(--chart-4))',
    },
    {
      name: 'Presentations',
      value: data.listing_presentations,
      fill: 'hsl(var(--chart-5))',
    },
    {
      name: 'Listings Taken',
      value: data.listings_taken,
      fill: 'hsl(var(--chart-success))',
    },
  ];

  const chartConfig = {
    value: {
      label: "Count",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name" 
            className="text-xs fill-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default ConversionFunnelChart;