import * as jwt from 'jsonwebtoken'
import { supabaseAdmin } from './supabase'
import { UserRole, VerificationStatus } from './auth.types'

interface TokenPayload {
  sub: string // User ID
  email?: string // Verified email (nullable for college database verification)
  role: UserRole
  college_id?: string
  verification_status: VerificationStatus
  verification_method: 'email' | 'college_database' | 'manual'
  iat: number // Issued at
  exp: number // Expires at
}

interface SessionTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  refreshExpiresAt: Date
}

interface DeviceInfo {
  userAgent?: string
  ipAddress?: string
  platform?: string
}

interface SessionValidation {
  isValid: boolean
  payload?: TokenPayload
  error?: string
}

export class JWTTokenService {
  private readonly JWT_SECRET: string
  private readonly ACCESS_TOKEN_EXPIRY = '24h' // 24 hours
  private readonly REFRESH_TOKEN_EXPIRY = '30d' // 30 days

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET!
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required')
    }
  }

  /**
   * Create a new session with access and refresh tokens
   */
  async createSession(
    userId: string,
    deviceInfo: DeviceInfo = {}
  ): Promise<SessionTokens> {
    try {
      // Get user profile data
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        throw new Error('User profile not found')
      }

      // Create access token payload
      const accessPayload: TokenPayload = {
        sub: userId,
        email: profile.email,
        role: profile.role,
        college_id: profile.college_id,
        verification_status: profile.verification_status,
        verification_method: profile.verification_method,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }

      // Generate tokens
      const accessToken = jwt.sign(accessPayload, this.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: this.ACCESS_TOKEN_EXPIRY
      })

      const refreshToken = jwt.sign(
        { sub: userId, type: 'refresh' },
        this.JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: this.REFRESH_TOKEN_EXPIRY
        }
      )

      // Store refresh token in database
      const refreshTokenHash = await this.hashToken(refreshToken)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const { error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: userId,
          refresh_token_hash: refreshTokenHash,
          device_info: deviceInfo,
          ip_address: deviceInfo.ipAddress,
          user_agent: deviceInfo.userAgent,
          expires_at: refreshExpiresAt.toISOString()
        })

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`)
      }

      return {
        accessToken,
        refreshToken,
        expiresAt,
        refreshExpiresAt
      }
    } catch (error) {
      throw new Error(`Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Refresh an access token using a valid refresh token
   */
  async refreshSession(refreshToken: string): Promise<SessionTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      const userId = decoded.sub

      // Check if refresh token exists in database
      const refreshTokenHash = await this.hashToken(refreshToken)
      const { data: session, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('refresh_token_hash', refreshTokenHash)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        throw new Error('Invalid refresh token')
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        // Clean up expired session
        await this.revokeSession(session.id)
        throw new Error('Refresh token expired')
      }

      // Create new session tokens (token rotation)
      const newTokens = await this.createSession(userId, {
        userAgent: session.user_agent,
        ipAddress: session.ip_address
      })

      // Revoke old refresh token
      await this.revokeSession(session.id)

      return newTokens
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate an access token
   */
  async validateSession(accessToken: string): Promise<SessionValidation> {
    try {
      const decoded = jwt.verify(accessToken, this.JWT_SECRET) as TokenPayload

      // Additional validation: check if user still exists and is verified
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('verification_status, role')
        .eq('id', decoded.sub)
        .single()

      if (error || !profile) {
        return {
          isValid: false,
          error: 'User not found'
        }
      }

      // Check if user is still verified
      if (profile.verification_status !== 'verified') {
        return {
          isValid: false,
          error: 'User verification status changed'
        }
      }

      return {
        isValid: true,
        payload: decoded
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Token expired'
        }
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          isValid: false,
          error: 'Invalid token'
        }
      }

      return {
        isValid: false,
        error: 'Token validation failed'
      }
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      if (error) {
        throw new Error(`Failed to revoke session: ${error.message}`)
      }
    } catch (error) {
      throw new Error(`Session revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to revoke user sessions: ${error.message}`)
      }
    } catch (error) {
      throw new Error(`User session revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Detect suspicious activity based on session patterns
   */
  async detectSuspiciousActivity(
    userId: string,
    _currentDeviceInfo: DeviceInfo
  ): Promise<{ suspicious: boolean; reason?: string }> {
    try {
      // Get recent active sessions
      const { data: sessions, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('last_used', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (error) {
        throw new Error(`Failed to check sessions: ${error.message}`)
      }

      // Check for multiple concurrent sessions from different locations
      const uniqueIPs = new Set(sessions?.map(s => s.ip_address).filter(Boolean))
      if (uniqueIPs.size > 3) {
        return {
          suspicious: true,
          reason: 'Multiple concurrent sessions from different IP addresses'
        }
      }

      // Check for rapid session creation
      const recentSessions = sessions?.filter(s =>
        new Date(s.created_at) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      )
      if (recentSessions && recentSessions.length > 5) {
        return {
          suspicious: true,
          reason: 'Rapid session creation detected'
        }
      }

      return { suspicious: false }
    } catch (error) {
      // Log error but don't fail the check
      console.error('Suspicious activity detection failed:', error)
      return { suspicious: false }
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())

      if (error) {
        throw new Error(`Failed to cleanup expired sessions: ${error.message}`)
      }
    } catch (error) {
      console.error('Session cleanup failed:', error)
    }
  }

  /**
   * Hash a token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const crypto = await import('crypto')
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Verify JWT token and return payload (for middleware use)
   */
  async verifyJWT(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload
      return decoded
    } catch (error) {
      return null
    }
  }

  /**
   * Get user sessions for management
   */
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const { data: sessions, error } = await supabaseAdmin
        .from('user_sessions')
        .select('id, device_info, ip_address, created_at, last_used, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used', { ascending: false })

      if (error) {
        throw new Error(`Failed to get user sessions: ${error.message}`)
      }

      return sessions || []
    } catch (error) {
      throw new Error(`Get user sessions failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance
export const jwtTokenService = new JWTTokenService()

// Export standalone function for middleware use
export const verifyJWT = (token: string): Promise<TokenPayload | null> => {
  return jwtTokenService.verifyJWT(token)
}