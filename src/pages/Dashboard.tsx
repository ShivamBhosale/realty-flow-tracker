import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Phone, Users, Calendar, Home, FileText, HandHeart, Building, Clock, DollarSign } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import ConversionInsights from '@/components/dashboard/ConversionInsights';
import DailyGoalTracker from '@/components/dashboard/DailyGoalTracker';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';

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
  const [metrics, setMetrics] = useState<DailyMetrics>({
    date: new Date().toISOString().split('T')[0],
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

  useEffect(() => {
    loadTodaysMetrics();
  }, []);

  const loadTodaysMetrics = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error loading metrics:', error);
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
      loadTodaysMetrics();
    }

    setIsLoading(false);
  };

  const updateMetric = (field: keyof DailyMetrics, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  };

  const metricFields = [
    { key: 'calls_made', label: 'Calls Made', icon: Phone, color: 'text-chart-1', target: 25 },
    { key: 'contacts_reached', label: 'Contacts Reached', icon: Users, color: 'text-chart-2', target: 8 },
    { key: 'appointments_set', label: 'Appointments Set', icon: Calendar, color: 'text-chart-3', target: 4 },
    { key: 'appointments_attended', label: 'Appointments Attended', icon: CalendarDays, color: 'text-chart-4', target: 3 },
    { key: 'listing_presentations', label: 'Listing Presentations', icon: FileText, color: 'text-chart-5', target: 2 },
    { key: 'listings_taken', label: 'Listings Taken', icon: Home, color: 'text-success', target: 1 },
    { key: 'buyers_signed', label: 'Buyers Signed', icon: HandHeart, color: 'text-accent', target: 1 },
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
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Metrics'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricFields.map(({ key, label, icon, color, target }) => (
          <MetricCard
            key={key}
            label={label}
            value={metrics[key as keyof DailyMetrics] as number}
            icon={icon}
            color={color}
            onChange={(value) => updateMetric(key as keyof DailyMetrics, value)}
            target={target}
          />
        ))}

        <MetricCard
          label="Volume Closed"
          value={metrics.volume_closed}
          icon={DollarSign}
          color="text-success"
          onChange={(value) => updateMetric('volume_closed', value)}
          isVolume={true}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyGoalTracker todaysMetrics={metrics} />
        <ConversionInsights metrics={metrics} />
      </div>
    </div>
  );
};

export default Dashboard;