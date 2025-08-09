import { NextApiRequest, NextApiResponse } from 'next'
import { jwtTokenService } from '../../../../lib/jwt-token.service'
import { AuthMiddleware } from '../../../../lib/auth.middleware'

async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
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
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required'
        }
      })
    }

    const token = authHeader.substring(7)
    
    // Validate the token to get user ID
    const validation = await jwtTokenService.validateSession(token)
    
    if (!validation.isValid || !validation.payload) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      })
    }

    // Revoke all user sessions for security
    await jwtTokenService.revokeAllUserSessions(validation.payload.sub)

    return res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Logout API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Logout failed'
      }
    })
  }
}

export default logoutHandler