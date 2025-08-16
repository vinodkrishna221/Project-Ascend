import { NextApiRequest, NextApiResponse } from 'next'
import { authService } from '@/lib/auth.service'
import { CollegeDatabaseVerificationService } from '@/lib/college-database-verification.service'
import { validateRequestBody } from '@/lib/validation'
import { z } from 'zod'

const CollegeCredentialsSchema = z.object({
  college_id: z.string().uuid('Invalid college ID format'),
  student_name: z.string().min(2, 'Student name must be at least 2 characters').max(100, 'Student name must be less than 100 characters'),
  branch: z.string().min(1, 'Branch is required').max(50, 'Branch must be less than 50 characters'),
  year: z.number().int().min(1, 'Year must be between 1 and 6').max(6, 'Year must be between 1 and 6'),
  verification_password: z.string().min(6, 'Verification password must be at least 6 characters'),
  roll_number: z.string().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    })
  }

  try {
    // Validate request body
    const validation = validateRequestBody(CollegeCredentialsSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.errors
        }
      })
    }

    const credentials = validation.data!
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request data is required'
        }
      })
    }

    // Get client IP and user agent for audit logging
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.socket?.remoteAddress || 
                     'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Check if college exists and supports database verification
    const collegeInfo = await CollegeDatabaseVerificationService.getCollegeInfo(credentials.college_id)
    if (!collegeInfo.success) {
      await CollegeDatabaseVerificationService.logVerificationAttempt(
        credentials,
        false,
        'INVALID_COLLEGE',
        ipAddress,
        userAgent
      )
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COLLEGE',
          message: 'Invalid or inactive college'
        }
      })
    }

    if (collegeInfo.data?.provides_email) {
      await CollegeDatabaseVerificationService.logVerificationAttempt(
        credentials,
        false,
        'EMAIL_VERIFICATION_REQUIRED',
        ipAddress,
        userAgent
      )
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'This college requires email verification, not database verification'
        }
      })
    }

    // Check if student already exists and has been used
    const existsCheck = await CollegeDatabaseVerificationService.checkStudentExists(
      credentials.college_id,
      credentials.student_name,
      credentials.branch,
      credentials.year
    )

    if (existsCheck.exists && existsCheck.used) {
      await CollegeDatabaseVerificationService.logVerificationAttempt(
        credentials,
        false,
        'CREDENTIALS_ALREADY_USED',
        ipAddress,
        userAgent
      )
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'CREDENTIALS_ALREADY_USED',
          message: 'These credentials have already been used to create an account'
        }
      })
    }

    // Attempt verification
    const result = await authService.verifyCollegeCredentials(credentials)

    if (!result.success) {
      // Determine appropriate HTTP status code based on error
      let statusCode = 400
      let errorCode = 'COLLEGE_VERIFICATION_FAILED'

      if (result.error?.message?.includes('not found')) {
        statusCode = 404
        errorCode = 'STUDENT_NOT_FOUND'
      } else if (result.error?.message?.includes('Invalid verification password')) {
        statusCode = 401
        errorCode = 'INVALID_PASSWORD'
      } else if (result.error?.message?.includes('already been used')) {
        statusCode = 409
        errorCode = 'CREDENTIALS_ALREADY_USED'
      } else if (result.error?.message?.includes('expired')) {
        statusCode = 410
        errorCode = 'CREDENTIALS_EXPIRED'
      }

      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: result.error?.message || 'College verification failed'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.data?.user,
        tokens: result.data?.tokens
      },
      meta: {
        timestamp: new Date().toISOString(),
        verification_method: 'college_database'
      }
    })
  } catch (error) {
    console.error('College credentials verification API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    })
  }
}