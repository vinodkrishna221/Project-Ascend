import { supabase } from './supabase';
import { Database } from './database.types';

type AuthMetric = Database['public']['Tables']['auth_metrics']['Insert'];
type APIMetric = Database['public']['Tables']['api_performance_metrics']['Insert'];
type OnboardingMetric = Database['public']['Tables']['onboarding_metrics']['Insert'];
type SystemHealthMetric = Database['public']['Tables']['system_health_metrics']['Insert'];

export interface MetricsServiceInterface {
  trackAuthAttempt(metric: Omit<AuthMetric, 'id' | 'created_at'>): Promise<void>;
  trackAPIPerformance(metric: Omit<APIMetric, 'id' | 'created_at'>): Promise<void>;
  trackOnboardingStep(metric: Omit<OnboardingMetric, 'id' | 'created_at'>): Promise<void>;
  recordSystemHealth(metric: Omit<SystemHealthMetric, 'id' | 'created_at'>): Promise<void>;
  getAuthSuccessRates(timeWindowHours?: number): Promise<AuthSuccessRates>;
  getAPIPerformanceSummary(timeWindowHours?: number): Promise<APIPerformanceSummary[]>;
  getOnboardingFunnelMetrics(timeWindowHours?: number): Promise<OnboardingFunnelMetrics>;
  getSystemHealthStatus(): Promise<SystemHealthStatus>;
  getActiveAlerts(): Promise<ActiveAlert[]>;
  acknowledgeAlert(alertId: string, userId: string): Promise<void>;
  resolveAlert(alertId: string): Promise<void>;
}

export interface AuthSuccessRates {
  email_verification: {
    total_attempts: number;
    successful_attempts: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
  database_verification: {
    total_attempts: number;
    successful_attempts: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
  overall: {
    total_attempts: number;
    successful_attempts: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
}

export interface APIPerformanceSummary {
  endpoint: string;
  total_requests: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  error_rate: number;
}

export interface OnboardingFunnelMetrics {
  steps: {
    [stepName: string]: {
      started: number;
      completed: number;
      completion_rate: number;
      avg_time_spent_seconds: number;
      common_errors: string[];
    };
  };
  overall_completion_rate: number;
  avg_total_time_minutes: number;
}

export interface SystemHealthStatus {
  overall_status: 'healthy' | 'warning' | 'critical';
  metrics: {
    [metricName: string]: {
      value: number;
      status: 'normal' | 'warning' | 'critical';
      threshold_warning?: number;
      threshold_critical?: number;
      last_updated: string;
    };
  };
}

export interface ActiveAlert {
  id: string;
  alert_name: string;
  severity: 'warning' | 'critical';
  message: string;
  metric_value: number;
  threshold_exceeded: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

class MetricsService implements MetricsServiceInterface {
  async trackAuthAttempt(metric: Omit<AuthMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('auth_metrics')
        .insert(metric);

      if (error) {
        console.error('Failed to track auth attempt:', error);
        // Don't throw error to avoid disrupting auth flow
      }
    } catch (error) {
      console.error('Error tracking auth attempt:', error);
    }
  }

  async trackAPIPerformance(metric: Omit<APIMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_performance_metrics')
        .insert(metric);

      if (error) {
        console.error('Failed to track API performance:', error);
      }
    } catch (error) {
      console.error('Error tracking API performance:', error);
    }
  }

  async trackOnboardingStep(metric: Omit<OnboardingMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('onboarding_metrics')
        .insert(metric);

      if (error) {
        console.error('Failed to track onboarding step:', error);
      }
    } catch (error) {
      console.error('Error tracking onboarding step:', error);
    }
  }

  async recordSystemHealth(metric: Omit<SystemHealthMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_health_metrics')
        .insert(metric);

      if (error) {
        console.error('Failed to record system health:', error);
      }
    } catch (error) {
      console.error('Error recording system health:', error);
    }
  }

  async getAuthSuccessRates(timeWindowHours: number = 24): Promise<AuthSuccessRates> {
    try {
      // Get email verification rates
      const { data: emailRates, error: emailError } = await supabase
        .rpc('calculate_success_rate', {
          p_metric_type: 'email_verification',
          p_verification_method: 'email',
          p_time_window_hours: timeWindowHours
        });

      if (emailError) throw emailError;

      // Get database verification rates
      const { data: dbRates, error: dbError } = await supabase
        .rpc('calculate_success_rate', {
          p_metric_type: 'database_verification',
          p_verification_method: 'college_database',
          p_time_window_hours: timeWindowHours
        });

      if (dbError) throw dbError;

      // Get overall rates
      const { data: overallRates, error: overallError } = await supabase
        .rpc('calculate_success_rate', {
          p_metric_type: 'authentication',
          p_time_window_hours: timeWindowHours
        });

      if (overallError) throw overallError;

      const emailData = emailRates?.[0] || { total_attempts: 0, successful_attempts: 0, success_rate: 0, avg_response_time_ms: 0 };
      const dbData = dbRates?.[0] || { total_attempts: 0, successful_attempts: 0, success_rate: 0, avg_response_time_ms: 0 };
      const overallData = overallRates?.[0] || { total_attempts: 0, successful_attempts: 0, success_rate: 0, avg_response_time_ms: 0 };

      return {
        email_verification: {
          total_attempts: Number(emailData.total_attempts),
          successful_attempts: Number(emailData.successful_attempts),
          success_rate: Number(emailData.success_rate),
          avg_response_time_ms: Number(emailData.avg_response_time_ms)
        },
        database_verification: {
          total_attempts: Number(dbData.total_attempts),
          successful_attempts: Number(dbData.successful_attempts),
          success_rate: Number(dbData.success_rate),
          avg_response_time_ms: Number(dbData.avg_response_time_ms)
        },
        overall: {
          total_attempts: Number(overallData.total_attempts),
          successful_attempts: Number(overallData.successful_attempts),
          success_rate: Number(overallData.success_rate),
          avg_response_time_ms: Number(overallData.avg_response_time_ms)
        }
      };
    } catch (error) {
      console.error('Error getting auth success rates:', error);
      throw error;
    }
  }

  async getAPIPerformanceSummary(timeWindowHours: number = 24): Promise<APIPerformanceSummary[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_api_performance_summary', {
          p_time_window_hours: timeWindowHours
        });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        endpoint: item.endpoint,
        total_requests: Number(item.total_requests),
        avg_response_time_ms: Number(item.avg_response_time_ms),
        p95_response_time_ms: Number(item.p95_response_time_ms),
        error_rate: Number(item.error_rate)
      }));
    } catch (error) {
      console.error('Error getting API performance summary:', error);
      throw error;
    }
  }

  async getOnboardingFunnelMetrics(timeWindowHours: number = 24): Promise<OnboardingFunnelMetrics> {
    try {
      const { data, error } = await supabase
        .from('onboarding_metrics')
        .select('*')
        .gte('created_at', new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const steps: { [stepName: string]: any } = {};
      let totalUsers = 0;
      let completedUsers = 0;
      let totalTimeSpent = 0;

      // Process metrics to build funnel
      const stepCounts: { [step: string]: { started: number; completed: number; timeSpent: number; errors: string[] } } = {};
      
      (data || []).forEach((metric: any) => {
        const step = metric.step;
        if (!stepCounts[step]) {
          stepCounts[step] = { started: 0, completed: 0, timeSpent: 0, errors: [] };
        }

        stepCounts[step].started++;
        if (metric.success) {
          stepCounts[step].completed++;
        } else if (metric.error_details) {
          stepCounts[step].errors.push(metric.error_details.message || 'Unknown error');
        }
        
        if (metric.time_spent_seconds) {
          stepCounts[step].timeSpent += metric.time_spent_seconds;
        }
      });

      // Calculate completion rates and averages
      Object.entries(stepCounts).forEach(([stepName, counts]) => {
        steps[stepName] = {
          started: counts.started,
          completed: counts.completed,
          completion_rate: counts.started > 0 ? (counts.completed / counts.started) * 100 : 0,
          avg_time_spent_seconds: counts.started > 0 ? counts.timeSpent / counts.started : 0,
          common_errors: [...new Set(counts.errors)].slice(0, 5) // Top 5 unique errors
        };
      });

      // Calculate overall metrics
      const userMetrics = new Map();
      (data || []).forEach((metric: any) => {
        if (!userMetrics.has(metric.user_id)) {
          userMetrics.set(metric.user_id, { steps: [], totalTime: 0 });
        }
        const user = userMetrics.get(metric.user_id);
        user.steps.push(metric);
        user.totalTime += metric.time_spent_seconds || 0;
      });

      totalUsers = userMetrics.size;
      userMetrics.forEach((user) => {
        const completedSteps = user.steps.filter((step: any) => step.success).length;
        const requiredSteps = ['welcome', 'email_verification', 'profile_setup'];
        if (completedSteps >= requiredSteps.length) {
          completedUsers++;
        }
        totalTimeSpent += user.totalTime;
      });

      return {
        steps,
        overall_completion_rate: totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
        avg_total_time_minutes: totalUsers > 0 ? (totalTimeSpent / totalUsers) / 60 : 0
      };
    } catch (error) {
      console.error('Error getting onboarding funnel metrics:', error);
      throw error;
    }
  }

  async getSystemHealthStatus(): Promise<SystemHealthStatus> {
    try {
      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const metrics: { [metricName: string]: any } = {};
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

      // Get latest value for each metric
      const latestMetrics = new Map();
      (data || []).forEach((metric: any) => {
        if (!latestMetrics.has(metric.metric_name)) {
          latestMetrics.set(metric.metric_name, metric);
        }
      });

      latestMetrics.forEach((metric) => {
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        
        if (metric.threshold_critical && metric.metric_value <= metric.threshold_critical) {
          status = 'critical';
          overallStatus = 'critical';
        } else if (metric.threshold_warning && metric.metric_value <= metric.threshold_warning) {
          status = 'warning';
          if (overallStatus !== 'critical') {
            overallStatus = 'warning';
          }
        }

        metrics[metric.metric_name] = {
          value: Number(metric.metric_value),
          status,
          threshold_warning: metric.threshold_warning ? Number(metric.threshold_warning) : undefined,
          threshold_critical: metric.threshold_critical ? Number(metric.threshold_critical) : undefined,
          last_updated: metric.created_at
        };
      });

      return {
        overall_status: overallStatus,
        metrics
      };
    } catch (error) {
      console.error('Error getting system health status:', error);
      throw error;
    }
  }

  async getActiveAlerts(): Promise<ActiveAlert[]> {
    try {
      const { data, error } = await supabase
        .from('active_alerts')
        .select(`
          *,
          alert_configurations!inner(alert_name)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((alert: any) => ({
        id: alert.id,
        alert_name: alert.alert_configurations.alert_name,
        severity: alert.severity,
        message: alert.message,
        metric_value: Number(alert.metric_value),
        threshold_exceeded: Number(alert.threshold_exceeded),
        acknowledged: alert.acknowledged,
        acknowledged_by: alert.acknowledged_by,
        acknowledged_at: alert.acknowledged_at,
        created_at: alert.created_at
      }));
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('active_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('active_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }
}

export const metricsService = new MetricsService();