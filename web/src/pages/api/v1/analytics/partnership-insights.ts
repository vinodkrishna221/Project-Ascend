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

    const timeWindowHours = parseInt(req.query.timeWindow as string) || 720; // Default 30 days
    
    if (timeWindowHours < 24 || timeWindowHours > 8760) { // Min 1 day, Max 1 year
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIME_WINDOW',
          message: 'Time window must be between 24 and 8760 hours'
        }
      });
    }

    const partnershipInsights = await analyticsService.getPartnershipInsights(timeWindowHours);

    res.status(200).json({
      success: true,
      data: partnershipInsights,
      meta: {
        timeWindowHours,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting partnership insights:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve partnership insights'
      }
    });
  }
}

export default withMetrics(authMiddleware(handler));