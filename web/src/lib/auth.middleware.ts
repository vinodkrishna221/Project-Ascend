import { NextApiRequest, NextApiResponse } from 'next'

import { Profile, UserRole } from './auth.types'
import { jwtTokenService } from './jwt-token.service'
import { supabaseAdmin } from './supabase'

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
      const validation = await jwtTokenService.validateSession(token)

      if (!validation.isValid || !validation.payload) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: validation.error || 'Invalid or expired token'
          }
        })
      }

      // Get full user profile from database
      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', validation.payload.sub)
        .single()

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      // Add user to request object
      ;(req as AuthenticatedRequest).user = user

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
        const validation = await jwtTokenService.validateSession(token)

        if (validation.isValid && validation.payload) {
          // Get full user profile from database
          const { data: user, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', validation.payload.sub)
            .single()

          if (!error && user) {
            ;(req as AuthenticatedRequest).user = user
          }
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

/**
 * Combined authentication middleware with options
 */
export function authMiddleware(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: {
    requiredRole?: UserRole;
    requireVerification?: boolean;
    optional?: boolean;
  } = {}
) {
  if (options.optional) {
    return withOptionalAuth(handler)
  }

  let middleware = withAuth(handler)

  if (options.requireVerification) {
    middleware = withVerification(handler)
  }

  if (options.requiredRole) {
    middleware = withRole([options.requiredRole])(handler)
  }

  return middleware
}

/**
 * AuthMiddleware class with static methods for convenience
 */
export class AuthMiddleware {
  /**
   * Require authentication
   */
  static requireAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withAuth(handler)
  }

  /**
   * Require platform admin role
   */
  static requirePlatformAdmin(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withRole(['platform_admin'])(handler)
  }

  /**
   * Require guild admin role
   */
  static requireGuildAdmin(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withRole(['guild_admin', 'platform_admin'])(handler)
  }

  /**
   * Require verified user
   */
  static requireVerified(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withVerification(handler)
  }

  /**
   * Optional authentication
   */
  static optional(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withOptionalAuth(handler)
  }

  /**
   * Require specific role
   */
  static requireRole(roles: UserRole[]) {
    return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
      return withRole(roles)(handler)
    }
  }
}