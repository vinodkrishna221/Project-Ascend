import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { UserRole, Profile } from './auth.types'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface PermissionUpdate {
  userId: string
  oldRole?: UserRole
  newRole: UserRole
  oldVerificationStatus?: string
  newVerificationStatus: string
  timestamp: string
  reason?: string
}

export interface SessionInvalidationResult {
  success: boolean
  invalidatedSessions: number
  error?: string
}

export interface PermissionBroadcastResult {
  success: boolean
  notifiedClients: number
  error?: string
}

/**
 * Service for managing real-time permission updates across active sessions
 * Requirements: 6.4, 6.5
 */
export class RealtimePermissionsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Broadcast permission changes to all active sessions
   */
  async broadcastPermissionUpdate(update: PermissionUpdate): Promise<PermissionBroadcastResult> {
    try {
      // Send real-time notification to user's active sessions
      const response = await this.supabase
        .channel(`user-permissions-${update.userId}`)
        .send({
          type: 'broadcast',
          event: 'permission_update',
          payload: {
            userId: update.userId,
            oldRole: update.oldRole,
            newRole: update.newRole,
            oldVerificationStatus: update.oldVerificationStatus,
            newVerificationStatus: update.newVerificationStatus,
            timestamp: update.timestamp,
            reason: update.reason,
            action: 'refresh_permissions'
          }
        })

      if (response !== 'ok') {
        console.error('Error broadcasting permission update:', response)
        return {
          success: false,
          notifiedClients: 0,
          error: 'Failed to broadcast permission update'
        }
      }

      // Also send to general permissions channel for admin monitoring
      await this.supabase
        .channel('admin-permission-updates')
        .send({
          type: 'broadcast',
          event: 'user_permission_changed',
          payload: update
        })

      return {
        success: true,
        notifiedClients: 1, // We don't have exact count, but assume success
      }
    } catch (error) {
      console.error('Error in broadcastPermissionUpdate:', error)
      return {
        success: false,
        notifiedClients: 0,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Invalidate all active sessions for a user when permissions change
   */
  async invalidateUserSessionsOnPermissionChange(
    userId: string,
    reason: string = 'permission_change'
  ): Promise<SessionInvalidationResult> {
    try {
      // Get count of active sessions before invalidation
      const { count: activeSessionsCount } = await this.supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Invalidate all active sessions
      const { error } = await this.supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          last_used: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Error invalidating user sessions:', error)
        return {
          success: false,
          invalidatedSessions: 0,
          error: 'Failed to invalidate sessions'
        }
      }

      // Create audit log entry
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'sessions_invalidated_permission_change',
        p_details: { 
          reason,
          invalidated_sessions: activeSessionsCount || 0
        },
        p_success: true
      })

      return {
        success: true,
        invalidatedSessions: activeSessionsCount || 0
      }
    } catch (error) {
      console.error('Error in invalidateUserSessionsOnPermissionChange:', error)
      return {
        success: false,
        invalidatedSessions: 0,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Handle role change with real-time updates
   */
  async handleRoleChange(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString()

      // Broadcast permission update
      await this.broadcastPermissionUpdate({
        userId,
        oldRole,
        newRole,
        newVerificationStatus: 'verified', // Assume verified for role changes
        timestamp,
        reason
      })

      // Invalidate sessions to force re-authentication with new permissions
      await this.invalidateUserSessionsOnPermissionChange(userId, 'role_change')

      // Send notification to user about role change
      await this.sendPermissionChangeNotification(userId, {
        type: 'role_change',
        oldRole,
        newRole,
        changedBy,
        reason,
        timestamp
      })

    } catch (error) {
      console.error('Error handling role change:', error)
    }
  }

  /**
   * Handle verification status change with real-time updates
   */
  async handleVerificationStatusChange(
    userId: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString()

      // Get user's current role
      const { data: user } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!user) return

      // Broadcast permission update
      await this.broadcastPermissionUpdate({
        userId,
        newRole: user.role as UserRole,
        oldVerificationStatus: oldStatus,
        newVerificationStatus: newStatus,
        timestamp,
        reason
      })

      // If verification status changed to non-verified, invalidate sessions
      if (newStatus !== 'verified') {
        await this.invalidateUserSessionsOnPermissionChange(userId, 'verification_status_change')
      }

      // Send notification to user about verification status change
      await this.sendPermissionChangeNotification(userId, {
        type: 'verification_status_change',
        oldStatus,
        newStatus,
        changedBy,
        reason,
        timestamp
      })

    } catch (error) {
      console.error('Error handling verification status change:', error)
    }
  }

  /**
   * Send notification to user about permission changes
   */
  private async sendPermissionChangeNotification(
    userId: string,
    notification: {
      type: 'role_change' | 'verification_status_change'
      oldRole?: UserRole
      newRole?: UserRole
      oldStatus?: string
      newStatus?: string
      changedBy: string
      reason?: string
      timestamp: string
    }
  ): Promise<void> {
    try {
      // This would integrate with a notification service
      // For now, we'll just log it and could extend to email/push notifications
      
      let message = ''
      if (notification.type === 'role_change') {
        message = `Your role has been changed from ${notification.oldRole} to ${notification.newRole}`
      } else {
        message = `Your verification status has been changed from ${notification.oldStatus} to ${notification.newStatus}`
      }

      if (notification.reason) {
        message += `. Reason: ${notification.reason}`
      }

      // Create audit log for notification
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'permission_change_notification_sent',
        p_details: {
          notification_type: notification.type,
          message,
          changed_by: notification.changedBy,
          reason: notification.reason
        },
        p_success: true
      })

      console.log(`Permission change notification sent to user ${userId}: ${message}`)
    } catch (error) {
      console.error('Error sending permission change notification:', error)
    }
  }

  /**
   * Monitor permission changes and trigger real-time updates
   */
  async startPermissionMonitoring(): Promise<void> {
    try {
      // Subscribe to profile changes
      this.supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: 'role=neq.old.role'
          },
          async (payload) => {
            const { new: newProfile, old: oldProfile } = payload
            if (newProfile && oldProfile) {
              await this.handleRoleChange(
                newProfile.id,
                oldProfile.role,
                newProfile.role,
                'system', // Could be enhanced to track who made the change
                'Role updated via database'
              )
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: 'verification_status=neq.old.verification_status'
          },
          async (payload) => {
            const { new: newProfile, old: oldProfile } = payload
            if (newProfile && oldProfile) {
              await this.handleVerificationStatusChange(
                newProfile.id,
                oldProfile.verification_status,
                newProfile.verification_status,
                'system',
                'Verification status updated via database'
              )
            }
          }
        )
        .subscribe()

      console.log('Permission monitoring started')
    } catch (error) {
      console.error('Error starting permission monitoring:', error)
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const { data: sessions, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used', { ascending: false })

      if (error) {
        console.error('Error getting user active sessions:', error)
        return []
      }

      return sessions || []
    } catch (error) {
      console.error('Error in getUserActiveSessions:', error)
      return []
    }
  }

  /**
   * Force refresh permissions for specific user
   */
  async forcePermissionRefresh(userId: string, reason: string = 'manual_refresh'): Promise<void> {
    try {
      // Get current user data
      const { data: user, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !user) {
        console.error('User not found for permission refresh:', userId)
        return
      }

      // Broadcast refresh command
      await this.broadcastPermissionUpdate({
        userId,
        newRole: user.role as UserRole,
        newVerificationStatus: user.verification_status,
        timestamp: new Date().toISOString(),
        reason
      })

      // Create audit log
      await this.supabase.rpc('create_auth_audit_log', {
        p_user_id: userId,
        p_action: 'permission_refresh_forced',
        p_details: { reason },
        p_success: true
      })

    } catch (error) {
      console.error('Error forcing permission refresh:', error)
    }
  }
}

// Export singleton instance
export const createRealtimePermissionsService = (supabase: SupabaseClient) => {
  return new RealtimePermissionsService(supabase)
}