import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '../../../../lib/auth.service'
import { EmailVerificationRequest } from '../../../../lib/auth.types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
          code: 'INVALID_INPUT',
          message: 'Valid email is required'
        }
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Please provide a valid email address'
        }
      })
    }

    const result = await AuthService.initiateEmailVerification({ email })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: result.error || 'Email verification failed'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        message: result.message
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Email verification API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    })
  }
}