import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { UserRole, VerificationStatus, VerificationMethod, Profile } from './auth.types'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface RoleAssignmentResult {
  success: boolean
  role?: UserRole
  error?: string
}

export interface PermissionCheckResult {
  hasPermission: boolean
  reason?: string
}

export interface RoleUpdateResult {
  success: boolean
  updatedRole?: UserRole
  error?: string
}

export interface GuildAdminVerificationResult {
  success: boolean
  isVerified: boolean
  guildId?: string
  error?: string
}

// Permission definitions for each role
export const ROLE_PERMISSIONS = {
  student: {
    canCreatePosts: true,
    canJoinCommunities: true,
    canAccessGuilds: true,
    canEndorseSkills: true,
    canCreateProjects: true,
    canModerateContent: false,
    canManageGuild: false,
    canAccessAdminPanel: false,
    canViewAnalytics: false
  },
  aspirant: {
    canCreatePosts: false,
    canJoinCommunities: true, // Limited to public communities
    canAccessGuilds: true, // Limited to Q&A sections
    canEndorseSkills: false,
    canCreateProjects: false,
    canModerateContent: false,
    canManageGuild: false,
    canAccessAdminPanel: false,
    canViewAnalytics: false
  },
  guild_admin: {
    canCreatePosts: true,
    canJoinCommunities: true,
    canAccessGuilds: true,
    canEndorseSkills: true,
    canCreateProjects: true,
    canModerateContent: true, // Within their guild
    canManageGuild: true,
    canAccessAdminPanel: false,
    canViewAnalytics: true // Guild-specific analytics
  },
  platform_admin: {
    canCreatePosts: true,
    canJoinCommunities: true,
    canAccessGuilds: true,
    canEndorseSkills: true,
    canCreateProjects: true,
    canModerateContent: true,
    canManageGuild: true,
    canAccessAdminPanel: true,
    canViewAnalytics: true
  }
} as const

export type Permission = keyof typeof ROLE_PERMISSIONS.student

export class RoleManagementService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Assign role based on verification method and status
   * Requirements: 6.1, 6.2
   */
  async assignRoleBasedOnVerification(
    userId: string,
    verificationMethod: VerificationMethod,
    verificationStatus: VerificationStatus,
    collegeId?: string
  ): Promise<RoleAssignmentResult> {
    try {
      let assignedRole: UserRole

      // Determine role based on verification method and status
      if (verificationStatus !== 'verified') {
        return {
          success: false,
          error: 'User must be verified before role assignment'
        }
      }

      switch (verificationMethod) {
        case 'email':
          // Email verified users are students by default
          assignedRole = 'student'
          break
        case 'college_database':
          // College database verified users are students
          assignedRole = 'student'
          break
        case 'manual':
          // Manual verification could be for aspirants or special cases
          // Default to aspirant, can be upgraded later
          assignedRole = 'aspirant'
          break
        default:
          return {
            success: false,
            error: 'Invalid verification method'
          }
      }

      // Update user role in database
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ 
          role: assignedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error assigning role:', error)
        return {
          success: false,
          error: 'Failed to assign role'
        }
      }

      // Create audit log entry
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'role_assigned',
        p_details: {
          role: assignedRole,
          verification_method: verificationMethod,
          college_id: collegeId
        },
        p_success: true
      })

      return {
        success: true,
        role: assignedRole
      }
    } catch (error) {
      console.error('Error in assignRoleBasedOnVerification:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Check if user has specific permission
   * Requirements: 6.4, 6.5
   */
  async checkPermission(
    userId: string,
    permission: Permission,
    context?: { guildId?: string; communityId?: string }
  ): Promise<PermissionCheckResult> {
    try {
      // Get user profile with current role and verification status
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('role, verification_status, college_id')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        return {
          hasPermission: false,
          reason: 'User not found or not verified'
        }
      }

      // Check if user is verified
      if (profile.verification_status !== 'verified') {
        return {
          hasPermission: false,
          reason: 'User not verified'
        }
      }

      const userRole = profile.role as UserRole
      const rolePermissions = ROLE_PERMISSIONS[userRole]

      // Check basic permission
      if (!rolePermissions[permission]) {
        return {
          hasPermission: false,
          reason: `Role ${userRole} does not have permission ${permission}`
        }
      }

      // Additional context-based checks
      if (permission === 'canManageGuild' && context?.guildId) {
        // Only guild admins of the specific guild can manage it
        if (userRole !== 'guild_admin' && userRole !== 'platform_admin') {
          return {
            hasPermission: false,
            reason: 'Only guild admins can manage guilds'
          }
        }

        // Check if user is admin of this specific guild
        if (userRole === 'guild_admin' && profile.college_id !== context.guildId) {
          return {
            hasPermission: false,
            reason: 'User is not admin of this guild'
          }
        }
      }

      if (permission === 'canJoinCommunities' && userRole === 'aspirant') {
        // Aspirants can only join public communities
        if (context?.communityId) {
          const { data: community } = await this.supabase
            .from('communities')
            .select('is_public')
            .eq('id', context.communityId)
            .single()

          if (community && !community.is_public) {
            return {
              hasPermission: false,
              reason: 'Aspirants can only join public communities'
            }
          }
        }
      }

      return {
        hasPermission: true
      }
    } catch (error) {
      console.error('Error checking permission:', error)
      return {
        hasPermission: false,
        reason: 'Internal server error'
      }
    }
  }

  /**
   * Update user role with real-time session updates
   * Requirements: 6.3, 6.4
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole,
    updatedBy: string,
    reason?: string
  ): Promise<RoleUpdateResult> {
    try {
      // Validate the new role
      if (!Object.keys(ROLE_PERMISSIONS).includes(newRole)) {
        return {
          success: false,
          error: 'Invalid role specified'
        }
      }

      // Get current user data
      const { data: currentProfile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('role, verification_status')
        .eq('id', userId)
        .single()

      if (fetchError || !currentProfile) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Check if user is verified
      if (currentProfile.verification_status !== 'verified') {
        return {
          success: false,
          error: 'Cannot update role for unverified user'
        }
      }

      // Update role in database
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating role:', error)
        return {
          success: false,
          error: 'Failed to update role'
        }
      }

      // Create audit log entry
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'role_updated',
        p_details: {
          old_role: currentProfile.role,
          new_role: newRole,
          updated_by: updatedBy,
          reason: reason
        },
        p_success: true
      })

      // Invalidate user sessions to force re-authentication with new role
      await this.invalidateUserSessions(userId, 'role_change')

      return {
        success: true,
        updatedRole: newRole
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Verify and designate guild admin
   * Requirements: 6.3, 6.4
   */
  async verifyAndDesignateGuildAdmin(
    userId: string,
    guildId: string,
    designatedBy: string
  ): Promise<GuildAdminVerificationResult> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role, verification_status, college_id')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return {
          success: false,
          isVerified: false,
          error: 'User not found'
        }
      }

      // Check if user is verified student
      if (profile.verification_status !== 'verified') {
        return {
          success: false,
          isVerified: false,
          error: 'User must be verified before becoming guild admin'
        }
      }

      if (profile.role !== 'student') {
        return {
          success: false,
          isVerified: false,
          error: 'Only verified students can become guild admins'
        }
      }

      // Check if user belongs to the guild's college
      if (profile.college_id !== guildId) {
        return {
          success: false,
          isVerified: false,
          error: 'User must be from the same college as the guild'
        }
      }

      // Update user role to guild_admin
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ 
          role: 'guild_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating to guild admin:', updateError)
        return {
          success: false,
          isVerified: false,
          error: 'Failed to designate as guild admin'
        }
      }

      // Create audit log entry
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'guild_admin_designated',
        p_details: {
          guild_id: guildId,
          designated_by: designatedBy,
          previous_role: 'student'
        },
        p_success: true
      })

      // Invalidate sessions to update permissions
      await this.invalidateUserSessions(userId, 'role_upgrade')

      return {
        success: true,
        isVerified: true,
        guildId: guildId
      }
    } catch (error) {
      console.error('Error verifying guild admin:', error)
      return {
        success: false,
        isVerified: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Get user permissions based on current role
   */
  async getUserPermissions(userId: string): Promise<any | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('role, verification_status')
        .eq('id', userId)
        .single()

      if (error || !profile || profile.verification_status !== 'verified') {
        return null
      }

      return ROLE_PERMISSIONS[profile.role as UserRole]
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return null
    }
  }

  /**
   * Invalidate user sessions to force re-authentication with updated permissions
   */
  private async invalidateUserSessions(userId: string, reason: string): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          last_used: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Create audit log for session invalidation
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'sessions_invalidated',
        p_details: { reason },
        p_success: true
      })
    } catch (error) {
      console.error('Error invalidating user sessions:', error)
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('role, verification_status')
        .eq('id', userId)
        .single()

      if (error || !profile || profile.verification_status !== 'verified') {
        return false
      }

      return roles.includes(profile.role as UserRole)
    } catch (error) {
      console.error('Error checking user roles:', error)
      return false
    }
  }

  /**
   * Get all users with specific role
   */
  async getUsersByRole(role: UserRole): Promise<Profile[]> {
    try {
      const { data: profiles, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('role', role)
        .eq('verification_status', 'verified')

      if (error) {
        console.error('Error fetching users by role:', error)
        return []
      }

      return profiles || []
    } catch (error) {
      console.error('Error in getUsersByRole:', error)
      return []
    }
  }
}

// Export singleton instance
export const createRoleManagementService = (supabase: SupabaseClient) => {
  return new RoleManagementService(supabase)
}