/**
 * Consent Management API Endpoint
 * 
 * Handles user consent management for GDPR compliance
 * GET: Retrieve user's consent history
 * POST: Update consent for specific categories
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../lib/auth.middleware';
import { privacyService } from '../../../../lib/privacy.service';
import { validateRequestBody } from '../../../../lib/validation';

interface ConsentRequest {
  consentType: 'essential_functionality' | 'analytics_and_performance' | 'marketing_communications' | 'research_participation' | 'recruiter_visibility';
  granted: boolean;
  legalBasis: string;
}

const consentSchema = {
  type: 'object',
  properties: {
    consentType: {
      type: 'string',
      enum: [
        'essential_functionality',
        'analytics_and_performance', 
        'marketing_communications',
        'research_participation',
        'recruiter_visibility'
      ]
    },
    granted: { type: 'boolean' },
    legalBasis: { 
      type: 'string',
      minLength: 1,
      maxLength: 500
    }
  },
  required: ['consentType', 'granted', 'legalBasis'],
  additionalProperties: false
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { user } = req as any;

  try {
    switch (method) {
      case 'GET':
        return await handleGetConsents(req, res, user.id);
      
      case 'POST':
        return await handleUpdateConsent(req, res, user.id);
      
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
    console.error('Consent API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetConsents(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const consents = await privacyService.getUserConsents(userId);
    
    // Group consents by type and get the latest for each
    const latestConsents = consents.reduce((acc: any, consent: any) => {
      if (!acc[consent.consent_type] || 
          new Date(consent.created_at) > new Date(acc[consent.consent_type].created_at)) {
        acc[consent.consent_type] = consent;
      }
      return acc;
    }, {} as Record<string, any>);

    return res.status(200).json({
      success: true,
      data: {
        consents: Object.values(latestConsents),
        history: consents
      }
    });
  } catch (error) {
    console.error('Get consents error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch consent information'
      }
    });
  }
}

async function handleUpdateConsent(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Validate request body
    const validation = validateRequestBody(req.body, consentSchema);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid consent data',
          details: validation.errors
        }
      });
    }

    const consentRequest: ConsentRequest = req.body;
    
    // Essential functionality consent cannot be withdrawn
    if (consentRequest.consentType === 'essential_functionality' && !consentRequest.granted) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ESSENTIAL_CONSENT_REQUIRED',
          message: 'Essential functionality consent cannot be withdrawn as it is required for platform operation'
        }
      });
    }
    
    const result = await privacyService.updateConsent(userId, consentRequest);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: result.error || 'Failed to update consent'
        }
      });
    }

    // Fetch updated consents
    const updatedConsents = await privacyService.getUserConsents(userId);

    return res.status(200).json({
      success: true,
      data: updatedConsents,
      message: `Consent ${consentRequest.granted ? 'granted' : 'withdrawn'} successfully`
    });
  } catch (error) {
    console.error('Update consent error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update consent'
      }
    });
  }
}

export default authMiddleware(handler);