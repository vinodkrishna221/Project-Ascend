import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemHealthCheck {
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  threshold_warning?: number;
  threshold_critical?: number;
  status: string;
  details?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Perform various health checks
    const healthChecks: SystemHealthCheck[] = [];

    // 1. Database connectivity check
    const dbStartTime = Date.now();
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStartTime;
      
      healthChecks.push({
        metric_name: 'database_response_time',
        metric_value: dbResponseTime,
        metric_unit: 'ms',
        threshold_warning: 1000,
        threshold_critical: 3000,
        status: dbError ? 'critical' : (dbResponseTime > 1000 ? 'warning' : 'normal'),
        details: dbError ? { error: dbError.message } : null
      });

      healthChecks.push({
        metric_name: 'database_connectivity',
        metric_value: dbError ? 0 : 1,
        metric_unit: 'boolean',
        threshold_critical: 1,
        status: dbError ? 'critical' : 'normal',
        details: dbError ? { error: dbError.message } : null
      });
    } catch (error) {
      healthChecks.push({
        metric_name: 'database_connectivity',
        metric_value: 0,
        metric_unit: 'boolean',
        threshold_critical: 1,
        status: 'critical',
        details: { error: error.message }
      });
    }

    // 2. Authentication service health
    try {
      const { data: authData, error: authError } = await supabase
        .rpc('calculate_success_rate', {
          p_metric_type: 'authentication',
          p_time_window_hours: 1
        });

      if (!authError && authData && authData[0]) {
        const successRate = Number(authData[0].success_rate);
        healthChecks.push({
          metric_name: 'auth_success_rate_1h',
          metric_value: successRate,
          metric_unit: 'percentage',
          threshold_warning: 85,
          threshold_critical: 70,
          status: successRate < 70 ? 'critical' : (successRate < 85 ? 'warning' : 'normal'),
          details: {
            total_attempts: authData[0].total_attempts,
            successful_attempts: authData[0].successful_attempts
          }
        });
      }
    } catch (error) {
      console.error('Error checking auth health:', error);
    }

    // 3. API performance check
    try {
      const { data: apiData, error: apiError } = await supabase
        .rpc('get_api_performance_summary', {
          p_time_window_hours: 1
        });

      if (!apiError && apiData && apiData.length > 0) {
        const avgResponseTime = apiData.reduce((sum: number, item: any) => 
          sum + Number(item.avg_response_time_ms), 0) / apiData.length;
        
        const avgErrorRate = apiData.reduce((sum: number, item: any) => 
          sum + Number(item.error_rate), 0) / apiData.length;

        healthChecks.push({
          metric_name: 'api_avg_response_time_1h',
          metric_value: avgResponseTime,
          metric_unit: 'ms',
          threshold_warning: 1000,
          threshold_critical: 2000,
          status: avgResponseTime > 2000 ? 'critical' : (avgResponseTime > 1000 ? 'warning' : 'normal'),
          details: { endpoints_checked: apiData.length }
        });

        healthChecks.push({
          metric_name: 'api_error_rate_1h',
          metric_value: avgErrorRate,
          metric_unit: 'percentage',
          threshold_warning: 5,
          threshold_critical: 10,
          status: avgErrorRate > 10 ? 'critical' : (avgErrorRate > 5 ? 'warning' : 'normal'),
          details: { endpoints_checked: apiData.length }
        });
      }
    } catch (error) {
      console.error('Error checking API performance:', error);
    }

    // 4. Storage health check
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });

      healthChecks.push({
        metric_name: 'storage_connectivity',
        metric_value: storageError ? 0 : 1,
        metric_unit: 'boolean',
        threshold_critical: 1,
        status: storageError ? 'critical' : 'normal',
        details: storageError ? { error: storageError.message } : null
      });
    } catch (error) {
      healthChecks.push({
        metric_name: 'storage_connectivity',
        metric_value: 0,
        metric_unit: 'boolean',
        threshold_critical: 1,
        status: 'critical',
        details: { error: error.message }
      });
    }

    // 5. System uptime calculation (simplified)
    const uptimePercentage = healthChecks.filter(check => 
      check.status !== 'critical').length / healthChecks.length * 100;

    healthChecks.push({
      metric_name: 'system_uptime',
      metric_value: uptimePercentage,
      metric_unit: 'percentage',
      threshold_warning: 95,
      threshold_critical: 90,
      status: uptimePercentage < 90 ? 'critical' : (uptimePercentage < 95 ? 'warning' : 'normal'),
      details: {
        total_checks: healthChecks.length,
        healthy_checks: healthChecks.filter(check => check.status === 'normal').length
      }
    });

    // Insert health metrics into database
    const { error: insertError } = await supabase
      .from('system_health_metrics')
      .insert(healthChecks);

    if (insertError) {
      console.error('Error inserting health metrics:', insertError);
    }

    // Run alert checking
    const { error: alertError } = await supabase.rpc('check_system_health');
    if (alertError) {
      console.error('Error checking system health alerts:', alertError);
    }

    // Return health status
    const overallStatus = healthChecks.some(check => check.status === 'critical') 
      ? 'critical' 
      : healthChecks.some(check => check.status === 'warning') 
        ? 'warning' 
        : 'healthy';

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          overall_status: overallStatus,
          checks: healthChecks,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('System health monitor error:', error);
    
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