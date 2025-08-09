import { NextApiRequest, NextApiResponse } from 'next'
import { DomainValidationService } from '../../../../../lib/domain-validation.service'
import { authMiddleware } from '../../../../../lib/auth.middleware'
import { CollegeDomainInsert } from '../../../../../lib/auth.types'

/**
 * Admin API endpoint for managing college domains
 * GET /api/v1/admin/domains - List all domains with optional filters
 * POST /api/v1/admin/domains - Add new college domain
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetDomains(req, res)
  } else if (req.method === 'POST') {
    return handleAddDomain(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
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
 * Handle GET request - List domains with optional filters
 */
async function handleGetDomains(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      active, 
      provides_email, 
      pending_review, 
      country, 
      search,
      stats 
    } = req.query

    // If stats requested, return statistics
    if (stats === 'true') {
      const statistics = await DomainValidationService.getDomainStatistics()
      return res.status(200).json({
        success: true,
        data: statistics
      })
    }

    // If pending review requested
    if (pending_review === 'true') {
      const domains = await DomainValidationService.getDomainsPendingReview()
      return res.status(200).json({
        success: true,
        data: domains,
        meta: {
          total: domains.length,
          filter: 'pending_review'
        }
      })
    }

    // If search query provided
    if (search && typeof search === 'string') {
      const domains = await DomainValidationService.searchCollegeDomains(search)
      return res.status(200).json({
        success: true,
        data: domains,
        meta: {
          total: domains.length,
          filter: 'search',
          query: search
        }
      })
    }

    // Get domains based on filters
    let domains: any[]
    if (provides_email === 'true') {
      domains = await DomainValidationService.getEmailProvidingDomains()
    } else if (provides_email === 'false') {
      domains = await DomainValidationService.getDatabaseOnlyColleges()
    } else {
      domains = await DomainValidationService.getActiveCollegeDomains()
    }

    // Apply additional filters
    if (active === 'false') {
      // This would require a separate method to get inactive domains
      // For now, we'll return empty array
      domains = []
    }

    if (country && typeof country === 'string') {
      domains = domains.filter(domain => 
        domain.country.toLowerCase() === country.toLowerCase()
      )
    }

    return res.status(200).json({
      success: true,
      data: domains,
      meta: {
        total: domains.length,
        filters: {
          active: active || 'true',
          provides_email,
          country
        }
      }
    })
  } catch (error) {
    console.error('Get domains error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve domains'
      }
    })
  }
}

/**
 * Handle POST request - Add new college domain
 */
async function handleAddDomain(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      domain,
      college_name,
      country = 'India',
      provides_email = true,
      verification_type = 'automatic',
      manual_review_required = false
    } = req.body

    // Validate required fields
    if (!college_name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'College name is required',
          details: {
            field: 'college_name',
            constraint: 'required'
          }
        }
      })
    }

    // If domain is provided and provides_email is true, validate domain
    if (domain && provides_email) {
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

    // If college doesn't provide email, domain should be null
    const domainData: CollegeDomainInsert = {
      domain: provides_email ? domain : null,
      college_name,
      country,
      provides_email,
      verification_type,
      manual_review_required,
      is_active: true
    }

    const result = await DomainValidationService.addCollegeDomain(domainData)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_CREATION_FAILED',
          message: result.error || 'Failed to add college domain'
        }
      })
    }

    return res.status(201).json({
      success: true,
      data: result.domain,
      message: 'College domain added successfully'
    })
  } catch (error) {
    console.error('Add domain error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add college domain'
      }
    })
  }
}

export default authMiddleware(handler, { 
  requiredRole: 'platform_admin',
  requireVerification: true 
})