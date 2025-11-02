import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  user_id: string;
  timeframe?: 'week' | 'month';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const { user_id, timeframe = 'week' } = await req.json() as ReportRequest;

    console.log(`Generating report data for user ${user_id}, timeframe: ${timeframe}`);

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const endDate = now;

    // Fetch metrics for the user
    const { data: metrics, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      throw metricsError;
    }

    if (!metrics || metrics.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No metrics data available for the selected timeframe',
          hasData: false 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

    console.log(`Report data generated successfully for user ${user_id}`);

    return new Response(
      JSON.stringify({
        hasData: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totals,
        contactRate,
        apptRate,
        timeframe,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-report-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
