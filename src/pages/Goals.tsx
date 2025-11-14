import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Target, DollarSign, TrendingUp } from 'lucide-react';
import DailyTargetsManager from '@/components/goals/DailyTargetsManager';

interface Goals {
  id?: string;
  year: number;
  annual_income_goal: number;
  average_commission_per_deal: number;
  deals_needed?: number;
}

const Goals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goals>({
    year: new Date().getFullYear(),
    annual_income_goal: 0,
    average_commission_per_deal: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .maybeSingle();

    if (data && !error) {
      setGoals(data);
    }
  };

  const calculateDealsNeeded = (income: number, commission: number) => {
    if (commission <= 0) return 0;
    return Math.ceil(income / commission);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const dealsNeeded = calculateDealsNeeded(goals.annual_income_goal, goals.average_commission_per_deal);
    
    const goalData = {
      user_id: user.id,
      year: goals.year,
      annual_income_goal: goals.annual_income_goal,
      average_commission_per_deal: goals.average_commission_per_deal,
      deals_needed: dealsNeeded,
    };

    const { error } = await supabase
      .from('goals')
      .upsert(goalData, { onConflict: 'user_id,year' });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save goals",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Goals updated successfully",
      });
      await loadGoals();
    }
    
    setIsLoading(false);
  };

  const updateGoal = (field: keyof Goals, value: number) => {
    setGoals(prev => ({ ...prev, [field]: value }));
  };

  const dealsNeeded = calculateDealsNeeded(goals.annual_income_goal, goals.average_commission_per_deal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Goals & Targets</h1>
        <p className="text-muted-foreground">
          Set your annual goals and daily activity targets
        </p>
      </div>

      {/* Daily Targets Section */}
      <DailyTargetsManager />

      {/* Annual Goals Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Annual Goals</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Annual Income Goal
            </CardTitle>
            <CardDescription>
              Set your target income for {goals.year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="income">Annual Income Goal ($)</Label>
              <Input
                id="income"
                type="number"
                placeholder="e.g., 150000"
                value={goals.annual_income_goal || ''}
                onChange={(e) => updateGoal('annual_income_goal', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Commission per Deal
            </CardTitle>
            <CardDescription>
              Your average commission per transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="commission">Average Commission ($)</Label>
              <Input
                id="commission"
                type="number"
                placeholder="e.g., 5000"
                value={goals.average_commission_per_deal || ''}
                onChange={(e) => updateGoal('average_commission_per_deal', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Deals Needed
            </CardTitle>
            <CardDescription>
              Based on your income goal and average commission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {dealsNeeded}
              </div>
              <p className="text-muted-foreground mt-2">
                deals needed to reach your ${goals.annual_income_goal.toLocaleString()} goal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? 'Saving...' : 'Save Annual Goals'}
        </Button>
      </div>
    </div>
  );
};

export default Goals;