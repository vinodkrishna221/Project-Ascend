import { NextApiRequest, NextApiResponse } from 'next';
import { analyticsService } from '../../../../lib/analytics.service';
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
    
    if (timeWindowHours < 1 || timeWindowHours > 168) { // Max 1 week for performance data
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIME_WINDOW',
          message: 'Time window must be between 1 and 168 hours'
        }
      });
    }

    const systemPerformance = await analyticsService.getSystemPerformanceReport(timeWindowHours);

    res.status(200).json({
      success: true,
      data: systemPerformance,
      meta: {
        timeWindowHours,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting system performance report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve system performance report'
      }
    });
  }
}

export default withMetrics(authMiddleware(handler));