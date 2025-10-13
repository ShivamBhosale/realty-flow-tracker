import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Moon, Sun, Monitor, User, Bell, Shield, Database, Trash2, LogOut } from 'lucide-react';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    dailyReminders: true,
    goalAlerts: true,
    emailReports: false
  });
  const [emailPrefs, setEmailPrefs] = useState({
    weeklyReportEnabled: true,
    weeklyReportDay: 1, // Monday
    email: ''
  });
  const [isSendingReport, setIsSendingReport] = useState(false);

  useEffect(() => {
    loadProfile();
    loadEmailPreferences();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || user.email || ''
      });
    }
  };

  const loadEmailPreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setEmailPrefs({
        weeklyReportEnabled: data.weekly_report_enabled,
        weeklyReportDay: data.weekly_report_day,
        email: data.email
      });
    } else {
      // Initialize with user's email
      setEmailPrefs(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email
      });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    // This would typically require more sophisticated handling
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  const handleUpdateEmailPrefs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: user.id,
        email: emailPrefs.email,
        weekly_report_enabled: emailPrefs.weeklyReportEnabled,
        weekly_report_day: emailPrefs.weeklyReportDay
      });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update email preferences. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Email preferences updated successfully!",
      });
    }
    
    setIsLoading(false);
  };

  const handleSendTestReport = async () => {
    if (!user) return;
    
    setIsSendingReport(true);
    
    try {
      const response = await supabase.functions.invoke('send-email-report', {
        body: { 
          user_id: user.id,
          timeframe: 'week'
        }
      });

      if (response.error) throw response.error;
      
      toast({
        title: "Success",
        description: "Test email report sent! Check your inbox.",
      });
    } catch (error: any) {
      console.error('Error sending test report:', error);
      toast({
        title: "Error",
        description: "Failed to send test report. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsSendingReport(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <Button onClick={handleUpdateProfile} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getThemeIcon()}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-reminders">Daily Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminders to log your daily metrics
              </p>
            </div>
            <Switch
              id="daily-reminders"
              checked={notifications.dailyReminders}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, dailyReminders: checked }))
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="goal-alerts">Goal Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about goal progress
              </p>
            </div>
            <Switch
              id="goal-alerts"
              checked={notifications.goalAlerts}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, goalAlerts: checked }))
              }
            />
          </div>
          
        </CardContent>
      </Card>

      {/* Email Reports Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Reports
          </CardTitle>
          <CardDescription>
            Configure automated email reports for your performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-email">Email Address for Reports</Label>
            <Input
              id="report-email"
              type="email"
              value={emailPrefs.email}
              onChange={(e) => setEmailPrefs(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email for reports"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive automated weekly performance reports
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={emailPrefs.weeklyReportEnabled}
              onCheckedChange={(checked) => 
                setEmailPrefs(prev => ({ ...prev, weeklyReportEnabled: checked }))
              }
            />
          </div>

          {emailPrefs.weeklyReportEnabled && (
            <div className="space-y-2">
              <Label htmlFor="report-day">Day of Week</Label>
              <Select 
                value={emailPrefs.weeklyReportDay.toString()} 
                onValueChange={(value) => setEmailPrefs(prev => ({ ...prev, weeklyReportDay: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleUpdateEmailPrefs} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Save Email Preferences'}
            </Button>
            <Button 
              onClick={handleSendTestReport} 
              variant="outline"
              disabled={isSendingReport}
            >
              {isSendingReport ? 'Sending...' : 'Send Test Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your account security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Database className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;