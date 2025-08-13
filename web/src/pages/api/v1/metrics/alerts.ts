import { NextApiRequest, NextApiResponse } from 'next';
import { metricsService } from '../../../../lib/metrics.service';
import { withMetrics } from '../../../../lib/metrics.middleware';
import { authMiddleware } from '../../../../lib/auth.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    switch (req.method) {
      case 'GET':
        const alerts = await metricsService.getActiveAlerts();
        return res.status(200).json({
          success: true,
          data: alerts,
          meta: {
            timestamp: new Date().toISOString()
          }
        });

      case 'PATCH':
        const { alertId, action } = req.body;
        
        if (!alertId || !action) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_REQUIRED_FIELDS',
              message: 'alertId and action are required'
            }
          });
        }

        if (action === 'acknowledge') {
          await metricsService.acknowledgeAlert(alertId, user.id);
        } else if (action === 'resolve') {
          await metricsService.resolveAlert(alertId);
        } else {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Action must be "acknowledge" or "resolve"'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: { message: `Alert ${action}d successfully` },
          meta: {
            timestamp: new Date().toISOString()
          }
        });

      default:
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Only GET and PATCH methods are allowed'
          }
        });
    }
  } catch (error) {
    console.error('Error handling alerts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to handle alerts'
      }
    });
  }
}

export default withMetrics(authMiddleware(handler));