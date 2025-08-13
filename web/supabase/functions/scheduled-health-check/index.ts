import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled health check...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the system health monitor function
    const healthMonitorUrl = `${supabaseUrl}/functions/v1/system-health-monitor`;
    
    const healthResponse = await fetch(healthMonitorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!healthResponse.ok) {
      throw new Error(`Health monitor failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }

    const healthData = await healthResponse.json();
    console.log('Health check completed:', healthData.data?.overall_status);

    // Check if there are any critical alerts that need immediate attention
    const { data: criticalAlerts, error: alertError } = await supabase
      .from('active_alerts')
      .select('*')
      .eq('severity', 'critical')
      .eq('resolved', false)
      .eq('acknowledged', false);

    if (alertError) {
      console.error('Error checking critical alerts:', alertError);
    }

    // If there are unacknowledged critical alerts, we could send notifications here
    if (criticalAlerts && criticalAlerts.length > 0) {
      console.log(`Found ${criticalAlerts.length} unacknowledged critical alerts`);
      
      // In a real implementation, you would send notifications via:
      // - Email (using a service like SendGrid)
      // - Slack (using webhooks)
      // - PagerDuty (using their API)
      // - SMS (using Twilio)
      
      for (const alert of criticalAlerts) {
        console.log(`Critical Alert: ${alert.message}`);
        
        // Example: Send to webhook (replace with actual notification service)
        try {
          const webhookUrl = Deno.env.get('ALERT_WEBHOOK_URL');
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `🚨 Critical Alert: ${alert.message}`,
                alert_id: alert.id,
                severity: alert.severity,
                timestamp: alert.created_at
              })
            });
          }
        } catch (notificationError) {
          console.error('Failed to send alert notification:', notificationError);
        }
      }
    }

    // Record that the scheduled check ran successfully
    const { error: logError } = await supabase
      .from('system_health_metrics')
      .insert({
        metric_name: 'scheduled_health_check',
        metric_value: 1,
        metric_unit: 'boolean',
        status: 'normal',
        details: {
          checks_performed: healthData.data?.checks?.length || 0,
          overall_status: healthData.data?.overall_status,
          critical_alerts: criticalAlerts?.length || 0
        }
      });

    if (logError) {
      console.error('Error logging health check:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Scheduled health check completed successfully',
          overall_status: healthData.data?.overall_status,
          checks_performed: healthData.data?.checks?.length || 0,
          critical_alerts: criticalAlerts?.length || 0,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Scheduled health check error:', error);
    
    // Try to log the failure
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from('system_health_metrics')
        .insert({
          metric_name: 'scheduled_health_check',
          metric_value: 0,
          metric_unit: 'boolean',
          status: 'critical',
          details: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log health check failure:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error.message
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});