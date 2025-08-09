import { NextApiRequest, NextApiResponse } from 'next'
import { jwtTokenService } from '../../../../../lib/jwt-token.service'
import { AuthMiddleware, AuthenticatedRequest } from '../../../../../lib/auth.middleware'

async function sessionHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    })
  }

  try {
    const { sessionId } = req.query

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SESSION_ID',
          message: 'Valid session ID is required'
        }
      })
    }

    // Verify the session belongs to the authenticated user
    const userSessions = await jwtTokenService.getUserSessions(req.user.id)
    const sessionExists = userSessions.some(session => session.id === sessionId)

    if (!sessionExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found or does not belong to user'
        }
      })
    }

    // Revoke the specific session
    await jwtTokenService.revokeSession(sessionId)

    return res.status(200).json({
      success: true,
      data: {
        message: 'Session revoked successfully'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Session revocation API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Session revocation failed'
      }
    })
  }
}

// Apply authentication middleware
export default AuthMiddleware.requireAuth(sessionHandler)