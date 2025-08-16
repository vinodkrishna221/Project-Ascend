import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { UserRole, Profile } from './auth.types'
import { createRoleManagementService } from './role-management.service'
import { AuthenticatedRequest, withAuth } from './permission.middleware'

/**
 * API endpoint protection based on user roles and verification status
 * Requirements: 6.4, 6.5
 */

export interface ProtectedEndpointConfig {
  allowedRoles?: UserRole[]
  requireVerification?: boolean
  customPermissionCheck?: (user: Profile, req: NextApiRequest) => Promise<boolean>
}

/**
 * Middleware to protect API endpoints based on role and verification status
 */
export function withEndpointProtection(config: ProtectedEndpointConfig = {}) {
  const {
    allowedRoles = ['student', 'aspirant', 'guild_admin', 'platform_admin'],
    requireVerification = true,
    customPermissionCheck
  } = config

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

        // Check verification status
        if (requireVerification && req.user.verification_status !== 'verified') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'USER_NOT_VERIFIED',
              message: 'User account must be verified to access this endpoint'
            }
          })
        }

        // Check role permissions
        const userRole = req.user.role as UserRole
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_ROLE',
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}. User role: ${userRole}`
            }
          })
        }

        // Custom permission check
        if (customPermissionCheck) {
          const hasCustomPermission = await customPermissionCheck(req.user, req)
          if (!hasCustomPermission) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'CUSTOM_PERMISSION_DENIED',
                message: 'Access denied by custom permission check'
              }
            })
          }
        }

        return handler(req, res)
      } catch (error) {
        console.error('Endpoint protection middleware error:', error)
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
 * Predefined endpoint protection configurations
 */

// Students only (verified students, guild admins, platform admins)
export const withStudentAccess = withEndpointProtection({
  allowedRoles: ['student', 'guild_admin', 'platform_admin'],
  requireVerification: true
})

// Aspirants and above (all verified users)
export const withAspirantAccess = withEndpointProtection({
  allowedRoles: ['aspirant', 'student', 'guild_admin', 'platform_admin'],
  requireVerification: true
})

// Guild admins and platform admins only
export const withGuildAdminAccess = withEndpointProtection({
  allowedRoles: ['guild_admin', 'platform_admin'],
  requireVerification: true
})

// Platform admins only
export const withPlatformAdminAccess = withEndpointProtection({
  allowedRoles: ['platform_admin'],
  requireVerification: true
})

// Community-specific access control
export const withCommunityAccess = (communityIdParam: string = 'communityId') =>
  withEndpointProtection({
    allowedRoles: ['aspirant', 'student', 'guild_admin', 'platform_admin'],
    requireVerification: true,
    customPermissionCheck: async (user: Profile, req: NextApiRequest) => {
      const communityId = req.query[communityIdParam] as string
      if (!communityId) return false

      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Check if user can access this community
      const { data: community, error } = await supabase
        .from('communities')
        .select('is_public, created_by, moderators')
        .eq('id', communityId)
        .single()

      if (error || !community) return false

      // Platform admins can access everything
      if (user.role === 'platform_admin') return true

      // Community creator and moderators can access
      if (user.id === community.created_by || community.moderators?.includes(user.id)) {
        return true
      }

      // For public communities, all verified users can access
      if (community.is_public) return true

      // For private communities, check membership
      const { data: membership } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

      return !!membership
    }
  })

// Guild-specific access control
export const withGuildAccess = (guildIdParam: string = 'guildId') =>
  withEndpointProtection({
    allowedRoles: ['aspirant', 'student', 'guild_admin', 'platform_admin'],
    requireVerification: true,
    customPermissionCheck: async (user: Profile, req: NextApiRequest) => {
      const guildId = req.query[guildIdParam] as string
      if (!guildId) return false

      // Platform admins can access everything
      if (user.role === 'platform_admin') return true

      // Guild admins can access their own guild
      if (user.role === 'guild_admin' && user.college_id === guildId) {
        return true
      }

      // Students can access their college guild
      if (user.role === 'student' && user.college_id === guildId) {
        return true
      }

      // Aspirants can access guild Q&A sections (read-only)
      if (user.role === 'aspirant') {
        // This would be further restricted in specific endpoints
        return true
      }

      return false
    }
  })

// Content moderation access
export const withModerationAccess = (resourceType: 'community' | 'guild', resourceIdParam: string) =>
  withEndpointProtection({
    allowedRoles: ['guild_admin', 'platform_admin'],
    requireVerification: true,
    customPermissionCheck: async (user: Profile, req: NextApiRequest) => {
      const resourceId = req.query[resourceIdParam] as string
      if (!resourceId) return false

      // Platform admins can moderate everything
      if (user.role === 'platform_admin') return true

      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      if (resourceType === 'community') {
        // Check if user is community moderator
        const { data: community } = await supabase
          .from('communities')
          .select('created_by, moderators')
          .eq('id', resourceId)
          .single()

        return !!(community && (
          user.id === community.created_by ||
          community.moderators?.includes(user.id)
        ))
      }

      if (resourceType === 'guild') {
        // Check if user is guild admin for this guild
        return user.role === 'guild_admin' && user.college_id === resourceId
      }

      return false
    }
  })

// Real-time permission updates middleware
export const withRealTimePermissionCheck = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
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

      // Get fresh user data to ensure permissions are up-to-date
      const { data: freshUser, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single()

      if (error || !freshUser) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      // Check if user's verification status or role has changed
      if (freshUser.verification_status !== req.user.verification_status ||
          freshUser.role !== req.user.role) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSIONS_CHANGED',
            message: 'User permissions have changed. Please re-authenticate.'
          }
        })
      }

      // Update request with fresh user data
      req.user = freshUser

      return handler(req, res)
    } catch (error) {
      console.error('Real-time permission check error:', error)
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

/**
 * Utility function to check content access based on verification status
 */
export async function checkContentAccess(
  userId: string,
  contentType: 'post' | 'community' | 'guild',
  contentId: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { hasAccess: false, reason: 'User not found' }
    }

    if (user.verification_status !== 'verified') {
      return { hasAccess: false, reason: 'User not verified' }
    }

    // Check based on content type
    switch (contentType) {
      case 'post':
        // Use RLS policies to check post access
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('id')
          .eq('id', contentId)
          .single()

        return {
          hasAccess: !postError && !!post,
          reason: postError ? 'Post not accessible' : undefined
        }

      case 'community':
        const canAccess = await supabase.rpc('can_user_access_community', {
          user_id: userId,
          community_id: contentId
        })

        return {
          hasAccess: canAccess.data === true,
          reason: canAccess.data ? undefined : 'Community not accessible'
        }

      case 'guild':
        // Guild access based on college membership or role
        const hasGuildAccess = user.role === 'platform_admin' ||
          user.college_id === contentId ||
          (user.role === 'aspirant') // Aspirants can view Q&A sections

        return {
          hasAccess: hasGuildAccess,
          reason: hasGuildAccess ? undefined : 'Guild not accessible'
        }

      default:
        return { hasAccess: false, reason: 'Unknown content type' }
    }
  } catch (error) {
    console.error('Error checking content access:', error)
    return { hasAccess: false, reason: 'Internal error' }
  }
}