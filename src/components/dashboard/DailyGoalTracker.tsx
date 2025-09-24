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
  const [targets, setTargets] = useState<any>(null);

  useEffect(() => {
    loadTargets();
  }, [user]);

  const loadTargets = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('daily_targets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setTargets(data);
    }
  };

  if (!targets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Goal Progress
          </CardTitle>
          <CardDescription>
            Set your daily targets in Goals to track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No daily targets set. Visit the Goals page to set your daily activity targets.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dailyGoals = [
    {
      label: 'Daily Calls',
      current: todaysMetrics.calls_made,
      target: targets.calls_made_target || 0,
      color: 'hsl(var(--chart-1))'
    },
    {
      label: 'Daily Contacts',
      current: todaysMetrics.contacts_reached,
      target: targets.contacts_reached_target || 0,
      color: 'hsl(var(--chart-2))'
    },
    {
      label: 'Daily Appointments',
      current: todaysMetrics.appointments_set,
      target: targets.appointments_set_target || 0,
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
          Track your daily activity against your set targets
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