import { createClient } from '@supabase/supabase-js'
import { validateEnvironmentVariables } from './env.validation'

// Validate environment variables on import
validateEnvironmentVariables()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Service role client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types for our database schema
export interface Profile {
  id: string
  email: string | null
  name: string
  bio: string | null
  avatar_url: string | null
  role: 'student' | 'aspirant' | 'guild_admin' | 'platform_admin'
  college_id: string | null
  graduation_year: number | null
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  verification_method: 'email' | 'college_database' | 'manual'
  college_database_id: string | null
  skills: string[]
  created_at: string
  updated_at: string
}

export interface CollegeDomain {
  id: string
  domain: string | null
  college_name: string
  country: string
  verification_type: 'automatic' | 'manual' | 'suspended' | 'database_only'
  provides_email: boolean
  is_active: boolean
  manual_review_required: boolean
  created_at: string
  verified_at: string | null
  verified_by: string | null
}

export interface CollegeStudentDatabase {
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
