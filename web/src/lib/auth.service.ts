import { supabase, supabaseAdmin } from './supabase'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
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
  CollegeStudentRecord
} from './auth.types'
import { DomainValidationService } from './domain-validation.service'
import { EmailVerificationCodeService, EmailSendingService } from './email-verification.service'
import { CollegeDatabaseVerificationService } from './college-database-verification.service'
import { jwtTokenService } from './jwt-token.service'

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
   * Check if user can request new code
   */
  static async canRequestNewCode(email: string): Promise<{
    canRequest: boolean;
    error?: string;
    timeRemaining?: number;
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
   * Generate JWT tokens using the new JWT token service
   */
  static async generateTokens(
    user: Profile, 
    deviceInfo?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokens = await jwtTokenService.createSession(user.id, deviceInfo)
    
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    }
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
   * @deprecated Use jwtTokenService.createSession() instead
   * Store refresh token - Legacy method, will be removed
   */
  static async storeRefreshToken(_userId: string, _refreshToken: string, _deviceInfo?: any): Promise<void> {
    // This method is deprecated - JWT token service handles session storage automatically
    console.warn('storeRefreshToken is deprecated - JWT token service handles this automatically')
  }

  /**
   * @deprecated Use jwtTokenService.validateSession() instead
   * Validate refresh token - Legacy method, will be removed
   */
  static async validateRefreshToken(_refreshToken: string): Promise<{ valid: boolean; userId?: string }> {
    // This method is deprecated - use JWT token service instead
    console.warn('validateRefreshToken is deprecated - use jwtTokenService.validateSession() instead')
    return { valid: false }
  }

  /**
   * Revoke all user sessions using JWT token service
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await jwtTokenService.revokeAllUserSessions(userId)
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
      const userId = randomUUID()
      
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

      // Generate tokens using JWT token service
      const tokens = await SessionService.generateTokens(user)

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
      const userId = randomUUID()
      
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

      // Generate tokens using JWT token service
      const tokens = await SessionService.generateTokens(user)

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
   * Refresh access token using JWT token service
   */
  static async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // Use the new JWT token service for refresh
      const tokens = await jwtTokenService.refreshSession(request.refresh_token)

      return {
        success: true,
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken
        }
      }
    } catch (error) {
      console.error('Refresh token error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }
    }
  }
}