/**
 * Security Alerts API Endpoint
 * 
 * Handles security alerts management for administrators
 * GET: Retrieve security alerts
 * PATCH: Acknowledge security alerts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../lib/auth.middleware';
import { securityMonitoringService } from '../../../../lib/security-monitoring.service';
import { validateRequestBody } from '../../../../lib/validation';

interface AcknowledgeAlertRequest {
  alertId: string;
}

const acknowledgeAlertSchema = {
  type: 'object',
  properties: {
    alertId: {
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['alertId'],
  additionalProperties: false
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { user } = req as any;

  // Check if user is platform admin
  if (user.role !== 'platform_admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only platform administrators can access security alerts'
      }
    });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGetAlerts(req, res, query);
      
      case 'PATCH':
        return await handleAcknowledgeAlert(req, res, user.id);
      
      default:
        res.setHeader('Allow', ['GET', 'PATCH']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Security alerts API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetAlerts(
  req: NextApiRequest,
  res: NextApiResponse,
  query: any
) {
  try {
    const severity = query.severity as 'low' | 'medium' | 'high' | 'critical' | undefined;
    const limit = parseInt(query.limit as string) || 50;
    const acknowledged = query.acknowledged === 'true' ? true : 
                       query.acknowledged === 'false' ? false : undefined;

    const alerts = await securityMonitoringService.getSecurityAlerts(severity, limit);
    
    // Filter by acknowledged status if specified
    const filteredAlerts = acknowledged !== undefined ? 
      alerts.filter((alert: any) => alert.acknowledged === acknowledged) : 
      alerts;

    return res.status(200).json({
      success: true,
      data: {
        alerts: filteredAlerts,
        summary: {
          total: filteredAlerts.length,
          unacknowledged: filteredAlerts.filter((a: any) => !a.acknowledged).length,
          bySeverity: {
            critical: filteredAlerts.filter((a: any) => a.severity === 'critical').length,
            high: filteredAlerts.filter((a: any) => a.severity === 'high').length,
            medium: filteredAlerts.filter((a: any) => a.severity === 'medium').length,
            low: filteredAlerts.filter((a: any) => a.severity === 'low').length
          }
        }
      }
    });
  } catch (error) {
    console.error('Get security alerts error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch security alerts'
      }
    });
  }
}

async function handleAcknowledgeAlert(
  req: NextApiRequest,
  res: NextApiResponse,
  adminUserId: string
) {
  try {
    // Validate request body
    const validation = validateRequestBody(req.body, acknowledgeAlertSchema);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid alert acknowledgment data',
          details: validation.errors
        }
      });
    }

    const { alertId }: AcknowledgeAlertRequest = req.body;
    
    const success = await securityMonitoringService.acknowledgeAlert(alertId, adminUserId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ACKNOWLEDGMENT_ERROR',
          message: 'Failed to acknowledge security alert'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Security alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ACKNOWLEDGMENT_ERROR',
        message: 'Failed to acknowledge security alert'
      }
    });
  }
}

export default authMiddleware(handler);