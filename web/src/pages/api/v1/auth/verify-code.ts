import { NextApiRequest, NextApiResponse } from 'next'
import { authService, EmailVerificationService } from '../../../../lib/auth.service'
import { VerifyCodeRequest } from '../../../../lib/auth.types'
import { validateEmail } from '../../../../lib/validation'

/**
 * POST /api/v1/auth/verify-code
 * Verify email verification code and create user account
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
    const { email, code }: VerifyCodeRequest = req.body

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

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid verification code is required',
          details: {
            field: 'code',
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

    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Verification code must be 6 digits',
          details: {
            field: 'code',
            constraint: 'six_digit_format'
          }
        }
      })
    }

    // Get client IP and user agent for security tracking
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    const result = await authService.verifyEmailCode({ email, code })

    if (!result.success) {
      // Determine appropriate HTTP status code and error details
      let statusCode = 400
      let errorCode = 'CODE_VERIFICATION_FAILED'
      let errorDetails: any = undefined

      if (result.error?.message?.includes('expired')) {
        errorCode = 'CODE_EXPIRED'
        errorDetails = {
          action: 'request_new_code',
          message: 'Please request a new verification code'
        }
      } else if (result.error?.message?.includes('attempts')) {
        statusCode = 429
        errorCode = 'MAX_ATTEMPTS_EXCEEDED'
        errorDetails = {
          action: 'request_new_code',
          message: 'Please request a new verification code'
        }
      } else if (result.error?.message?.includes('Invalid')) {
        errorCode = 'INVALID_CODE'
        // Try to get attempts remaining info
        const status = await EmailVerificationService.getVerificationStatus(email)
        if (status.data?.attemptsRemaining !== undefined) {
          errorDetails = {
            attempts_remaining: status.data.attemptsRemaining,
            message: `${status.data.attemptsRemaining} attempts remaining`
          }
        }
      } else if (result.error?.message?.includes('No active')) {
        errorCode = 'NO_ACTIVE_CODE'
        errorDetails = {
          action: 'request_new_code',
          message: 'Please request a new verification code'
        }
      }

      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: result.error || 'Code verification failed',
          details: errorDetails
        }
      })
    }

    // Successful verification
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.data?.user?.id,
          email: result.data?.user?.email,
          name: result.data?.user?.name,
          role: result.data?.user?.role,
          verification_status: result.data?.user?.verification_status,
          verification_method: result.data?.user?.verification_method
        },
        tokens: result.data?.tokens
      },
      meta: {
        timestamp: new Date().toISOString(),
        verification_method: 'email',
        account_created: true
      }
    })
  } catch (error) {
    console.error('Code verification API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Code verification service temporarily unavailable'
      }
    })
  }
}