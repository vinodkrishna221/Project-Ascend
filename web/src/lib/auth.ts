import { supabase } from './supabase'
import { z } from 'zod'

// Validation schemas
export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'aspirant'], {
    required_error: 'Please select your role',
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const emailVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const verificationCodeSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

export const collegeCredentialsSchema = z.object({
  college_id: z.string().min(1, 'Please select a college'),
  student_name: z.string().min(2, 'Please enter your full name'),
  branch: z.string().min(1, 'Please enter your branch/department'),
  year: z.number().min(2020).max(2030, 'Please enter a valid year'),
  verification_password: z.string().min(1, 'Verification password is required'),
  roll_number: z.string().optional(),
})

export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>
export type VerificationCodeFormData = z.infer<typeof verificationCodeSchema>
export type CollegeCredentialsFormData = z.infer<typeof collegeCredentialsSchema>

// Additional types for admin functionality
export interface CollegeDomain {
  id: string
  domain?: string
  college_name: string
  country: string
  provides_email: boolean
  is_active: boolean
  verification_type?: string
  created_at: string
}

// Auth service functions
export class AuthService {
  static async signUp(data: SignupFormData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        },
      },
    })

    if (error) throw error
    return authData
  }

  static async signIn(data: LoginFormData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) throw error
    return authData
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static async sendEmailVerification(email: string) {
    // This would call our Edge Function or API route
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send verification email')
    }

    return response.json()
  }

  static async verifyEmailCode(email: string, code: string) {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to verify code')
    }

    return response.json()
  }

  static async verifyCollegeCredentials(credentials: CollegeCredentialsFormData) {
    const response = await fetch('/api/auth/verify-college-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to verify college credentials')
    }

    return response.json()
  }

  static async getColleges() {
    const { data, error } = await supabase
      .from('college_domains')
      .select('*')
      .eq('is_active', true)
      .order('college_name')

    if (error) throw error
    return data
  }

  static async validateEmailDomain(email: string) {
    const domain = email.split('@')[1]
    
    const { data, error } = await supabase
      .from('college_domains')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}