import { supabase, supabaseAdmin } from './supabase'
import {
  EmailVerification,
  EmailVerificationInsert,
  EmailVerificationUpdate,
  VALIDATION_CONSTANTS
} from './auth.types'

/**
 * Email Verification Code Service
 * Handles secure verification code generation, storage, validation, and cleanup
 */
export class EmailVerificationCodeService {
  /**
   * Generate a secure random verification code
   */
  static generateVerificationCode(): string {
    // Generate a 6-digit numeric code for better user experience
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    return code
  }

  /**
   * Generate a more secure alphanumeric code (alternative)
   */
  static generateAlphanumericCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < VALIDATION_CONSTANTS.EMAIL_VERIFICATION_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Store verification code in database
   */
  static async storeVerificationCode(
    email: string, 
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string; verificationId?: string }> {
    try {
      // First, invalidate any existing active codes for this email
      await this.invalidateExistingCodes(email)

      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + VALIDATION_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_MINUTES)

      const verificationData: EmailVerificationInsert = {
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        max_attempts: VALIDATION_CONSTANTS.MAX_VERIFICATION_ATTEMPTS,
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      }

      const { data: verification, error } = await supabaseAdmin
        .from('email_verifications')
        .insert(verificationData)
        .select()
        .single()

      if (error) {
        console.error('Error storing verification code:', error)
        return { 
          success: false, 
          error: 'Failed to store verification code' 
        }
      }

      return { 
        success: true, 
        verificationId: verification.id 
      }
    } catch (error) {
      console.error('Store verification code error:', error)
      return { 
        success: false, 
        error: 'Failed to store verification code' 
      }
    }
  }

  /**
   * Validate verification code
   */
  static async validateCode(
    email: string, 
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ 
    valid: boolean; 
    error?: string; 
    attemptsRemaining?: number;
    isExpired?: boolean;
    isLocked?: boolean;
  }> {
    try {
      const { data: verification, error } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('email', email.toLowerCase())
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !verification) {
        return { 
          valid: false, 
          error: 'No active verification code found for this email' 
        }
      }

      // Check if code has expired
      const now = new Date()
      const expiresAt = new Date(verification.expires_at)
      if (now > expiresAt) {
        return { 
          valid: false, 
          error: 'Verification code has expired. Please request a new code.',
          isExpired: true
        }
      }

      // Check if max attempts exceeded
      if (verification.attempts >= verification.max_attempts) {
        return { 
          valid: false, 
          error: 'Maximum verification attempts exceeded. Please request a new code.',
          isLocked: true
        }
      }

      // Increment attempt count
      const newAttempts = verification.attempts + 1
      const attemptsRemaining = verification.max_attempts - newAttempts

      // Check if code matches
      if (verification.code !== code) {
        // Update attempt count
        await supabaseAdmin
          .from('email_verifications')
          .update({ 
            attempts: newAttempts,
            ip_address: ipAddress || verification.ip_address,
            user_agent: userAgent || verification.user_agent
          })
          .eq('id', verification.id)

        return { 
          valid: false, 
          error: `Invalid verification code. ${attemptsRemaining} attempts remaining.`,
          attemptsRemaining
        }
      }

      // Code is valid - mark as verified
      await supabaseAdmin
        .from('email_verifications')
        .update({ 
          verified_at: now.toISOString(),
          attempts: newAttempts,
          ip_address: ipAddress || verification.ip_address,
          user_agent: userAgent || verification.user_agent
        })
        .eq('id', verification.id)

      return { valid: true }
    } catch (error) {
      console.error('Code validation error:', error)
      return { 
        valid: false, 
        error: 'Code validation service temporarily unavailable' 
      }
    }
  }

  /**
   * Check if email can request new verification code (rate limiting)
   */
  static async canRequestNewCode(email: string): Promise<{
    canRequest: boolean;
    error?: string;
    waitTime?: number; // seconds to wait
  }> {
    try {
      // Check for recent verification requests (within last 1 minute)
      const oneMinuteAgo = new Date()
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)

      const { data: recentVerifications, error } = await supabaseAdmin
        .from('email_verifications')
        .select('created_at')
        .eq('email', email.toLowerCase())
        .gte('created_at', oneMinuteAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Rate limit check error:', error)
        return { canRequest: true } // Allow on error to not block users
      }

      if (recentVerifications && recentVerifications.length > 0) {
        const lastRequest = new Date(recentVerifications[0].created_at)
        const timeDiff = (new Date().getTime() - lastRequest.getTime()) / 1000
        const waitTime = 60 - Math.floor(timeDiff)

        if (waitTime > 0) {
          return {
            canRequest: false,
            error: `Please wait ${waitTime} seconds before requesting a new code`,
            waitTime
          }
        }
      }

      // Check for excessive requests in the last hour (max 5 requests)
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const { data: hourlyVerifications, error: hourlyError } = await supabaseAdmin
        .from('email_verifications')
        .select('id')
        .eq('email', email.toLowerCase())
        .gte('created_at', oneHourAgo.toISOString())

      if (hourlyError) {
        console.error('Hourly rate limit check error:', hourlyError)
        return { canRequest: true } // Allow on error
      }

      if (hourlyVerifications && hourlyVerifications.length >= 5) {
        return {
          canRequest: false,
          error: 'Too many verification requests. Please try again in an hour.',
          waitTime: 3600 // 1 hour
        }
      }

      return { canRequest: true }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { canRequest: true } // Allow on error to not block users
    }
  }

  /**
   * Invalidate existing active codes for an email
   */
  static async invalidateExistingCodes(email: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('email_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('email', email.toLowerCase())
        .is('verified_at', null)
    } catch (error) {
      console.error('Invalidate existing codes error:', error)
      // Don't throw error as this is a cleanup operation
    }
  }

  /**
   * Get verification status for an email
   */
  static async getVerificationStatus(email: string): Promise<{
    hasActiveCode: boolean;
    attemptsRemaining?: number;
    expiresAt?: string;
    isExpired?: boolean;
    isLocked?: boolean;
  }> {
    try {
      const { data: verification, error } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('email', email.toLowerCase())
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !verification) {
        return { hasActiveCode: false }
      }

      const now = new Date()
      const expiresAt = new Date(verification.expires_at)
      const isExpired = now > expiresAt
      const isLocked = verification.attempts >= verification.max_attempts
      const attemptsRemaining = verification.max_attempts - verification.attempts

      return {
        hasActiveCode: !isExpired && !isLocked,
        attemptsRemaining: isLocked ? 0 : attemptsRemaining,
        expiresAt: verification.expires_at,
        isExpired,
        isLocked
      }
    } catch (error) {
      console.error('Get verification status error:', error)
      return { hasActiveCode: false }
    }
  }

  /**
   * Clean up expired verification codes
   */
  static async cleanupExpiredCodes(): Promise<number> {
    try {
      const { data } = await supabaseAdmin
        .rpc('cleanup_expired_email_verifications')

      return data || 0
    } catch (error) {
      console.error('Cleanup expired codes error:', error)
      return 0
    }
  }

  /**
   * Clean up old verified codes (older than 24 hours)
   */
  static async cleanupOldVerifiedCodes(): Promise<number> {
    try {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { data: deletedCodes, error } = await supabaseAdmin
        .from('email_verifications')
        .delete()
        .not('verified_at', 'is', null)
        .lt('verified_at', oneDayAgo.toISOString())
        .select('id')

      if (error) {
        console.error('Cleanup old verified codes error:', error)
        return 0
      }

      return deletedCodes?.length || 0
    } catch (error) {
      console.error('Cleanup old verified codes error:', error)
      return 0
    }
  }

  /**
   * Get verification statistics (for monitoring)
   */
  static async getVerificationStatistics(): Promise<{
    totalActive: number;
    totalExpired: number;
    totalLocked: number;
    totalVerified: number;
    averageAttempts: number;
  }> {
    try {
      const { data: verifications, error } = await supabaseAdmin
        .from('email_verifications')
        .select('attempts, expires_at, verified_at, max_attempts')

      if (error || !verifications) {
        return {
          totalActive: 0,
          totalExpired: 0,
          totalLocked: 0,
          totalVerified: 0,
          averageAttempts: 0
        }
      }

      const now = new Date()
      let totalActive = 0
      let totalExpired = 0
      let totalLocked = 0
      let totalVerified = 0
      let totalAttempts = 0

      verifications.forEach(v => {
        totalAttempts += v.attempts

        if (v.verified_at) {
          totalVerified++
        } else {
          const isExpired = now > new Date(v.expires_at)
          const isLocked = v.attempts >= v.max_attempts

          if (isExpired) {
            totalExpired++
          } else if (isLocked) {
            totalLocked++
          } else {
            totalActive++
          }
        }
      })

      return {
        totalActive,
        totalExpired,
        totalLocked,
        totalVerified,
        averageAttempts: verifications.length > 0 ? totalAttempts / verifications.length : 0
      }
    } catch (error) {
      console.error('Get verification statistics error:', error)
      return {
        totalActive: 0,
        totalExpired: 0,
        totalLocked: 0,
        totalVerified: 0,
        averageAttempts: 0
      }
    }
  }
}

/**
 * Email Sending Service
 * Handles integration with transactional email providers
 */
export class EmailSendingService {
  /**
   * Send verification code email
   */
  static async sendVerificationCode(
    email: string, 
    code: string, 
    collegeName?: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // TODO: Integrate with actual email service (SendGrid, AWS SES, Resend, etc.)
      // For now, we'll simulate email sending and log the code for development
      
      const emailContent = this.generateVerificationEmailContent(code, collegeName)
      
      // In development, log the email content
      if (process.env.NODE_ENV === 'development') {
        console.log('=== EMAIL VERIFICATION CODE ===')
        console.log(`To: ${email}`)
        console.log(`Subject: ${emailContent.subject}`)
        console.log(`Code: ${code}`)
        console.log('===============================')
      }

      // TODO: Replace with actual email service integration
      // Example with SendGrid:
      /*
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      
      const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
      
      const [response] = await sgMail.send(msg)
      return { 
        success: true, 
        messageId: response.headers['x-message-id'] 
      }
      */

      // Simulate successful email sending
      return { 
        success: true, 
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      }
    } catch (error) {
      console.error('Send verification email error:', error)
      return { 
        success: false, 
        error: 'Failed to send verification email' 
      }
    }
  }

  /**
   * Generate email content for verification code
   */
  private static generateVerificationEmailContent(code: string, collegeName?: string): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = 'Verify your email for Ascend'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
          .code-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #2563EB; letter-spacing: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Ascend</div>
            <h1>Verify your email address</h1>
          </div>
          
          <p>Hi there!</p>
          
          <p>Welcome to Ascend, the student-only social network! ${collegeName ? `We're excited to have you join from ${collegeName}.` : ''}</p>
          
          <p>To complete your registration, please enter the verification code below:</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p>This code will expire in ${VALIDATION_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes for security reasons.</p>
          
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Ascend Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
      Ascend - Verify your email address
      
      Hi there!
      
      Welcome to Ascend, the student-only social network! ${collegeName ? `We're excited to have you join from ${collegeName}.` : ''}
      
      To complete your registration, please enter the verification code below:
      
      ${code}
      
      This code will expire in ${VALIDATION_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes for security reasons.
      
      If you didn't request this verification, you can safely ignore this email.
      
      Best regards,
      The Ascend Team
      
      This is an automated message. Please do not reply to this email.
    `

    return { subject, html, text }
  }

  /**
   * Send welcome email after successful verification
   */
  static async sendWelcomeEmail(
    email: string, 
    name: string, 
    collegeName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement welcome email sending
      console.log(`Welcome email would be sent to ${name} (${email}) from ${collegeName}`)
      return { success: true }
    } catch (error) {
      console.error('Send welcome email error:', error)
      return { success: false, error: 'Failed to send welcome email' }
    }
  }
}