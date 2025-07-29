import { z } from 'zod'
import { VALIDATION_CONSTANTS } from './auth.types'

// Email validation schema
export const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .min(1, 'Email is required')

// College email domain validation
export const collegeEmailSchema = z
  .string()
  .email('Please provide a valid email address')
  .refine(
    (email) => {
      const domain = email.split('@')[1]?.toLowerCase()
      // Basic check for educational domains (this would be enhanced with actual domain list)
      return domain && (
        domain.endsWith('.edu') || 
        domain.endsWith('.ac.in') || 
        domain.endsWith('.edu.in') ||
        domain.includes('iit') ||
        domain.includes('nit') ||
        domain.includes('iisc')
      )
    },
    'Please use your college email address'
  )

// Verification code schema
export const verificationCodeSchema = z
  .string()
  .length(VALIDATION_CONSTANTS.EMAIL_VERIFICATION_CODE_LENGTH, 
    `Verification code must be ${VALIDATION_CONSTANTS.EMAIL_VERIFICATION_CODE_LENGTH} characters`)
  .regex(/^[A-Z0-9]+$/, 'Verification code must contain only uppercase letters and numbers')

// Name validation schema
export const nameSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.NAME_MIN_LENGTH, 
    `Name must be at least ${VALIDATION_CONSTANTS.NAME_MIN_LENGTH} characters`)
  .max(VALIDATION_CONSTANTS.NAME_MAX_LENGTH, 
    `Name must be no more than ${VALIDATION_CONSTANTS.NAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, periods, apostrophes, and hyphens')

// Password validation schema
export const passwordSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH, 
    `Password must be at least ${VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH} characters`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number')

// College credentials validation schemas
export const collegeIdSchema = z
  .string()
  .uuid('Invalid college ID format')

export const studentNameSchema = nameSchema

export const branchSchema = z
  .string()
  .min(2, 'Branch must be at least 2 characters')
  .max(100, 'Branch must be no more than 100 characters')

export const yearSchema = z
  .number()
  .int('Year must be a whole number')
  .min(new Date().getFullYear() - 10, 'Please provide a valid graduation year')
  .max(new Date().getFullYear() + 5, 'Please provide a valid graduation year')

export const rollNumberSchema = z
  .string()
  .min(1, 'Roll number cannot be empty')
  .max(50, 'Roll number must be no more than 50 characters')
  .optional()

export const verificationPasswordSchema = z
  .string()
  .min(6, 'Verification password must be at least 6 characters')
  .max(100, 'Verification password must be no more than 100 characters')

// Combined schemas for API validation
export const emailVerificationRequestSchema = z.object({
  email: collegeEmailSchema
})

export const verifyCodeRequestSchema = z.object({
  email: collegeEmailSchema,
  code: verificationCodeSchema
})

export const collegeCredentialsRequestSchema = z.object({
  college_id: collegeIdSchema,
  student_name: studentNameSchema,
  branch: branchSchema,
  year: yearSchema,
  verification_password: verificationPasswordSchema,
  roll_number: rollNumberSchema
})

export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required')
})

// Utility function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: any): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Utility function to sanitize input
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

// Utility function to validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Utility function to validate email domain
export function extractEmailDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain || null
}

// Utility function to check if domain is educational
export function isEducationalDomain(domain: string): boolean {
  const educationalTlds = ['.edu', '.ac.in', '.edu.in']
  const educationalKeywords = ['iit', 'nit', 'iisc', 'university', 'college']
  
  return educationalTlds.some(tld => domain.endsWith(tld)) ||
         educationalKeywords.some(keyword => domain.includes(keyword))
}

// Simple email validation function
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  ip: z.string().ip(),
  endpoint: z.string(),
  timestamp: z.date()
})

// Common error messages
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_COLLEGE_EMAIL: 'Please use your college email address',
  INVALID_CODE: 'Please provide a valid verification code',
  INVALID_NAME: 'Please provide a valid name',
  INVALID_PASSWORD: 'Password does not meet requirements',
  INVALID_COLLEGE_ID: 'Invalid college ID',
  INVALID_YEAR: 'Please provide a valid graduation year',
  REQUIRED_FIELD: 'This field is required',
  TOO_SHORT: 'Input is too short',
  TOO_LONG: 'Input is too long'
} as const