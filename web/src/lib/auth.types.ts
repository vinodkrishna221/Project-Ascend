// Type aliases for easier use
export type UserRole = 'student' | 'aspirant' | 'guild_admin' | 'platform_admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended'
export type VerificationMethod = 'email' | 'college_database' | 'manual'
export type DomainVerificationType = 'automatic' | 'manual' | 'suspended' | 'database_only'

// JSON type for database
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Profile types
export interface Profile {
  id: string
  email: string | null
  name: string
  bio: string | null
  avatar_url: string | null
  role: UserRole
  college_id: string | null
  graduation_year: number | null
  verification_status: VerificationStatus
  verification_method: VerificationMethod
  college_database_id: string | null
  skills: Json
  created_at: string
  updated_at: string
  last_login: string | null
  login_count: number
}

export interface ProfileInsert {
  id: string
  email?: string | null
  name: string
  bio?: string | null
  avatar_url?: string | null
  role?: UserRole
  college_id?: string | null
  graduation_year?: number | null
  verification_status?: VerificationStatus
  verification_method?: VerificationMethod
  college_database_id?: string | null
  skills?: Json
  created_at?: string
  updated_at?: string
  last_login?: string | null
  login_count?: number
}

export interface ProfileUpdate {
  id?: string
  email?: string | null
  name?: string
  bio?: string | null
  avatar_url?: string | null
  role?: UserRole
  college_id?: string | null
  graduation_year?: number | null
  verification_status?: VerificationStatus
  verification_method?: VerificationMethod
  college_database_id?: string | null
  skills?: Json
  created_at?: string
  updated_at?: string
  last_login?: string | null
  login_count?: number
}

// College domain types
export interface CollegeDomain {
  id: string
  domain: string | null
  college_name: string
  country: string
  verification_type: DomainVerificationType
  provides_email: boolean
  is_active: boolean
  manual_review_required: boolean
  created_at: string
  verified_at: string | null
  verified_by: string | null
}

export interface CollegeDomainInsert {
  id?: string
  domain?: string | null
  college_name: string
  country?: string
  verification_type?: DomainVerificationType
  provides_email?: boolean
  is_active?: boolean
  manual_review_required?: boolean
  created_at?: string
  verified_at?: string | null
  verified_by?: string | null
}

export interface CollegeDomainUpdate {
  id?: string
  domain?: string | null
  college_name?: string
  country?: string
  verification_type?: DomainVerificationType
  provides_email?: boolean
  is_active?: boolean
  manual_review_required?: boolean
  created_at?: string
  verified_at?: string | null
  verified_by?: string | null
}

// College student database types
export interface CollegeStudentRecord {
  id: string
  college_id: string
  student_name: string
  branch: string
  year: number
  roll_number: string | null
  verification_password: string
  is_active: boolean
  created_at: string
  expires_at: string | null
  used_at: string | null
  used_by: string | null
}

export interface CollegeStudentRecordInsert {
  id?: string
  college_id: string
  student_name: string
  branch: string
  year: number
  roll_number?: string | null
  verification_password: string
  is_active?: boolean
  created_at?: string
  expires_at?: string | null
  used_at?: string | null
  used_by?: string | null
}

export interface CollegeStudentRecordUpdate {
  id?: string
  college_id?: string
  student_name?: string
  branch?: string
  year?: number
  roll_number?: string | null
  verification_password?: string
  is_active?: boolean
  created_at?: string
  expires_at?: string | null
  used_at?: string | null
  used_by?: string | null
}

// Email verification types
export interface EmailVerification {
  id: string
  email: string
  code: string
  attempts: number
  max_attempts: number
  created_at: string
  expires_at: string
  verified_at: string | null
  ip_address: string | null
  user_agent: string | null
}

export interface EmailVerificationInsert {
  id?: string
  email: string
  code: string
  attempts?: number
  max_attempts?: number
  created_at?: string
  expires_at?: string
  verified_at?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

export interface EmailVerificationUpdate {
  id?: string
  email?: string
  code?: string
  attempts?: number
  max_attempts?: number
  created_at?: string
  expires_at?: string
  verified_at?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

// User session types
export interface UserSession {
  id: string
  user_id: string
  refresh_token_hash: string
  device_info: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  expires_at: string
  last_used: string
  is_active: boolean
}

export interface UserSessionInsert {
  id?: string
  user_id: string
  refresh_token_hash: string
  device_info?: Json | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
  expires_at?: string
  last_used?: string
  is_active?: boolean
}

export interface UserSessionUpdate {
  id?: string
  user_id?: string
  refresh_token_hash?: string
  device_info?: Json | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
  expires_at?: string
  last_used?: string
  is_active?: boolean
}

// Auth audit log types
export interface AuthAuditLog {
  id: string
  user_id: string | null
  action: string
  details: Json | null
  ip_address: string | null
  user_agent: string | null
  success: boolean
  created_at: string
}

export interface AuthAuditLogInsert {
  id?: string
  user_id?: string | null
  action: string
  details?: Json | null
  ip_address?: string | null
  user_agent?: string | null
  success: boolean
  created_at?: string
}

// Authentication request/response types
export interface SignupRequest {
  email: string
  password: string
  name: string
  role: UserRole
}

export interface SignupResponse {
  success: boolean
  user?: Profile
  error?: string
}

export interface EmailVerificationRequest {
  email: string
  role?: 'student' | 'aspirant'
}

export interface EmailVerificationResponse {
  success: boolean
  message: string
  error?: string
}

export interface VerifyCodeRequest {
  email: string
  code: string
}

export interface VerifyCodeResponse {
  success: boolean
  user?: Profile
  tokens?: {
    access_token: string
    refresh_token: string
  }
  error?: string
}

export interface CollegeCredentialsRequest {
  college_id: string
  student_name: string
  branch: string
  year: number
  verification_password: string
  roll_number?: string
}

export interface CollegeCredentialsResponse {
  success: boolean
  user?: Profile
  tokens?: {
    access_token: string
    refresh_token: string
  }
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: Profile
  tokens?: {
    access_token: string
    refresh_token: string
  }
  error?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  success: boolean
  tokens?: {
    access_token: string
    refresh_token: string
  }
  error?: string
}

// Domain validation types
export interface DomainValidationResult {
  isValid: boolean
  college?: CollegeDomain
  requiresManualReview: boolean
  reason?: string
}

// College verification types
export interface CollegeVerificationResult {
  verified: boolean
  student_record?: CollegeStudentRecord
  error?: string
}

// Session validation types
export interface SessionValidation {
  valid: boolean
  user?: Profile
  error?: string
}

// Error types
export interface AuthError {
  code: string
  message: string
  details?: any
}

// Constants
export const USER_ROLES: Record<UserRole, string> = {
  student: 'Student',
  aspirant: 'Aspirant',
  guild_admin: 'Guild Admin',
  platform_admin: 'Platform Admin'
}

export const VERIFICATION_STATUSES: Record<VerificationStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended'
}

export const VERIFICATION_METHODS: Record<VerificationMethod, string> = {
  email: 'Email Verification',
  college_database: 'College Database',
  manual: 'Manual Verification'
}

export const DOMAIN_VERIFICATION_TYPES: Record<DomainVerificationType, string> = {
  automatic: 'Automatic',
  manual: 'Manual Review',
  suspended: 'Suspended',
  database_only: 'Database Only'
}

// Validation constants
export const VALIDATION_CONSTANTS = {
  EMAIL_VERIFICATION_CODE_LENGTH: 6,
  EMAIL_VERIFICATION_EXPIRY_MINUTES: 15,
  MAX_VERIFICATION_ATTEMPTS: 3,
  SESSION_EXPIRY_DAYS: 30,
  ACCESS_TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100
} as const