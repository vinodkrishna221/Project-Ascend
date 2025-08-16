import { NextApiRequest, NextApiResponse } from 'next'
import { DomainValidationService } from '../../../../../../lib/domain-validation.service'
import { authMiddleware } from '../../../../../../lib/auth.middleware'

/**
 * Admin API endpoint for activating/deactivating college domains
 * POST /api/v1/admin/domains/[id]/activate - Activate domain
 * DELETE /api/v1/admin/domains/[id]/activate - Deactivate domain
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (req.method === 'POST') {
    return handleActivateDomain(req, res, id)
  } else if (req.method === 'DELETE') {
    return handleDeactivateDomain(req, res, id)
  } else {
    res.setHeader('Allow', ['POST', 'DELETE'])
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    })
  }
}

/**
 * Handle POST request - Activate domain
 */
async function handleActivateDomain(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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

    // Check if already active
    if (domain.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_ALREADY_ACTIVE',
          message: 'Domain is already active'
        }
      })
    }

    const result = await DomainValidationService.activateCollegeDomain(id)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_ACTIVATION_FAILED',
          message: result.error || 'Failed to activate college domain'
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'College domain activated successfully'
    })
  } catch (error) {
    console.error('Activate domain error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to activate college domain'
      }
    })
  }
}

/**
 * Handle DELETE request - Deactivate domain
 */
async function handleDeactivateDomain(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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

    // Check if already inactive
    if (!domain.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_ALREADY_INACTIVE',
          message: 'Domain is already inactive'
        }
      })
    }

    const result = await DomainValidationService.deactivateCollegeDomain(id)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_DEACTIVATION_FAILED',
          message: result.error || 'Failed to deactivate college domain'
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'College domain deactivated successfully'
    })
  } catch (error) {
    console.error('Deactivate domain error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate college domain'
      }
    })
  }
}

export default authMiddleware(handler, { 
  requiredRole: 'platform_admin',
  requireVerification: true 
})