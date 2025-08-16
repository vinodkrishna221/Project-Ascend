import { NextApiRequest, NextApiResponse } from 'next'
import { DomainValidationService } from '../../../../lib/domain-validation.service'
import { validateEmail } from '../../../../lib/validation'

/**
 * Public API endpoint for requesting new college domains
 * POST /api/v1/domains/request - Request addition of new college domain
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    const {
      domain,
      college_name,
      country = 'India',
      provides_email = true,
      requester_email,
      additional_info
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

    if (!requester_email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Requester email is required',
          details: {
            field: 'requester_email',
            constraint: 'required'
          }
        }
      })
    }

    // Validate email format
    if (!validateEmail(requester_email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          details: {
            field: 'requester_email',
            constraint: 'valid_email'
          }
        }
      })
    }

    // If domain is provided and college provides email, validate domain format
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

    // If college provides email but no domain provided
    if (provides_email && !domain) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Domain is required when college provides email',
          details: {
            field: 'domain',
            constraint: 'required_when_provides_email'
          }
        }
      })
    }

    const result = await DomainValidationService.requestDomainAddition({
      domain,
      college_name,
      country,
      provides_email,
      requester_email,
      additional_info
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_REQUEST_FAILED',
          message: result.error || 'Failed to submit domain request'
        }
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Domain request submitted successfully. It will be reviewed by our team.',
      data: {
        status: 'pending_review',
        estimated_review_time: '3-5 business days'
      }
    })
  } catch (error) {
    console.error('Domain request error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to submit domain request'
      }
    })
  }
}