import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailReportRequest {
  user_id?: string;
  timeframe?: 'week' | 'month';
  scheduled?: boolean;
}

// Helper to get current day of week (0 = Sunday, 1 = Monday, etc.)
function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

// Helper to log email send attempts
async function logEmailAttempt(
  supabase: any,
  userId: string,
  email: string,
  reportType: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  try {
    await supabase.from('email_logs').insert({
      user_id: userId,
      email,
      report_type: reportType,
      status,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Error logging email attempt:', error);
  }
}

// Helper to send email with retry logic
async function sendEmailWithRetry(
  email: string,
  subject: string,
  html: string,
  maxRetries = 3
): Promise<{ success: boolean; error?: string; id?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Sending email to ${email} (attempt ${attempt}/${maxRetries})`);
      
      const response = await resend.emails.send({
        from: 'Real Estate Analyzer <onboarding@resend.dev>',
        to: [email],
        subject,
        html,
      });

      if (response.error) {
        throw response.error;
      }

      console.log(`Email sent successfully to ${email}:`, response.data);
      return { success: true, id: response.data?.id };
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed for ${email}:`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request data
    const { user_id, timeframe = 'week', scheduled = false } = await req.json() as EmailReportRequest;
    
    const currentDay = getCurrentDayOfWeek();
    console.log(`Report generation started - Scheduled: ${scheduled}, User: ${user_id || 'all'}, Day: ${currentDay}, Timeframe: ${timeframe}`);

    // Determine which users to email
    let usersToEmail: any[] = [];
    
    if (user_id) {
      // Single user - get their email from preferences or profile
      const { data: prefs } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();
      
      let emailToUse = prefs?.email;
      
      // If no preferences, fall back to profile email
      if (!emailToUse) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user_id)
          .maybeSingle();
        
        emailToUse = profile?.email;
        
        if (!emailToUse) {
          throw new Error('User email not found in preferences or profile');
        }
      }
      
      usersToEmail = [{ user_id, email: emailToUse, weekly_report_enabled: true, weekly_report_day: 0 }];
      console.log(`Manual send for user: ${user_id}, email: ${emailToUse}`);
    } else if (scheduled) {
      // Automated send - filter by day and enabled status
      const { data: preferences, error: prefError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('weekly_report_enabled', true)
        .eq('weekly_report_day', currentDay);
      
      if (prefError) throw prefError;
      if (!preferences || preferences.length === 0) {
        console.log(`No users scheduled for reports on day ${currentDay}`);
        return new Response(
          JSON.stringify({ message: `No users scheduled for reports on day ${currentDay}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      usersToEmail = preferences;
      console.log(`Scheduled send for ${preferences.length} users on day ${currentDay}`);
    } else {
      // Manual send for all users with weekly reports enabled
      const { data: preferences, error: prefError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('weekly_report_enabled', true);
      
      if (prefError) throw prefError;
      if (!preferences || preferences.length === 0) {
        console.log('No users with weekly reports enabled');
        return new Response(
          JSON.stringify({ message: 'No users with weekly reports enabled' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      usersToEmail = preferences;
      console.log(`Manual send for ${preferences.length} users`);
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const endDate = now;

    const emailResults = [];
    const reportType = scheduled ? 'weekly_scheduled' : 'manual';
    
    // Send email to each user
    for (const userInfo of usersToEmail) {
      try {
        // Fetch metrics for the user
        const { data: metrics, error: metricsError } = await supabase
          .from('daily_metrics')
          .select('*')
          .eq('user_id', userInfo.user_id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);
        
        if (metricsError) {
          console.error(`Error fetching metrics for ${userInfo.user_id}:`, metricsError);
          throw metricsError;
        }
        
        if (!metrics || metrics.length === 0) {
          console.log(`No metrics found for user ${userInfo.user_id}`);
          // Log skipped
          await logEmailAttempt(
            supabase,
            userInfo.user_id,
            userInfo.email,
            reportType,
            'failed',
            'No metrics data available'
          );
          emailResults.push({ email: userInfo.email, success: false, error: 'No metrics data' });
          continue;
        }

        // Calculate totals
        const totals = metrics.reduce((acc, day) => ({
          calls_made: acc.calls_made + (day.calls_made || 0),
          contacts_reached: acc.contacts_reached + (day.contacts_reached || 0),
          appointments_set: acc.appointments_set + (day.appointments_set || 0),
          appointments_attended: acc.appointments_attended + (day.appointments_attended || 0),
          listings_taken: acc.listings_taken + (day.listings_taken || 0),
          buyers_signed: acc.buyers_signed + (day.buyers_signed || 0),
          closed_deals: acc.closed_deals + (day.closed_deals || 0),
          volume_closed: acc.volume_closed + (day.volume_closed || 0),
        }), {
          calls_made: 0,
          contacts_reached: 0,
          appointments_set: 0,
          appointments_attended: 0,
          listings_taken: 0,
          buyers_signed: 0,
          closed_deals: 0,
          volume_closed: 0,
        });

        // Calculate conversion rates
        const contactRate = totals.calls_made > 0 
          ? ((totals.contacts_reached / totals.calls_made) * 100).toFixed(1) 
          : '0.0';
        const apptRate = totals.contacts_reached > 0
          ? ((totals.appointments_set / totals.contacts_reached) * 100).toFixed(1)
          : '0.0';

        // Generate HTML email
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${timeframe === 'week' ? 'Weekly' : 'Monthly'} Real Estate Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
    .metric-card { background: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: bold; color: #333; margin: 5px 0; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-title { font-size: 18px; font-weight: 600; color: #333; margin: 25px 0 15px 0; }
    .conversion-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 10px; }
    .conversion-label { color: #666; font-size: 14px; }
    .conversion-value { font-weight: 600; color: #667eea; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your ${timeframe === 'week' ? 'Weekly' : 'Monthly'} Performance Report</h1>
      <p>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
    </div>
    
    <div class="content">
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Calls Made</div>
          <div class="metric-value">${totals.calls_made}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Contacts Reached</div>
          <div class="metric-value">${totals.contacts_reached}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Appointments Set</div>
          <div class="metric-value">${totals.appointments_set}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Appointments Attended</div>
          <div class="metric-value">${totals.appointments_attended}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Listings Taken</div>
          <div class="metric-value">${totals.listings_taken}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Buyers Signed</div>
          <div class="metric-value">${totals.buyers_signed}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Closed Deals</div>
          <div class="metric-value">${totals.closed_deals}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Volume Closed</div>
          <div class="metric-value">$${totals.volume_closed.toLocaleString()}</div>
        </div>
      </div>

      <h2 class="section-title">📈 Conversion Rates</h2>
      <div class="conversion-row">
        <span class="conversion-label">Calls → Contacts</span>
        <span class="conversion-value">${contactRate}%</span>
      </div>
      <div class="conversion-row">
        <span class="conversion-label">Contacts → Appointments</span>
        <span class="conversion-value">${apptRate}%</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Keep up the great work! 🎯</p>
    </div>
  </div>
</body>
</html>`;

        // Send email with retry logic
        const result = await sendEmailWithRetry(
          userInfo.email,
          `Your ${timeframe === 'week' ? 'Weekly' : 'Monthly'} Real Estate Performance Report`,
          emailHtml
        );

        // Log the attempt
        await logEmailAttempt(
          supabase,
          userInfo.user_id,
          userInfo.email,
          reportType,
          result.success ? 'sent' : 'failed',
          result.error
        );

        emailResults.push({ 
          email: userInfo.email, 
          success: result.success,
          error: result.error,
          id: result.id
        });
      } catch (error: any) {
        console.error(`Failed to send report to ${userInfo.email}:`, error);
        
        // Log the failure
        await logEmailAttempt(
          supabase,
          userInfo.user_id,
          userInfo.email,
          reportType,
          'failed',
          error.message
        );
        
        emailResults.push({ email: userInfo.email, success: false, error: error.message });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.filter(r => !r.success).length;

    console.log(`Report generation completed - Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Email reports processed', 
        results: emailResults,
        total: emailResults.length,
        successful: successCount,
        failed: failureCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-email-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
