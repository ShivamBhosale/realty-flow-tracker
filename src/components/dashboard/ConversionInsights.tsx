import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyMetrics {
  calls_made: number;
  contacts_reached: number;
  appointments_set: number;
  appointments_attended: number;
  listing_presentations: number;
  listings_taken: number;
  closed_deals: number;
}

interface ConversionInsightsProps {
  metrics: DailyMetrics;
}

const ConversionInsights: React.FC<ConversionInsightsProps> = ({ metrics }) => {
  const conversions = [
    {
      label: 'Calls → Contacts',
      value: metrics.calls_made > 0 ? (metrics.contacts_reached / metrics.calls_made) * 100 : 0,
      target: 30, // Industry benchmark
      description: 'Contact rate from calls'
    },
    {
      label: 'Contacts → Appointments',
      value: metrics.contacts_reached > 0 ? (metrics.appointments_set / metrics.contacts_reached) * 100 : 0,
      target: 50, // Industry benchmark
      description: 'Appointment booking rate'
    },
    {
      label: 'Appointments → Attended',
      value: metrics.appointments_set > 0 ? (metrics.appointments_attended / metrics.appointments_set) * 100 : 0,
      target: 80, // Industry benchmark
      description: 'Show-up rate'
    },
    {
      label: 'Presentations → Listings',
      value: metrics.listing_presentations > 0 ? (metrics.listings_taken / metrics.listing_presentations) * 100 : 0,
      target: 60, // Industry benchmark
      description: 'Listing conversion rate'
    }
  ];

  const getTrendIcon = (value: number, target: number) => {
    if (value > target) return { icon: TrendingUp, color: 'text-success' };
    if (value < target * 0.8) return { icon: TrendingDown, color: 'text-destructive' };
    return { icon: Minus, color: 'text-warning' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversion Performance
        </CardTitle>
        <CardDescription>
          Track your conversion rates against industry benchmarks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversions.map((conversion, index) => {
            const { icon: TrendIcon, color } = getTrendIcon(conversion.value, conversion.target);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{conversion.label}</span>
                    <TrendIcon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-sm font-bold">
                    {conversion.value.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(conversion.value, 100)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{conversion.description}</span>
                    <span>Target: {conversion.target}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionInsights;