import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../lib/database.types'
import { checkContentAccess } from '../../../../lib/api-protection.middleware'
import { withAuth, AuthenticatedRequest } from '../../../../lib/permission.middleware'

interface ContentAccessRequest {
  contentType: 'post' | 'community' | 'guild'
  contentId: string
}

/**
 * POST /api/v1/content/access-check
 * Check if user can access specific content based on verification status and role
 * Requirements: 6.4, 6.5
 */
async function contentAccessCheckHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    })
  }

  try {
    const { contentType, contentId } = req.body as ContentAccessRequest

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'contentType and contentId are required'
        }
      })
    }

    if (!['post', 'community', 'guild'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'contentType must be one of: post, community, guild'
        }
      })
    }

    // Check content access
    const accessResult = await checkContentAccess(
      req.user!.id,
      contentType,
      contentId
    )

    return res.status(200).json({
      success: true,
      data: {
        userId: req.user!.id,
        userRole: req.user!.role,
        verificationStatus: req.user!.verification_status,
        contentType,
        contentId,
        hasAccess: accessResult.hasAccess,
        reason: accessResult.reason,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in content access check handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withAuth(contentAccessCheckHandler)