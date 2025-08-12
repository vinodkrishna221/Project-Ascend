/**
 * Privacy Settings API Endpoint
 * 
 * Handles user privacy settings management
 * GET: Retrieve current privacy settings
 * PUT: Update privacy settings
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../lib/auth.middleware';
import { privacyService } from '../../../../lib/privacy.service';
import { validateRequestBody } from '../../../../lib/validation';

interface PrivacySettingsRequest {
  profileVisibility?: 'public' | 'students_only' | 'communities_only';
  allowMessages?: boolean;
  allowCollaborationRequests?: boolean;
  allowSkillEndorsements?: boolean;
  allowRecruiterContact?: boolean;
  analyticsParticipation?: boolean;
  researchParticipation?: boolean;
  featureImprovement?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingCommunications?: boolean;
}

const privacySettingsSchema = {
  type: 'object',
  properties: {
    profileVisibility: {
      type: 'string',
      enum: ['public', 'students_only', 'communities_only']
    },
    allowMessages: { type: 'boolean' },
    allowCollaborationRequests: { type: 'boolean' },
    allowSkillEndorsements: { type: 'boolean' },
    allowRecruiterContact: { type: 'boolean' },
    analyticsParticipation: { type: 'boolean' },
    researchParticipation: { type: 'boolean' },
    featureImprovement: { type: 'boolean' },
    emailNotifications: { type: 'boolean' },
    pushNotifications: { type: 'boolean' },
    marketingCommunications: { type: 'boolean' }
  },
  additionalProperties: false
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { user } = req as any;

  try {
    switch (method) {
      case 'GET':
        return await handleGetSettings(req, res, user.id);
      
      case 'PUT':
        return await handleUpdateSettings(req, res, user.id);
      
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Privacy settings API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetSettings(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const settings = await privacyService.getPrivacySettings(userId);
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Privacy settings not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch privacy settings'
      }
    });
  }
}

async function handleUpdateSettings(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Validate request body
    const validation = validateRequestBody(req.body, privacySettingsSchema);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid privacy settings data',
          details: validation.errors
        }
      });
    }

    const settings: PrivacySettingsRequest = req.body;
    
    const result = await privacyService.updatePrivacySettings(userId, settings);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: result.error || 'Failed to update privacy settings'
        }
      });
    }

    // Fetch updated settings
    const updatedSettings = await privacyService.getPrivacySettings(userId);

    return res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update privacy settings'
      }
    });
  }
}

export default authMiddleware(handler);