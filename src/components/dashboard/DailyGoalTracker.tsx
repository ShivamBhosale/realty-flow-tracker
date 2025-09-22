import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DailyGoalTrackerProps {
  todaysMetrics: {
    calls_made: number;
    contacts_reached: number;
    appointments_set: number;
    closed_deals: number;
  };
}

const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({ todaysMetrics }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any>(null);

  useEffect(() => {
    loadGoals();
  }, [user]);

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

  if (!goals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Goal Progress
          </CardTitle>
          <CardDescription>
            Set your annual goals to track daily progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals set for this year. Visit the Goals page to set your targets.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate daily targets based on annual goals
  const daysInYear = 365;
  const workingDaysInYear = 250; // Assuming 5 days/week, 50 weeks/year

  const dailyTargets = {
    calls: Math.ceil((goals.calls_needed || 0) / workingDaysInYear),
    contacts: Math.ceil((goals.contacts_needed || 0) / workingDaysInYear),
    appointments: Math.ceil((goals.appointments_needed || 0) / workingDaysInYear),
    deals: Math.ceil((goals.deals_needed || 0) / workingDaysInYear),
  };

  const dailyGoals = [
    {
      label: 'Daily Calls',
      current: todaysMetrics.calls_made,
      target: dailyTargets.calls,
      color: 'hsl(var(--chart-1))'
    },
    {
      label: 'Daily Contacts',
      current: todaysMetrics.contacts_reached,
      target: dailyTargets.contacts,
      color: 'hsl(var(--chart-2))'
    },
    {
      label: 'Daily Appointments',
      current: todaysMetrics.appointments_set,
      target: dailyTargets.appointments,
      color: 'hsl(var(--chart-3))'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Daily Goal Progress
        </CardTitle>
        <CardDescription>
          Track your daily activity against annual goal targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dailyGoals.map((goal, index) => {
            const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            const isComplete = progress >= 100;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{goal.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isComplete ? 'text-success' : 'text-foreground'}`}>
                      {goal.current} / {goal.target}
                    </span>
                    {isComplete && <Target className="h-4 w-4 text-success" />}
                  </div>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{ 
                    '--progress-background': goal.color 
                  } as React.CSSProperties}
                />
                <div className="text-xs text-muted-foreground">
                  {progress.toFixed(0)}% of daily target completed
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyGoalTracker;