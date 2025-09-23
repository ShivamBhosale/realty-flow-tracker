import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Target, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [todaysMetrics, setTodaysMetrics] = useState<any>(null);
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Load today's metrics
    const today = new Date().toISOString().split('T')[0];
    const { data: metricsData } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (metricsData) {
      setTodaysMetrics(metricsData);
    }

    // Load contacts count
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setContactsCount(count || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickStats = [
    {
      label: 'Calls Today',
      value: todaysMetrics?.calls_made || 0,
      icon: Calendar,
      color: 'text-chart-1'
    },
    {
      label: 'Total Contacts',
      value: contactsCount,
      icon: Users,
      color: 'text-chart-2'
    },
    {
      label: 'Appointments Set',
      value: todaysMetrics?.appointments_set || 0,
      icon: Target,
      color: 'text-chart-3'
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {profile?.full_name || 'Agent'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready to crush your goals today? Here's your quick overview.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={() => navigate('/contacts')} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Contacts
            </Button>
            <Button onClick={() => navigate('/goals')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Goals
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className={`p-2 rounded-full bg-background ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeBanner;