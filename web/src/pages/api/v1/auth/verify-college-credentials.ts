import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '../../../../lib/auth.service'
import { CollegeCredentialsRequest } from '../../../../lib/auth.types'

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
    const { 
      college_id, 
      student_name, 
      branch, 
      year, 
      verification_password,
      roll_number 
    }: CollegeCredentialsRequest = req.body

    // Validate required input
    if (!college_id || !student_name || !branch || !year || !verification_password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'College ID, student name, branch, year, and verification password are required'
        }
      })
    }

    // Validate types
    if (typeof college_id !== 'string' || 
        typeof student_name !== 'string' || 
        typeof branch !== 'string' || 
        typeof year !== 'number' || 
        typeof verification_password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT_TYPES',
          message: 'Invalid input types provided'
        }
      })
    }

    // Validate year range (reasonable college years)
    const currentYear = new Date().getFullYear()
    if (year < currentYear - 10 || year > currentYear + 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_YEAR',
          message: 'Please provide a valid graduation year'
        }
      })
    }

    // Validate student name length
    if (student_name.trim().length < 2 || student_name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME_LENGTH',
          message: 'Student name must be between 2 and 100 characters'
        }
      })
    }

    // Validate verification password length
    if (verification_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD_LENGTH',
          message: 'Verification password must be at least 6 characters'
        }
      })
    }

    const result = await AuthService.verifyCollegeCredentials({
      college_id,
      student_name: student_name.trim(),
      branch: branch.trim(),
      year,
      verification_password,
      roll_number: roll_number?.trim()
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COLLEGE_VERIFICATION_FAILED',
          message: result.error || 'College verification failed'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      },
      meta: {
        timestamp: new Date().toISOString()
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