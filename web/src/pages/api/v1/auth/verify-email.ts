import { NextApiRequest, NextApiResponse } from 'next'
import { authService, EmailVerificationService } from '../../../../lib/auth.service'
import { EmailVerificationRequest } from '../../../../lib/auth.types'
import { validateEmail } from '../../../../lib/validation'

/**
 * POST /api/v1/auth/verify-email
 * Initiate email verification by sending a verification code
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

    // Check current verification status
    const verificationStatus = await EmailVerificationService.getVerificationStatus(email)
    
    const result = await authService.initiateEmailVerification({ email })

    if (!result.success) {
      // Determine appropriate HTTP status code based on error type
      let statusCode = 400
      let errorCode = 'EMAIL_VERIFICATION_FAILED'

      if (result.error?.message?.includes('Rate limit') || result.error?.message?.includes('wait')) {
        statusCode = 429
        errorCode = 'RATE_LIMIT_EXCEEDED'
      } else if (result.error?.message?.includes('Domain not found')) {
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
          message: result.error || 'Email verification failed'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        message: result.data?.message,
        verification_status: {
          has_active_code: true,
          expires_in_minutes: 15
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        email_domain: email.split('@')[1]
      }
    })
  } catch (error) {
    console.error('Email verification API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Email verification service temporarily unavailable'
      }
    })
  }
}