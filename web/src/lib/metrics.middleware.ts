import { NextApiRequest, NextApiResponse } from 'next';
import { metricsService } from './metrics.service';

export interface MetricsMiddlewareOptions {
  trackPerformance?: boolean;
  trackErrors?: boolean;
  excludeEndpoints?: string[];
}

export function withMetrics(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: MetricsMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const {
      trackPerformance = true,
      trackErrors = true,
      excludeEndpoints = []
    } = options;

    const startTime = Date.now();
    const endpoint = req.url || 'unknown';
    const method = req.method || 'GET';

    // Skip tracking for excluded endpoints
    if (excludeEndpoints.some(excluded => endpoint.includes(excluded))) {
      return handler(req, res);
    }

    // Override res.end to capture response details
    const originalEnd = res.end;
    let responseSize = 0;

    res.end = function(chunk?: any, encoding?: any) {
      if (chunk) {
        responseSize = Buffer.byteLength(chunk, encoding);
      }
      return originalEnd.call(this, chunk, encoding);
    };

    try {
      await handler(req, res);
    } catch (error) {
      // Track error if enabled
      if (trackErrors) {
        console.error(`API Error on ${method} ${endpoint}:`, error);
      }
      throw error;
    } finally {
      // Track performance metrics if enabled
      if (trackPerformance) {
        const responseTime = Date.now() - startTime;
        const requestSize = req.headers['content-length'] 
          ? parseInt(req.headers['content-length'] as string, 10) 
          : 0;

        // Extract user ID from request if available
        let userId: string | undefined;
        try {
          // Try to get user from various sources
          if (req.body?.user_id) {
            userId = req.body.user_id;
          } else if (req.query?.user_id) {
            userId = req.query.user_id as string;
          }
          // Could also extract from JWT token if needed
        } catch {
          // Ignore errors getting user ID
        }

        // Track the API performance
        metricsService.trackAPIPerformance({
          endpoint,
          method,
          response_time_ms: responseTime,
          status_code: res.statusCode,
          user_id: userId || null,
          request_size_bytes: requestSize,
          response_size_bytes: responseSize
        }).catch(error => {
          console.error('Failed to track API performance:', error);
        });
      }
    }
  };
}

// Helper function to track authentication attempts
export async function trackAuthAttempt(
  metricType: string,
  verificationMethod: 'email' | 'college_database' | 'manual',
  success: boolean,
  responseTimeMs: number,
  userId?: string,
  collegeId?: string,
  errorCode?: string,
  errorMessage?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await metricsService.trackAuthAttempt({
      metric_type: metricType,
      verification_method: verificationMethod,
      success,
      response_time_ms: responseTimeMs,
      user_id: userId || null,
      college_id: collegeId || null,
      error_code: errorCode || null,
      error_message: errorMessage || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    });
  } catch (error) {
    console.error('Failed to track auth attempt:', error);
  }
}

// Helper function to track onboarding steps
export async function trackOnboardingStep(
  userId: string,
  step: string,
  action: string,
  success: boolean,
  timeSpentSeconds?: number,
  errorDetails?: any,
  deviceInfo?: any
) {
  try {
    await metricsService.trackOnboardingStep({
      user_id: userId,
      step,
      action,
      success,
      time_spent_seconds: timeSpentSeconds || null,
      error_details: errorDetails || null,
      device_info: deviceInfo || null
    });
  } catch (error) {
    console.error('Failed to track onboarding step:', error);
  }
}

// Helper function to record system health metrics
export async function recordSystemHealth(
  metricName: string,
  metricValue: number,
  metricUnit?: string,
  thresholdWarning?: number,
  thresholdCritical?: number,
  status?: string,
  details?: any
) {
  try {
    await metricsService.recordSystemHealth({
      metric_name: metricName,
      metric_value: metricValue,
      metric_unit: metricUnit || null,
      threshold_warning: thresholdWarning || null,
      threshold_critical: thresholdCritical || null,
      status: status || 'normal',
      details: details || null
    });
  } catch (error) {
    console.error('Failed to record system health:', error);
  }
}