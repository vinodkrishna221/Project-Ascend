import { EmailVerificationCodeService } from './email-verification.service'

import { jwtTokenService } from './jwt-token.service'

/**
 * Cleanup Service
 * Handles periodic cleanup of expired data
 */
export class CleanupService {
  /**
   * Run all cleanup tasks
   */
  static async runAllCleanupTasks(): Promise<{
    expiredCodes: number;
    oldVerifiedCodes: number;
    expiredSessions: number;
  }> {
    try {
      console.log('Starting cleanup tasks...')

      const [expiredCodes, oldVerifiedCodes, expiredSessions] = await Promise.all([
        EmailVerificationCodeService.cleanupExpiredCodes(),
        EmailVerificationCodeService.cleanupOldVerifiedCodes(),
        this.cleanupExpiredSessions()
      ])

      console.log('Cleanup completed:', {
        expiredCodes,
        oldVerifiedCodes,
        expiredSessions
      })

      return {
        expiredCodes,
        oldVerifiedCodes,
        expiredSessions
      }
    } catch (error) {
      console.error('Cleanup tasks error:', error)
      return {
        expiredCodes: 0,
        oldVerifiedCodes: 0,
        expiredSessions: 0
      }
    }
  }

  /**
   * Clean up expired user sessions using JWT token service
   */
  private static async cleanupExpiredSessions(): Promise<number> {
    try {
      // Use the JWT token service cleanup method
      await jwtTokenService.cleanupExpiredSessions()
      
      // Count how many sessions were cleaned up
      const { count } = await supabaseAdmin
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)
        .lt('expires_at', new Date().toISOString())

      return count || 0
    } catch (error) {
      console.error('Cleanup expired sessions error:', error)
      return 0
    }
  }

  /**
   * Schedule cleanup to run periodically
   */
  static scheduleCleanup(): void {
    // Run cleanup every hour
    setInterval(async () => {
      await this.runAllCleanupTasks()
    }, 60 * 60 * 1000) // 1 hour

    // Run initial cleanup
    setTimeout(() => {
      this.runAllCleanupTasks()
    }, 5000) // 5 seconds after startup
  }
}

// Import supabaseAdmin
import { supabaseAdmin } from './supabase'