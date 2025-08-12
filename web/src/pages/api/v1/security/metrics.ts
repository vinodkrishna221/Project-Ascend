/**
 * Security Metrics API Endpoint
 * 
 * Provides security metrics and dashboard data for administrators
 * GET: Retrieve security metrics and statistics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../lib/auth.middleware';
import { securityMonitoringService } from '../../../../lib/security-monitoring.service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { user } = req as any;

  // Check if user is platform admin
  if (user.role !== 'platform_admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only platform administrators can access security metrics'
      }
    });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGetMetrics(req, res, query);
      
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Security metrics API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetMetrics(
  req: NextApiRequest,
  res: NextApiResponse,
  query: any
) {
  try {
    // Parse time window (default to 24 hours)
    const timeWindow = query.timeWindow ? parseInt(query.timeWindow as string) : 24 * 60 * 60 * 1000;
    const includeDetails = query.includeDetails === 'true';

    // Get security metrics
    const metrics = await securityMonitoringService.getSecurityMetrics(timeWindow);

    // Add additional computed metrics
    const enhancedMetrics = {
      ...metrics,
      computed: {
        averageEventsPerHour: Math.round(metrics.totalEvents / (timeWindow / (60 * 60 * 1000))),
        alertRate: metrics.totalEvents > 0 ? (metrics.totalAlerts / metrics.totalEvents * 100).toFixed(2) : '0.00',
        criticalAlertPercentage: metrics.totalAlerts > 0 ? 
          ((metrics.alertsBySeverity.critical || 0) / metrics.totalAlerts * 100).toFixed(2) : '0.00',
        topEventTypes: Object.entries(metrics.eventsByType)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
        securityScore: calculateSecurityScore(metrics)
      },
      timeRange: {
        from: new Date(Date.now() - timeWindow).toISOString(),
        to: new Date().toISOString(),
        windowHours: Math.round(timeWindow / (60 * 60 * 1000))
      }
    };

    // Add detailed breakdown if requested
    if (includeDetails) {
      enhancedMetrics.details = {
        eventTypeBreakdown: metrics.eventsByType,
        severityBreakdown: {
          events: metrics.eventsBySeverity,
          alerts: metrics.alertsBySeverity
        },
        trends: await calculateSecurityTrends(timeWindow)
      };
    }

    return res.status(200).json({
      success: true,
      data: enhancedMetrics
    });
  } catch (error) {
    console.error('Get security metrics error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch security metrics'
      }
    });
  }
}

/**
 * Calculate overall security score (0-100)
 */
function calculateSecurityScore(metrics: any): number {
  let score = 100;

  // Deduct points for critical alerts
  const criticalAlerts = metrics.alertsBySeverity.critical || 0;
  score -= criticalAlerts * 20;

  // Deduct points for high severity alerts
  const highAlerts = metrics.alertsBySeverity.high || 0;
  score -= highAlerts * 10;

  // Deduct points for medium severity alerts
  const mediumAlerts = metrics.alertsBySeverity.medium || 0;
  score -= mediumAlerts * 5;

  // Deduct points for unacknowledged alerts
  score -= metrics.unacknowledgedAlerts * 3;

  // Deduct points for high event volume
  if (metrics.totalEvents > 1000) {
    score -= Math.min(20, (metrics.totalEvents - 1000) / 100);
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate security trends over time
 */
async function calculateSecurityTrends(timeWindow: number): Promise<any> {
  try {
    // This would typically involve more complex queries to get historical data
    // For now, return a simplified trend calculation
    
    const currentMetrics = await securityMonitoringService.getSecurityMetrics(timeWindow);
    const previousMetrics = await securityMonitoringService.getSecurityMetrics(timeWindow * 2);

    const currentPeriodEvents = currentMetrics.totalEvents;
    const previousPeriodEvents = previousMetrics.totalEvents - currentMetrics.totalEvents;

    const eventTrend = previousPeriodEvents > 0 ? 
      ((currentPeriodEvents - previousPeriodEvents) / previousPeriodEvents * 100).toFixed(2) : '0.00';

    const currentPeriodAlerts = currentMetrics.totalAlerts;
    const previousPeriodAlerts = previousMetrics.totalAlerts - currentMetrics.totalAlerts;

    const alertTrend = previousPeriodAlerts > 0 ? 
      ((currentPeriodAlerts - previousPeriodAlerts) / previousPeriodAlerts * 100).toFixed(2) : '0.00';

    return {
      events: {
        current: currentPeriodEvents,
        previous: previousPeriodEvents,
        trend: eventTrend,
        direction: parseFloat(eventTrend) > 0 ? 'up' : parseFloat(eventTrend) < 0 ? 'down' : 'stable'
      },
      alerts: {
        current: currentPeriodAlerts,
        previous: previousPeriodAlerts,
        trend: alertTrend,
        direction: parseFloat(alertTrend) > 0 ? 'up' : parseFloat(alertTrend) < 0 ? 'down' : 'stable'
      }
    };
  } catch (error) {
    console.error('Failed to calculate security trends:', error);
    return {
      events: { current: 0, previous: 0, trend: '0.00', direction: 'stable' },
      alerts: { current: 0, previous: 0, trend: '0.00', direction: 'stable' }
    };
  }
}

export default authMiddleware(handler);