-- Update the cron job to run daily and use service role key
-- First unschedule the old job
SELECT cron.unschedule('send-weekly-reports');

-- Create new cron job that runs daily
-- The edge function will filter users by their preferred day
SELECT cron.schedule(
  'send-weekly-reports',
  '0 8 * * *', -- Every day at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://utpxktqcvlkbwheplchd.supabase.co/functions/v1/send-email-report',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key', true))
      ),
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);