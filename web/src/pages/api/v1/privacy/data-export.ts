/**
 * Data Export API Endpoint
 * 
 * Handles GDPR Article 15 (Right of Access) - Data Export Requests
 * GET: Retrieve user's export requests
 * POST: Request new data export
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../lib/auth.middleware';
import { privacyService } from '../../../../lib/privacy.service';
import { validateRequestBody } from '../../../../lib/validation';

interface DataExportRequest {
  format: 'json' | 'csv';
  includeContent?: boolean;
  includeInteractions?: boolean;
  includeAnalytics?: boolean;
}

const dataExportSchema = {
  type: 'object',
  properties: {
    format: {
      type: 'string',
      enum: ['json', 'csv']
    },
    includeContent: { type: 'boolean' },
    includeInteractions: { type: 'boolean' },
    includeAnalytics: { type: 'boolean' }
  },
  required: ['format'],
  additionalProperties: false
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { user } = req as any;

  try {
    switch (method) {
      case 'GET':
        return await handleGetExportRequests(req, res, user.id);
      
      case 'POST':
        return await handleRequestDataExport(req, res, user.id);
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Data export API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetExportRequests(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const exportRequests = await privacyService.getDataExportRequests(userId);
    
    return res.status(200).json({
      success: true,
      data: exportRequests
    });
  } catch (error) {
    console.error('Get export requests error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch export requests'
      }
    });
  }
}

async function handleRequestDataExport(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Validate request body
    const validation = validateRequestBody(req.body, dataExportSchema);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data export request',
          details: validation.errors
        }
      });
    }

    const exportRequest: DataExportRequest = req.body;
    
    // Check for existing pending requests
    const existingRequests = await privacyService.getDataExportRequests(userId);
    const pendingRequest = existingRequests.find((req: any) => req.status === 'pending' || req.status === 'processing');
    
    if (pendingRequest) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'REQUEST_IN_PROGRESS',
          message: 'A data export request is already in progress',
          details: {
            requestId: pendingRequest.id,
            status: pendingRequest.status,
            requestedAt: pendingRequest.requested_at
          }
        }
      });
    }
    
    const result = await privacyService.requestDataExport(userId, exportRequest);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EXPORT_REQUEST_ERROR',
          message: result.error || 'Failed to request data export'
        }
      });
    }

    return res.status(202).json({
      success: true,
      data: {
        requestId: result.requestId,
        status: 'pending',
        message: 'Data export request submitted successfully. You will be notified when the export is ready.'
      }
    });
  } catch (error) {
    console.error('Request data export error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_REQUEST_ERROR',
        message: 'Failed to request data export'
      }
    });
  }
}

export default authMiddleware(handler);