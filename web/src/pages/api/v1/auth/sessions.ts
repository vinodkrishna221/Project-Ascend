import { NextApiRequest, NextApiResponse } from 'next'
import { jwtTokenService } from '../../../../lib/jwt-token.service'
import { AuthMiddleware, AuthenticatedRequest } from '../../../../lib/auth.middleware'

async function sessionsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        // Get user's active sessions
        const sessions = await jwtTokenService.getUserSessions(req.user.id)
        
        return res.status(200).json({
          success: true,
          data: {
            sessions: sessions.map(session => ({
              id: session.id,
              deviceInfo: session.device_info,
              ipAddress: session.ip_address,
              createdAt: session.created_at,
              lastUsed: session.last_used,
              isActive: session.is_active
            }))
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        })

      case 'DELETE':
        // Revoke all user sessions
        await jwtTokenService.revokeAllUserSessions(req.user.id)
        
        return res.status(200).json({
          success: true,
          data: {
            message: 'All sessions revoked successfully'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        })

      default:
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Method not allowed'
          }
        })
    }
  } catch (error) {
    console.error('Sessions API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Session management failed'
      }
    })
  }
}

// Apply authentication middleware
export default AuthMiddleware.requireAuth(sessionsHandler)