import { NextApiRequest, NextApiResponse } from 'next'
import { authService } from '../../../../lib/auth.service'
import { RefreshTokenRequest } from '../../../../lib/auth.types'

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
    const { refresh_token }: RefreshTokenRequest = req.body

    // Validate input
    if (!refresh_token || typeof refresh_token !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Valid refresh token is required'
        }
      })
    }

    const result = await authService.refreshToken({ refresh_token })

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: result.error || 'Token refresh failed'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        tokens: result.data?.tokens
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Token refresh API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    })
  }
}