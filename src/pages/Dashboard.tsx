import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Phone, Users, Calendar, Home, FileText, HandHeart, Building, Clock, DollarSign, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import MetricCard from '@/components/dashboard/MetricCard';
import { MetricCardSkeleton } from '@/components/ui/MetricCardSkeleton';
import ConversionInsights from '@/components/dashboard/ConversionInsights';
import DailyGoalTracker from '@/components/dashboard/DailyGoalTracker';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { Separator } from '@/components/ui/separator';
import { subDays } from 'date-fns';

interface DailyMetrics {
  id?: string;
  date: string;
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

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<DailyMetrics>({
    date: formatInTimeZone(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd'),
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [trendData, setTrendData] = useState<Record<string, number[]>>({});

  useEffect(() => {
    loadMetricsForDate();
    loadTrendData();
  }, [selectedDate]);

  useEffect(() => {
    loadMetricsForDate();
    loadTrendData();
  }, []);

  const loadMetricsForDate = async () => {
    if (!user) return;
    setIsLoadingData(true);

    const localDate = formatInTimeZone(selectedDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', localDate)
      .maybeSingle();

    if (error) {
      console.error('Error loading metrics:', error);
      setIsLoadingData(false);
      return;
    }

    if (data) {
      setMetrics({
        id: data.id,
        date: data.date,
        calls_made: data.calls_made || 0,
        contacts_reached: data.contacts_reached || 0,
        appointments_set: data.appointments_set || 0,
        appointments_attended: data.appointments_attended || 0,
        listing_presentations: data.listing_presentations || 0,
        listings_taken: data.listings_taken || 0,
        buyers_signed: data.buyers_signed || 0,
        active_listings: data.active_listings || 0,
        pending_contracts: data.pending_contracts || 0,
        closed_deals: data.closed_deals || 0,
        volume_closed: data.volume_closed || 0,
      });
    } else {
      // Reset metrics for new date
      const localDate = formatInTimeZone(selectedDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd');
      setMetrics({
        date: localDate,
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
    }
    setIsLoadingData(false);
  };

  const loadTrendData = async () => {
    if (!user) return;

    const endDate = formatInTimeZone(selectedDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd');
    const startDate = formatInTimeZone(subDays(selectedDate, 6), Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd');

    const { data } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (data) {
      const trends: Record<string, number[]> = {
        calls_made: data.map(d => d.calls_made || 0),
        contacts_reached: data.map(d => d.contacts_reached || 0),
        appointments_set: data.map(d => d.appointments_set || 0),
        appointments_attended: data.map(d => d.appointments_attended || 0),
        listing_presentations: data.map(d => d.listing_presentations || 0),
        listings_taken: data.map(d => d.listings_taken || 0),
        buyers_signed: data.map(d => d.buyers_signed || 0),
      };
      setTrendData(trends);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const metricsData = {
      user_id: user.id,
      date: metrics.date,
      calls_made: metrics.calls_made,
      contacts_reached: metrics.contacts_reached,
      appointments_set: metrics.appointments_set,
      appointments_attended: metrics.appointments_attended,
      listing_presentations: metrics.listing_presentations,
      listings_taken: metrics.listings_taken,
      buyers_signed: metrics.buyers_signed,
      active_listings: metrics.active_listings,
      pending_contracts: metrics.pending_contracts,
      closed_deals: metrics.closed_deals,
      volume_closed: metrics.volume_closed,
    };

    const { error } = await supabase
      .from('daily_metrics')
      .upsert(metricsData, { 
        onConflict: 'user_id,date',
        ignoreDuplicates: false 
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save metrics. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Daily metrics saved successfully!",
      });
      loadMetricsForDate();
    }

    setIsLoading(false);
  };

  const updateMetric = (field: keyof DailyMetrics, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  };

  // Keyboard shortcut for saving (Cmd/Ctrl + S)
  useKeyboardShortcut({
    key: 's',
    ctrlKey: true,
    callback: handleSave,
  });

  const [dailyTargets, setDailyTargets] = useState<any>(null);

  useEffect(() => {
    loadDailyTargets();
  }, [user]);

  const loadDailyTargets = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('daily_targets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setDailyTargets(data);
  };

  const leadGenFields = [
    { key: 'calls_made', label: 'Calls Made', icon: Phone, color: 'text-chart-1', targetKey: 'calls_made_target' },
    { key: 'contacts_reached', label: 'Contacts Reached', icon: Users, color: 'text-chart-2', targetKey: 'contacts_reached_target' },
    { key: 'appointments_set', label: 'Appointments Set', icon: Calendar, color: 'text-chart-3', targetKey: 'appointments_set_target' },
  ];

  const conversionFields = [
    { key: 'appointments_attended', label: 'Appointments Attended', icon: CalendarDays, color: 'text-chart-4', targetKey: 'appointments_attended_target' },
    { key: 'listing_presentations', label: 'Listing Presentations', icon: FileText, color: 'text-chart-5', targetKey: 'listing_presentations_target' },
    { key: 'listings_taken', label: 'Listings Taken', icon: Home, color: 'text-success', targetKey: 'listings_taken_target' },
    { key: 'buyers_signed', label: 'Buyers Signed', icon: HandHeart, color: 'text-accent', targetKey: 'buyers_signed_target' },
  ];

  const pipelineFields = [
    { key: 'active_listings', label: 'Active Listings', icon: Building, color: 'text-warning' },
    { key: 'pending_contracts', label: 'Pending Contracts', icon: Clock, color: 'text-info' },
    { key: 'closed_deals', label: 'Closed Deals', icon: DollarSign, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Metrics</h1>
          <p className="text-muted-foreground">Track your daily real estate activities</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? formatInTimeZone(selectedDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Metrics'}
          </Button>
        </div>
      </div>

      {isLoadingData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(11)].map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-1">Lead Generation</h2>
            <p className="text-sm text-muted-foreground mb-4">Track your outreach and initial contacts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadGenFields.map(({ key, label, icon, color, targetKey }) => {
                const target = targetKey && dailyTargets ? dailyTargets[targetKey] : undefined;
                const trend = trendData[key] || undefined;
                
                return (
                  <MetricCard
                    key={key}
                    label={label}
                    value={metrics[key as keyof DailyMetrics] as number}
                    icon={icon}
                    color={color}
                    onChange={(value) => updateMetric(key as keyof DailyMetrics, value)}
                    target={target}
                    trend={trend}
                  />
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-1">Conversions</h2>
            <p className="text-sm text-muted-foreground mb-4">Monitor your conversion activities</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversionFields.map(({ key, label, icon, color, targetKey }) => {
                const target = targetKey && dailyTargets ? dailyTargets[targetKey] : undefined;
                const trend = trendData[key] || undefined;
                
                return (
                  <MetricCard
                    key={key}
                    label={label}
                    value={metrics[key as keyof DailyMetrics] as number}
                    icon={icon}
                    color={color}
                    onChange={(value) => updateMetric(key as keyof DailyMetrics, value)}
                    target={target}
                    trend={trend}
                  />
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-1">Pipeline</h2>
            <p className="text-sm text-muted-foreground mb-4">View your active business pipeline</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pipelineFields.map(({ key, label, icon, color }) => {
                return (
                  <MetricCard
                    key={key}
                    label={label}
                    value={metrics[key as keyof DailyMetrics] as number}
                    icon={icon}
                    color={color}
                    onChange={(value) => updateMetric(key as keyof DailyMetrics, value)}
                  />
                );
              })}

              <MetricCard
                label="Volume Closed"
                value={metrics.volume_closed}
                icon={DollarSign}
                color="text-success"
                onChange={(value) => updateMetric('volume_closed', value)}
                isVolume={true}
              />
            </div>
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyGoalTracker todaysMetrics={metrics} />
        <ConversionInsights metrics={metrics} />
      </div>
    </div>
  );
};

export default Dashboard;