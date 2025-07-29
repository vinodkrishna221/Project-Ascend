import { EmailVerificationCodeService } from './email-verification.service'
import { SessionService } from './auth.service'

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
   * Clean up expired user sessions
   */
  private static async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data } = await supabaseAdmin
        .rpc('cleanup_expired_user_sessions')

      return data || 0
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