import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, Target, Users, BarChart3, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import TrendChart from '@/components/charts/TrendChart';
import GoalProgressChart from '@/components/charts/GoalProgressChart';

interface MetricsSummary {
  calls_made: number;
  contacts_reached: number;
  appointments_set: number;
  appointments_attended: number;
  listing_presentations: number;
  listings_taken: number;
  buyers_signed: number;
  active_listings: number;
  pending_contracts: number;
  closed_deals: number;
  volume_closed: number;
}

const Reports = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<string>('month');
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [goals, setGoals] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMetrics();
      loadGoals();
    }
  }, [user, timeframe]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return {
          start: format(subDays(now, 7), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'year':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };

  const loadMetrics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { start, end } = getDateRange();

    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end);

    if (data && !error) {
      // Store daily data for trend charts
      setDailyData(data);
      
      // Sum up all metrics
      const summary = data.reduce((acc, day) => ({
        calls_made: acc.calls_made + (day.calls_made || 0),
        contacts_reached: acc.contacts_reached + (day.contacts_reached || 0),
        appointments_set: acc.appointments_set + (day.appointments_set || 0),
        appointments_attended: acc.appointments_attended + (day.appointments_attended || 0),
        listing_presentations: acc.listing_presentations + (day.listing_presentations || 0),
        listings_taken: acc.listings_taken + (day.listings_taken || 0),
        buyers_signed: acc.buyers_signed + (day.buyers_signed || 0),
        active_listings: Math.max(acc.active_listings, day.active_listings || 0),
        pending_contracts: Math.max(acc.pending_contracts, day.pending_contracts || 0),
        closed_deals: acc.closed_deals + (day.closed_deals || 0),
        volume_closed: acc.volume_closed + (day.volume_closed || 0),
      }), {
        calls_made: 0,
        contacts_reached: 0,
        appointments_set: 0,
        appointments_attended: 0,
        listing_presentations: 0,
        listings_taken: 0,
        buyers_signed: 0,
        active_listings: 0,
        pending_contracts: 0,
        closed_deals: 0,
        volume_closed: 0,
      });

      setMetrics(summary);
    }
    
    setIsLoading(false);
  };

  const loadGoals = async () => {
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .single();

    if (data) {
      setGoals(data);
    }
  };

  const getConversionRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  const timeframeLabel = {
    week: 'Past 7 Days',
    month: 'This Month',
    year: 'This Year'
  }[timeframe];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your performance and track conversions
          </p>
        </div>
        
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading metrics...</div>
      ) : metrics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.calls_made}</div>
                <p className="text-xs text-muted-foreground">{timeframeLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacts Reached</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.contacts_reached}</div>
                <p className="text-xs text-muted-foreground">
                  {getConversionRate(metrics.contacts_reached, metrics.calls_made)} conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments Set</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.appointments_set}</div>
                <p className="text-xs text-muted-foreground">
                  {getConversionRate(metrics.appointments_set, metrics.contacts_reached)} from contacts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.closed_deals}</div>
                <p className="text-xs text-muted-foreground">
                  ${metrics.volume_closed.toLocaleString()} volume
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>Visual breakdown of your sales funnel</CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionFunnelChart data={metrics} />
              </CardContent>
            </Card>

            {dailyData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>Track your daily activity trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendChart data={dailyData} />
                </CardContent>
              </Card>
            )}

            {goals && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Progress
                  </CardTitle>
                  <CardDescription>Track your progress towards annual goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <GoalProgressChart
                    currentDeals={metrics.closed_deals}
                    targetDeals={goals.deals_needed || 0}
                    currentVolume={metrics.volume_closed}
                    targetVolume={goals.annual_income_goal || 0}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
                <CardDescription>Detailed conversion metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Calls → Contacts</span>
                  <span className="font-medium">
                    {getConversionRate(metrics.contacts_reached, metrics.calls_made)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Contacts → Appointments</span>
                  <span className="font-medium">
                    {getConversionRate(metrics.appointments_set, metrics.contacts_reached)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Appointments → Attended</span>
                  <span className="font-medium">
                    {getConversionRate(metrics.appointments_attended, metrics.appointments_set)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Attended → Presentations</span>
                  <span className="font-medium">
                    {getConversionRate(metrics.listing_presentations, metrics.appointments_attended)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Pipeline</CardTitle>
                <CardDescription>Current active business status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Listings</span>
                  <span className="font-medium">{metrics.active_listings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Contracts</span>
                  <span className="font-medium">{metrics.pending_contracts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Buyers Signed</span>
                  <span className="font-medium">{metrics.buyers_signed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Listings Taken</span>
                  <span className="font-medium">{metrics.listings_taken}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available for the selected timeframe.</p>
          <Button onClick={loadMetrics} className="mt-4">
            Refresh Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default Reports;