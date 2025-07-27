import { NextApiRequest, NextApiResponse } from 'next'
import { SessionService } from './auth.service'
import { Profile, UserRole } from './auth.types'

export interface AuthenticatedRequest extends NextApiRequest {
  user: Profile
}

/**
 * Middleware to authenticate API requests
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required'
          }
        })
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      const validation = await SessionService.validateSession(token)

      if (!validation.valid || !validation.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          }
        })
      }

      // Add user to request object
      ;(req as AuthenticatedRequest).user = validation.user

      return handler(req as AuthenticatedRequest, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication failed'
        }
      })
    }
  }
}

/**
 * Middleware to check user role
 */
export function withRole(roles: UserRole[]) {
  return function(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions for this action'
          }
        })
      }

      return handler(req, res)
    })
  }
}

/**
 * Middleware to check verification status
 */
export function withVerification(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user.verification_status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNVERIFIED_USER',
          message: 'User account is not verified'
        }
      })
    }

    return handler(req, res)
  })
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function withOptionalAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const validation = await SessionService.validateSession(token)

        if (validation.valid && validation.user) {
          ;(req as AuthenticatedRequest).user = validation.user
        }
      }

      return handler(req as AuthenticatedRequest, res)
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      // Continue without authentication
      return handler(req as AuthenticatedRequest, res)
    }
  }
}