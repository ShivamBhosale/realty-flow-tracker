-- Schedule weekly email reports to run every Monday at 8 AM UTC
-- This will send reports to all users who have weekly_report_enabled = true

SELECT cron.schedule(
  'send-weekly-reports',
  '0 8 * * 1', -- Every Monday at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://utpxktqcvlkbwheplchd.supabase.co/functions/v1/send-email-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cHhrdHFjdmxrYndoZXBsY2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzg5ODcsImV4cCI6MjA3Mzk1NDk4N30.Gi2_Trz28KCbbH5GO7VIdTLaBoeEnu95OBqIdtXmJ-Y"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);