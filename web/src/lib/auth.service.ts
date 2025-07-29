import { supabase, supabaseAdmin } from './supabase'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import {
  EmailVerificationRequest,
  EmailVerificationResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  CollegeCredentialsRequest,
  CollegeCredentialsResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  DomainValidationResult,
  CollegeVerificationResult,
  SessionValidation,
  Profile,
  CollegeStudentRecord,
  VALIDATION_CONSTANTS
} from './auth.types'
import { DomainValidationService } from './domain-validation.service'
import { EmailVerificationCodeService, EmailSendingService } from './email-verification.service'
import { CollegeDatabaseVerificationService } from './college-database-verification.service'

/**
 * Email domain validation service
 */
export class EmailVerificationService {
  /**
   * Validate if email domain is from an approved college
   */
  static async validateDomain(email: string): Promise<DomainValidationResult> {
    return DomainValidationService.validateDomain(email)
  }

  /**
   * Generate a random verification code
   */
  static generateVerificationCode(): string {
    return EmailVerificationCodeService.generateVerificationCode()
  }

  /**
   * Send verification code to email
   */
  static async sendVerificationCode(
    email: string, 
    code: string, 
    collegeName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Store verification code in database
      const storeResult = await EmailVerificationCodeService.storeVerificationCode(
        email, 
        code, 
        ipAddress, 
        userAgent
      )

      if (!storeResult.success) {
        return storeResult
      }

      // Send email
      const sendResult = await EmailSendingService.sendVerificationCode(email, code, collegeName)
      
      if (!sendResult.success) {
        return sendResult
      }

      return { success: true }
    } catch (error) {
      console.error('Send verification code error:', error)
      return { success: false, error: 'Failed to send verification code' }
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
  ): Promise<{ valid: boolean; error?: string; attemptsRemaining?: number }> {
    return EmailVerificationCodeService.validateCode(email, code, ipAddress, userAgent)
  }

  /**
   * Check if email can request new verification code
   */
  static async canRequestNewCode(email: string): Promise<{
    canRequest: boolean;
    error?: string;
    waitTime?: number;
  }> {
    return EmailVerificationCodeService.canRequestNewCode(email)
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
    return EmailVerificationCodeService.getVerificationStatus(email)
  }

  /**
   * Clean up expired verification codes
   */
  static async cleanupExpiredCodes(): Promise<number> {
    return EmailVerificationCodeService.cleanupExpiredCodes()
  }
}

/**
 * College database verification service
 */
export class CollegeDBVerificationService {
  /**
   * Verify student credentials against college database
   */
  static async verifyStudentCredentials(credentials: CollegeCredentialsRequest): Promise<CollegeVerificationResult> {
    try {
      const { college_id, student_name, branch, year, verification_password } = credentials

      // Look up student in college database
      const { data: studentRecord, error } = await supabaseAdmin
        .from('college_student_database')
        .select('*')
        .eq('college_id', college_id)
        .eq('student_name', student_name)
        .eq('branch', branch)
        .eq('year', year)
        .eq('is_active', true)
        .single()

      if (error || !studentRecord) {
        return {
          verified: false,
          error: 'Student not found in college database'
        }
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(verification_password, studentRecord.verification_password)

      if (!passwordMatch) {
        return {
          verified: false,
          error: 'Invalid verification password'
        }
      }

      // Check if already used
      if (studentRecord.used_at) {
        return {
          verified: false,
          error: 'These credentials have already been used to create an account'
        }
      }

      return {
        verified: true,
        student_record: studentRecord
      }
    } catch (error) {
      console.error('Student credentials verification error:', error)
      return {
        verified: false,
        error: 'Verification failed'
      }
    }
  }

  /**
   * Mark credentials as used
   */
  static async markCredentialsAsUsed(studentId: string, userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('college_student_database')
        .update({
          used_at: new Date().toISOString(),
          used_by: userId
        })
        .eq('id', studentId)
    } catch (error) {
      console.error('Mark credentials as used error:', error)
    }
  }

  /**
   * Add student record to college database
   */
  static async addStudentRecord(record: Omit<CollegeStudentRecord, 'id' | 'created_at' | 'used_at' | 'used_by'>): Promise<{ success: boolean; error?: string }> {
    try {
      // Hash the verification password
      const hashedPassword = await bcrypt.hash(record.verification_password, 12)

      const { error } = await supabaseAdmin
        .from('college_student_database')
        .insert({
          ...record,
          verification_password: hashedPassword
        })

      if (error) {
        console.error('Add student record error:', error)
        return { success: false, error: 'Failed to add student record' }
      }

      return { success: true }
    } catch (error) {
      console.error('Add student record error:', error)
      return { success: false, error: 'Failed to add student record' }
    }
  }
}

/**
 * Session management service
 */
export class SessionService {
  /**
   * Generate JWT tokens
   */
  static generateTokens(user: Profile): { access_token: string; refresh_token: string } {
    const jwtSecret = process.env.JWT_SECRET!

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status
      },
      jwtSecret,
      { expiresIn: `${VALIDATION_CONSTANTS.ACCESS_TOKEN_EXPIRY_HOURS}h` }
    )

    const refreshToken = jwt.sign(
      { sub: user.id },
      jwtSecret,
      { expiresIn: `${VALIDATION_CONSTANTS.SESSION_EXPIRY_DAYS}d` }
    )

    return { access_token: accessToken, refresh_token: refreshToken }
  }

  /**
   * Validate session token
   */
  static async validateSession(token: string): Promise<SessionValidation> {
    try {
      const jwtSecret = process.env.JWT_SECRET!
      const decoded = jwt.verify(token, jwtSecret) as any

      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.sub)
        .single()

      if (error || !user) {
        return { valid: false, error: 'User not found' }
      }

      return { valid: true, user }
    } catch (error) {
      console.error('Session validation error:', error)
      return { valid: false, error: 'Invalid session token' }
    }
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(userId: string, refreshToken: string, deviceInfo?: any): Promise<void> {
    try {
      const tokenHash = await bcrypt.hash(refreshToken, 10)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + VALIDATION_CONSTANTS.SESSION_EXPIRY_DAYS)

      await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: userId,
          refresh_token_hash: tokenHash,
          device_info: deviceInfo,
          expires_at: expiresAt.toISOString()
        })
    } catch (error) {
      console.error('Store refresh token error:', error)
    }
  }

  /**
   * Validate refresh token
   */
  static async validateRefreshToken(refreshToken: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const jwtSecret = process.env.JWT_SECRET!
      const decoded = jwt.verify(refreshToken, jwtSecret) as any

      const { data: sessions, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', decoded.sub)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (error || !sessions || sessions.length === 0) {
        return { valid: false }
      }

      // Check if any session matches the token hash
      for (const session of sessions) {
        const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash)
        if (isValid) {
          return { valid: true, userId: session.user_id }
        }
      }

      return { valid: false }
    } catch (error) {
      console.error('Refresh token validation error:', error)
      return { valid: false }
    }
  }

  /**
   * Revoke all user sessions
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Revoke all sessions error:', error)
    }
  }
}

/**
 * Main authentication service
 */
export class AuthService {
  /**
   * Initiate email verification
   */
  static async initiateEmailVerification(
    request: EmailVerificationRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<EmailVerificationResponse> {
    try {
      // Check rate limiting
      const rateLimitCheck = await EmailVerificationService.canRequestNewCode(request.email)
      
      if (!rateLimitCheck.canRequest) {
        return {
          success: false,
          message: rateLimitCheck.error || 'Rate limit exceeded',
          error: rateLimitCheck.error
        }
      }

      // Validate domain
      const domainValidation = await EmailVerificationService.validateDomain(request.email)
      
      if (!domainValidation.isValid) {
        return {
          success: false,
          message: domainValidation.reason || 'Invalid email domain',
          error: domainValidation.reason
        }
      }

      // Generate and send verification code
      const code = EmailVerificationService.generateVerificationCode()
      const sendResult = await EmailVerificationService.sendVerificationCode(
        request.email, 
        code, 
        domainValidation.college?.college_name,
        ipAddress,
        userAgent
      )

      if (!sendResult.success) {
        return {
          success: false,
          message: 'Failed to send verification code',
          error: sendResult.error
        }
      }

      return {
        success: true,
        message: 'Verification code sent successfully'
      }
    } catch (error) {
      console.error('Initiate email verification error:', error)
      return {
        success: false,
        message: 'Email verification failed',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Verify email code and create account
   */
  static async verifyEmailCode(
    request: VerifyCodeRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerifyCodeResponse> {
    try {
      // Validate code
      const codeValidation = await EmailVerificationService.validateCode(
        request.email, 
        request.code,
        ipAddress,
        userAgent
      )
      
      if (!codeValidation.valid) {
        return {
          success: false,
          error: codeValidation.error
        }
      }

      // Get domain info
      const domainValidation = await EmailVerificationService.validateDomain(request.email)
      
      if (!domainValidation.isValid || !domainValidation.college) {
        return {
          success: false,
          error: 'Invalid college domain'
        }
      }

      // Create user account (this would typically be done through Supabase Auth)
      // For now, we'll create a profile directly
      const userId = crypto.randomUUID()
      
      const profileData: any = {
        id: userId,
        email: request.email.toLowerCase().trim(),
        name: request.email.split('@')[0].trim(), // Temporary name
        verification_status: 'verified',
        verification_method: 'email',
        role: 'student' // Default role
      }

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Create profile error:', error)
        return {
          success: false,
          error: 'Failed to create user account'
        }
      }

      // Generate tokens
      const tokens = SessionService.generateTokens(user)
      
      // Store refresh token
      await SessionService.storeRefreshToken(user.id, tokens.refresh_token)

      // Send welcome email
      await EmailSendingService.sendWelcomeEmail(
        user.email!,
        user.name,
        domainValidation.college.college_name
      )

      return {
        success: true,
        user,
        tokens
      }
    } catch (error) {
      console.error('Verify email code error:', error)
      return {
        success: false,
        error: 'Email verification failed'
      }
    }
  }

  /**
   * Verify college credentials and create account
   */
  static async verifyCollegeCredentials(request: CollegeCredentialsRequest): Promise<CollegeCredentialsResponse> {
    try {
      // Validate credential format
      const formatValidation = CollegeDatabaseVerificationService.validateCredentialFormat(request)
      if (!formatValidation.valid) {
        return {
          success: false,
          error: formatValidation.errors.join(', ')
        }
      }

      // Verify credentials using the new service
      const verification = await CollegeDatabaseVerificationService.verifyCredentials(request)
      
      if (!verification.success) {
        // Log verification attempt for audit
        await CollegeDatabaseVerificationService.logVerificationAttempt(
          request,
          false,
          verification.error_code
        )
        
        return {
          success: false,
          error: verification.error
        }
      }

      // Create user account
      const userId = crypto.randomUUID()
      
      const profileData: any = {
        id: userId,
        name: request.student_name.trim(),
        verification_status: 'verified',
        verification_method: 'college_database',
        role: 'student',
        college_database_id: verification.student_id,
        college_id: request.college_id
      }

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Create profile error:', error)
        return {
          success: false,
          error: 'Failed to create user account'
        }
      }

      // Mark credentials as used
      const markResult = await CollegeDatabaseVerificationService.markCredentialsAsUsed(
        verification.student_id!,
        user.id
      )

      if (!markResult.success) {
        console.error('Failed to mark credentials as used:', markResult.error)
        // Continue anyway as user is already created
      }

      // Log successful verification
      await CollegeDatabaseVerificationService.logVerificationAttempt(
        request,
        true
      )

      // Generate tokens
      const tokens = SessionService.generateTokens(user)
      
      // Store refresh token
      await SessionService.storeRefreshToken(user.id, tokens.refresh_token)

      return {
        success: true,
        user,
        tokens
      }
    } catch (error) {
      console.error('Verify college credentials error:', error)
      
      // Log failed verification attempt
      await CollegeDatabaseVerificationService.logVerificationAttempt(
        request,
        false,
        'INTERNAL_ERROR'
      )
      
      return {
        success: false,
        error: 'College verification failed'
      }
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // Validate refresh token
      const validation = await SessionService.validateRefreshToken(request.refresh_token)
      
      if (!validation.valid || !validation.userId) {
        return {
          success: false,
          error: 'Invalid refresh token'
        }
      }

      // Get user profile
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', validation.userId)
        .single()

      if (error || !user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Generate new tokens
      const tokens = SessionService.generateTokens(user)
      
      // Store new refresh token
      await SessionService.storeRefreshToken(user.id, tokens.refresh_token)

      return {
        success: true,
        tokens
      }
    } catch (error) {
      console.error('Refresh token error:', error)
      return {
        success: false,
        error: 'Token refresh failed'
      }
    }
  }
}