import { NextApiRequest, NextApiResponse } from 'next'
import { DomainValidationService } from '../../../../../lib/domain-validation.service'
import { authMiddleware } from '../../../../../lib/auth.middleware'
import { CollegeDomainUpdate } from '../../../../../lib/auth.types'

/**
 * Admin API endpoint for managing individual college domains
 * GET /api/v1/admin/domains/[id] - Get domain by ID
 * PUT /api/v1/admin/domains/[id] - Update domain
 * DELETE /api/v1/admin/domains/[id] - Deactivate domain
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

  if (req.method === 'GET') {
    return handleGetDomain(req, res, id)
  } else if (req.method === 'PUT') {
    return handleUpdateDomain(req, res, id)
  } else if (req.method === 'DELETE') {
    return handleDeactivateDomain(req, res, id)
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
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
 * Handle GET request - Get domain by ID
 */
async function handleGetDomain(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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

    return res.status(200).json({
      success: true,
      data: domain
    })
  } catch (error) {
    console.error('Get domain error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve domain'
      }
    })
  }
}

/**
 * Handle PUT request - Update domain
 */
async function handleUpdateDomain(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const {
      domain,
      college_name,
      country,
      provides_email,
      verification_type,
      manual_review_required,
      is_active
    } = req.body

    // Validate domain format if being updated
    if (domain && provides_email !== false) {
      const validation = DomainValidationService.validateInternationalDomain(domain)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.reason || 'Invalid domain format',
            details: {
              field: 'domain',
              constraint: 'valid_domain_format'
            }
          }
        })
      }
    }

    const updates: CollegeDomainUpdate = {}

    // Only include fields that are being updated
    if (domain !== undefined) updates.domain = provides_email === false ? null : domain
    if (college_name !== undefined) updates.college_name = college_name
    if (country !== undefined) updates.country = country
    if (provides_email !== undefined) updates.provides_email = provides_email
    if (verification_type !== undefined) updates.verification_type = verification_type
    if (manual_review_required !== undefined) updates.manual_review_required = manual_review_required
    if (is_active !== undefined) updates.is_active = is_active

    const result = await DomainValidationService.updateCollegeDomain(id, updates)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_UPDATE_FAILED',
          message: result.error || 'Failed to update college domain'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: result.domain,
      message: 'College domain updated successfully'
    })
  } catch (error) {
    console.error('Update domain error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update college domain'
      }
    })
  }
}

/**
 * Handle DELETE request - Deactivate domain
 */
async function handleDeactivateDomain(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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