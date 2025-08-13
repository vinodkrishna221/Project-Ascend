import { NextApiRequest, NextApiResponse } from 'next';
import { analyticsService } from '../../../../lib/analytics.service';
import { metricsService } from '../../../../lib/metrics.service';
import { withMetrics } from '../../../../lib/metrics.middleware';
import { authMiddleware } from '../../../../lib/auth.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed'
      }
    });
  }

  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user || user.role !== 'platform_admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required'
        }
      });
    }

    const timeWindowHours = parseInt(req.query.timeWindow as string) || 24; // Default 24 hours
    
    if (timeWindowHours < 1 || timeWindowHours > 168) { // Max 1 week for dashboard
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIME_WINDOW',
          message: 'Time window must be between 1 and 168 hours'
        }
      });
    }

    // Fetch all dashboard data in parallel
    const [
      authSuccessRates,
      apiPerformance,
      onboardingFunnel,
      systemHealth,
      activeAlerts,
      verificationPatterns,
      userSatisfaction
    ] = await Promise.all([
      metricsService.getAuthSuccessRates(timeWindowHours),
      metricsService.getAPIPerformanceSummary(timeWindowHours),
      metricsService.getOnboardingFunnelMetrics(timeWindowHours),
      metricsService.getSystemHealthStatus(),
      metricsService.getActiveAlerts(),
      analyticsService.getVerificationPatternAnalysis(timeWindowHours),
      analyticsService.getUserSatisfactionMetrics(timeWindowHours)
    ]);

    // Calculate key performance indicators
    const kpis = {
      overall_success_rate: authSuccessRates.overall.success_rate,
      avg_response_time: apiPerformance.length > 0 
        ? apiPerformance.reduce((sum, api) => sum + api.avg_response_time_ms, 0) / apiPerformance.length 
        : 0,
      onboarding_completion_rate: onboardingFunnel.overall_completion_rate,
      system_uptime: systemHealth.overall_status === 'healthy' ? 100 : 
                    systemHealth.overall_status === 'warning' ? 95 : 85,
      active_alerts_count: activeAlerts.length,
      critical_alerts_count: activeAlerts.filter(alert => alert.severity === 'critical').length,
      user_satisfaction_score: userSatisfaction.overall_satisfaction.average_rating,
      total_verification_attempts: verificationPatterns.total_verification_attempts
    };

    // Determine overall platform health
    let platformHealth: 'excellent' | 'good' | 'needs_attention' | 'critical' = 'excellent';
    
    if (kpis.critical_alerts_count > 0 || kpis.overall_success_rate < 70 || kpis.system_uptime < 90) {
      platformHealth = 'critical';
    } else if (kpis.active_alerts_count > 5 || kpis.overall_success_rate < 85 || kpis.avg_response_time > 2000) {
      platformHealth = 'needs_attention';
    } else if (kpis.overall_success_rate < 95 || kpis.avg_response_time > 1000 || kpis.onboarding_completion_rate < 80) {
      platformHealth = 'good';
    }

    // Create summary insights
    const insights = [];
    
    if (kpis.overall_success_rate < 90) {
      insights.push({
        type: 'warning',
        title: 'Authentication Success Rate Below Target',
        message: `Current success rate is ${kpis.overall_success_rate.toFixed(1)}%. Target is 90%+.`,
        action: 'Review verification patterns and common error causes'
      });
    }

    if (kpis.avg_response_time > 1000) {
      insights.push({
        type: 'warning',
        title: 'API Response Time Above Threshold',
        message: `Average response time is ${kpis.avg_response_time.toFixed(0)}ms. Target is <1000ms.`,
        action: 'Check slowest endpoints and optimize performance'
      });
    }

    if (kpis.onboarding_completion_rate < 75) {
      insights.push({
        type: 'warning',
        title: 'Low Onboarding Completion Rate',
        message: `Only ${kpis.onboarding_completion_rate.toFixed(1)}% of users complete onboarding.`,
        action: 'Analyze onboarding funnel for improvement opportunities'
      });
    }

    if (kpis.critical_alerts_count === 0 && kpis.overall_success_rate > 95) {
      insights.push({
        type: 'success',
        title: 'System Operating Optimally',
        message: 'All key metrics are within target ranges.',
        action: 'Continue monitoring and maintain current performance'
      });
    }

    const dashboardData = {
      platform_health: platformHealth,
      kpis,
      insights,
      metrics: {
        authentication: {
          success_rates: authSuccessRates,
          verification_patterns: {
            total_attempts: verificationPatterns.total_verification_attempts,
            email_success_rate: verificationPatterns.verification_methods.email.success_rate,
            database_success_rate: verificationPatterns.verification_methods.college_database.success_rate,
            peak_hours: verificationPatterns.verification_methods.email.peak_hours,
            suspicious_patterns: verificationPatterns.suspicious_patterns
          }
        },
        performance: {
          api_summary: apiPerformance.slice(0, 10), // Top 10 endpoints
          system_health: systemHealth,
          avg_response_time: kpis.avg_response_time
        },
        user_experience: {
          onboarding_funnel: onboardingFunnel,
          satisfaction_score: userSatisfaction.overall_satisfaction.average_rating,
          completion_rate: onboardingFunnel.overall_completion_rate
        },
        alerts: {
          active_count: activeAlerts.length,
          critical_count: kpis.critical_alerts_count,
          recent_alerts: activeAlerts.slice(0, 5) // 5 most recent
        }
      },
      trends: {
        // These would be calculated from historical data
        success_rate_trend: 'stable', // 'improving' | 'declining' | 'stable'
        response_time_trend: 'improving',
        user_satisfaction_trend: 'stable',
        alert_frequency_trend: 'declining'
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      meta: {
        timeWindowHours,
        timestamp: new Date().toISOString(),
        generated_in_ms: Date.now() - parseInt(req.headers['x-request-start'] as string || '0')
      }
    });
  } catch (error) {
    console.error('Error generating analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate analytics dashboard'
      }
    });
  }
}

export default withMetrics(authMiddleware(handler));