import { NextApiRequest, NextApiResponse } from 'next'
import { EmailVerificationService } from '../../../../lib/auth.service'
import { validateEmail } from '../../../../lib/validation'

/**
 * GET /api/v1/auth/verification-status?email=user@college.edu
 * Check verification status for an email
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    })
  }

  try {
    const { email } = req.query

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid email is required',
          details: {
            field: 'email',
            constraint: 'required'
          }
        }
      })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address',
          details: {
            field: 'email',
            constraint: 'valid_email_format'
          }
        }
      })
    }

    // Get verification status
    const status = await EmailVerificationService.getVerificationStatus(email)

    // Check if can request new code
    const rateLimitCheck = await EmailVerificationService.canRequestNewCode(email)

    // Calculate time remaining if code is active
    let timeRemaining: number | undefined
    if (status.hasActiveCode && status.expiresAt) {
      const expiresAt = new Date(status.expiresAt)
      const now = new Date()
      timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    }

    return res.status(200).json({
      success: true,
      data: {
        has_active_code: status.hasActiveCode,
        is_expired: status.isExpired || false,
        is_locked: status.isLocked || false,
        attempts_remaining: status.attemptsRemaining || 0,
        expires_at: status.expiresAt,
        time_remaining_seconds: timeRemaining,
        can_request_new_code: rateLimitCheck.canRequest,
        rate_limit: {
          can_request: rateLimitCheck.canRequest,
          wait_time_seconds: rateLimitCheck.waitTime || 0,
          error: rateLimitCheck.error
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        email_domain: email.split('@')[1]
      }
    })
  } catch (error) {
    console.error('Verification status API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Verification status service temporarily unavailable'
      }
    })
  }
}