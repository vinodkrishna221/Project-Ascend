import { NextApiRequest, NextApiResponse } from 'next'
import { DomainValidationService } from '../../../../../../lib/domain-validation.service'
import { authMiddleware } from '../../../../../../lib/auth.middleware'

/**
 * Admin API endpoint for verifying college domains
 * POST /api/v1/admin/domains/[id]/verify - Mark domain as verified
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    })
  }

  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_DOMAIN_ID',
        message: 'Invalid domain ID'
      }
    })
  }

  try {
    // Get the admin user ID from the authenticated request
    const adminUserId = (req as any).user?.id

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin user ID not found'
        }
      })
    }

    // First check if domain exists
    const domain = await DomainValidationService.getCollegeDomainById(id)
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOMAIN_NOT_FOUND',
          message: 'College domain not found'
        }
      })
    }

    // Check if already verified
    if (domain.verified_at) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_ALREADY_VERIFIED',
          message: 'Domain is already verified'
        }
      })
    }

    const result = await DomainValidationService.markDomainAsVerified(id, adminUserId)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_VERIFICATION_FAILED',
          message: result.error || 'Failed to verify college domain'
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'College domain verified successfully'
    })
  } catch (error) {
    console.error('Verify domain error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify college domain'
      }
    })
  }
}

export default authMiddleware(handler, { 
  requiredRole: 'platform_admin',
  requireVerification: true 
})