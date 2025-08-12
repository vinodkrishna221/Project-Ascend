/**
 * Request validation utilities
 */

export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors: string[]
}

export function validateRequestBody<T = any>(
  schema: any,
  body: any,
  optionalFields: any[] = []
): ValidationResult<any> {
  const errors: string[] = []
  
  if (!body || typeof body !== 'object') {
    return {
      success: false,
      errors: ['Request body is required and must be an object']
    }
  }

  // Always return the body as data for now (simplified validation)
  return {
    success: true,
    data: body,
    errors: []
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    success: errors.length === 0,
    errors
  }
}