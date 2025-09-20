import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Phone, Users, Calendar, Home, FileText, HandHeart, Building, Clock, DollarSign } from 'lucide-react';

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
    { key: 'calls_made', label: 'Calls Made', icon: Phone, color: 'text-blue-600' },
    { key: 'contacts_reached', label: 'Contacts Reached', icon: Users, color: 'text-green-600' },
    { key: 'appointments_set', label: 'Appointments Set', icon: Calendar, color: 'text-purple-600' },
    { key: 'appointments_attended', label: 'Appointments Attended', icon: CalendarDays, color: 'text-orange-600' },
    { key: 'listing_presentations', label: 'Listing Presentations', icon: FileText, color: 'text-indigo-600' },
    { key: 'listings_taken', label: 'Listings Taken', icon: Home, color: 'text-emerald-600' },
    { key: 'buyers_signed', label: 'Buyers Signed', icon: HandHeart, color: 'text-rose-600' },
    { key: 'active_listings', label: 'Active Listings', icon: Building, color: 'text-yellow-600' },
    { key: 'pending_contracts', label: 'Pending Contracts', icon: Clock, color: 'text-cyan-600' },
    { key: 'closed_deals', label: 'Closed Deals', icon: DollarSign, color: 'text-green-700' },
  ];

  return (
    <div className="space-y-6">
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
        {metricFields.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {key === 'volume_closed' ? `$${metrics[key].toLocaleString()}` : metrics[key]}
                </div>
                <Input
                  type="number"
                  min="0"
                  step={key === 'volume_closed' ? '0.01' : '1'}
                  value={metrics[key as keyof DailyMetrics]}
                  onChange={(e) => updateMetric(key as keyof DailyMetrics, parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Closed</CardTitle>
            <DollarSign className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                ${metrics.volume_closed.toLocaleString()}
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={metrics.volume_closed}
                onChange={(e) => updateMetric('volume_closed', parseFloat(e.target.value) || 0)}
                className="text-sm"
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Conversion Insights</CardTitle>
          <CardDescription>
            Real-time conversion ratios based on today's numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {metrics.calls_made > 0 ? ((metrics.contacts_reached / metrics.calls_made) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Calls to Contacts</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {metrics.contacts_reached > 0 ? ((metrics.appointments_set / metrics.contacts_reached) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Contacts to Appointments</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {metrics.listing_presentations > 0 ? ((metrics.listings_taken / metrics.listing_presentations) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Presentations to Listings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;