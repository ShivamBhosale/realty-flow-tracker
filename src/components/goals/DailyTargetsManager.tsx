import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Target, Phone, Users, Calendar, CalendarDays, FileText, Home, HandHeart } from 'lucide-react';

interface DailyTargets {
  id?: string;
  calls_made_target: number;
  contacts_reached_target: number;
  appointments_set_target: number;
  appointments_attended_target: number;
  listing_presentations_target: number;
  listings_taken_target: number;
  buyers_signed_target: number;
}

const DailyTargetsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targets, setTargets] = useState<DailyTargets>({
    calls_made_target: 25,
    contacts_reached_target: 8,
    appointments_set_target: 4,
    appointments_attended_target: 3,
    listing_presentations_target: 2,
    listings_taken_target: 1,
    buyers_signed_target: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTargets();
    }
  }, [user]);

  const loadTargets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('daily_targets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && !error) {
      setTargets(data);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const targetData = {
      user_id: user.id,
      ...targets,
    };

    const { error } = await supabase
      .from('daily_targets')
      .upsert(targetData, { onConflict: 'user_id' });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save daily targets",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Daily targets updated successfully",
      });
      await loadTargets();
    }
    
    setIsLoading(false);
  };

  const updateTarget = (field: keyof DailyTargets, value: number) => {
    setTargets(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const targetFields = [
    { 
      key: 'calls_made_target', 
      label: 'Daily Calls Target', 
      icon: Phone, 
      description: 'Number of calls to make each day'
    },
    { 
      key: 'contacts_reached_target', 
      label: 'Daily Contacts Target', 
      icon: Users, 
      description: 'Number of people to reach each day'
    },
    { 
      key: 'appointments_set_target', 
      label: 'Daily Appointments Set Target', 
      icon: Calendar, 
      description: 'New appointments to schedule each day'
    },
    { 
      key: 'appointments_attended_target', 
      label: 'Daily Appointments Attended Target', 
      icon: CalendarDays, 
      description: 'Appointments to attend each day'
    },
    { 
      key: 'listing_presentations_target', 
      label: 'Daily Presentations Target', 
      icon: FileText, 
      description: 'Listing presentations to give each day'
    },
    { 
      key: 'listings_taken_target', 
      label: 'Daily Listings Target', 
      icon: Home, 
      description: 'New listings to secure each day'
    },
    { 
      key: 'buyers_signed_target', 
      label: 'Daily Buyers Target', 
      icon: HandHeart, 
      description: 'Buyer agreements to sign each day'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Daily Activity Targets
        </CardTitle>
        <CardDescription>
          Set your daily targets for each metric to track your progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {targetFields.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                min="0"
                value={targets[key as keyof DailyTargets] || ''}
                onChange={(e) => updateTarget(key as keyof DailyTargets, Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="w-full mt-6"
        >
          {isLoading ? 'Saving...' : 'Save Daily Targets'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DailyTargetsManager;