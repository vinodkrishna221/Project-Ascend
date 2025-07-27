import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '../../../../lib/auth.service'
import { VerifyCodeRequest } from '../../../../lib/auth.types'

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
    const { email, code }: VerifyCodeRequest = req.body

    // Validate input
    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Valid email and code are required'
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

    // Validate code format (should be 6 characters)
    if (code.length !== 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE_FORMAT',
          message: 'Verification code must be 6 characters'
        }
      })
    }

    const result = await AuthService.verifyEmailCode({ email, code })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CODE_VERIFICATION_FAILED',
          message: result.error || 'Code verification failed'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Code verification API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    })
  }
}