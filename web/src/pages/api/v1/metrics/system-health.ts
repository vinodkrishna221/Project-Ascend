import { NextApiRequest, NextApiResponse } from 'next';
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

    const systemHealth = await metricsService.getSystemHealthStatus();

    res.status(200).json({
      success: true,
      data: systemHealth,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting system health status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve system health status'
      }
    });
  }
}

export default withMetrics(authMiddleware(handler));