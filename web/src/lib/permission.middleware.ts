import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { UserRole, Profile } from './auth.types'
import { createRoleManagementService, Permission, ROLE_PERMISSIONS } from './role-management.service'
import { verifyJWT } from './jwt-token.service'

export interface AuthenticatedRequest extends NextApiRequest {
  user?: Profile
  userId?: string
  validatedData?: any
}

export interface PermissionContext {
  guildId?: string
  communityId?: string
  resourceId?: string
}

/**
 * Middleware to authenticate user and attach user info to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token required'
          }
        })
      }

      const token = authHeader.substring(7)

      // Verify JWT token
      const tokenPayload = await verifyJWT(token)
      if (!tokenPayload) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          }
        })
      }

      // Get user profile from database
      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tokenPayload.sub)
        .single()

      if (error || !profile) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      // Check if user is verified
      if (profile.verification_status !== 'verified') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_NOT_VERIFIED',
            message: 'User account not verified'
          }
        })
      }

      // Attach user info to request
      req.user = profile
      req.userId = profile.id

      return handler(req, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }
}

/**
 * Middleware to check if user has required permission
 */
export function withPermission(
  permission: Permission,
  getContext?: (req: AuthenticatedRequest) => PermissionContext
) {
  return function(
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'User not authenticated'
            }
          })
        }

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const roleService = createRoleManagementService(supabase)

        // Get context if provided
        const context = getContext ? getContext(req) : undefined

        // Check permission
        const permissionResult = await roleService.checkPermission(
          req.user.id,
          permission,
          context
        )

        if (!permissionResult.hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: permissionResult.reason || 'Insufficient permissions'
            }
          })
        }

        return handler(req, res)
      } catch (error) {
        console.error('Permission middleware error:', error)
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        })
      }
    })
  }
}

/**
 * Middleware to check if user has any of the required roles
 */
export function withRole(roles: UserRole[]) {
  return function(
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'User not authenticated'
            }
          })
        }

        const userRole = req.user.role as UserRole

        if (!roles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_ROLE',
              message: `Required roles: ${roles.join(', ')}. User role: ${userRole}`
            }
          })
        }

        return handler(req, res)
      } catch (error) {
        console.error('Role middleware error:', error)
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        })
      }
    })
  }
}

/**
 * Middleware for platform admin only endpoints
 */
export const withPlatformAdmin = withRole(['platform_admin'])

/**
 * Middleware for guild admin or platform admin endpoints
 */
export const withGuildAdmin = withRole(['guild_admin', 'platform_admin'])

/**
 * Middleware for verified students (student, guild_admin, platform_admin)
 */
export const withStudent = withRole(['student', 'guild_admin', 'platform_admin'])

/**
 * Middleware for any verified user (including aspirants)
 */
export const withVerifiedUser = withAuth

/**
 * Helper function to check guild admin permissions for specific guild
 */
export function withGuildAdminPermission(guildIdParam: string = 'guildId') {
  return withPermission('canManageGuild', (req) => ({
    guildId: req.query[guildIdParam] as string
  }))
}

/**
 * Helper function to check community moderation permissions
 */
export function withCommunityModPermission(communityIdParam: string = 'communityId') {
  return withPermission('canModerateContent', (req) => ({
    communityId: req.query[communityIdParam] as string
  }))
}

/**
 * Utility function to get user permissions for client-side use
 */
export async function getUserPermissions(userId: string): Promise<any | null> {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)
    return await roleService.getUserPermissions(userId)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
}

/**
 * Utility function to check if user can access resource
 */
export async function canUserAccessResource(
  userId: string,
  permission: Permission,
  context?: PermissionContext
): Promise<boolean> {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)
    const result = await roleService.checkPermission(userId, permission, context)
    return result.hasPermission
  } catch (error) {
    console.error('Error checking resource access:', error)
    return false
  }
}

/**
 * Middleware to validate request parameters
 */
export function withValidation<T>(
  validator: (req: NextApiRequest) => { isValid: boolean; errors?: string[]; data?: T }
) {
  return function(
    handler: (req: AuthenticatedRequest & { validatedData?: T }, res: NextApiResponse) => Promise<void>
  ) {
    return async (req: AuthenticatedRequest & { validatedData?: T }, res: NextApiResponse) => {
      const validation = validator(req)
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.errors
          }
        })
      }

      req.validatedData = validation.data
      return handler(req, res)
    }
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return function(
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
  ) {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const now = Date.now()
      const key = `${clientId}:${req.url}`

      const current = rateLimitStore.get(key)
      
      if (!current || now > current.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      } else if (current.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later'
          }
        })
      } else {
        current.count++
      }

      return handler(req, res)
    }
  }
}