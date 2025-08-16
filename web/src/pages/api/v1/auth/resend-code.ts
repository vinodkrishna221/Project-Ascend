import { NextApiRequest, NextApiResponse } from 'next'
import { authService, EmailVerificationService } from '../../../../lib/auth.service'
import { EmailVerificationRequest } from '../../../../lib/auth.types'
import { validateEmail } from '../../../../lib/validation'

/**
 * POST /api/v1/auth/resend-code
 * Resend verification code with rate limiting
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
    const { email }: EmailVerificationRequest = req.body

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

    // Get client IP and user agent for security tracking
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    // Check rate limiting first
    const rateLimitCheck = await EmailVerificationService.canRequestNewCode(email)
    
    if (!rateLimitCheck.data?.canRequest) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.error || 'Rate limit exceeded',
          details: {
            wait_time_seconds: rateLimitCheck.data?.waitTime,
            retry_after: rateLimitCheck.data?.waitTime
          }
        }
      })
    }

    // Get current verification status
    const verificationStatus = await EmailVerificationService.getVerificationStatus(email)

    // Initiate new verification
    const result = await authService.initiateEmailVerification({ email })

    if (!result.success) {
      // Determine appropriate HTTP status code based on error type
      let statusCode = 400
      let errorCode = 'RESEND_FAILED'

      if (result.error?.message?.includes('Domain not found')) {
        statusCode = 400
        errorCode = 'UNSUPPORTED_DOMAIN'
      } else if (result.error?.message?.includes('inactive')) {
        statusCode = 400
        errorCode = 'INACTIVE_DOMAIN'
      }

      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: result.error || 'Failed to resend verification code'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Verification code resent successfully',
        verification_status: {
          has_active_code: true,
          expires_in_minutes: 15,
          previous_code_invalidated: verificationStatus.data?.hasActiveCode
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        email_domain: email.split('@')[1],
        action: 'resend'
      }
    })
  } catch (error) {
    console.error('Resend code API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Resend service temporarily unavailable'
      }
    })
  }
}