import { NextApiRequest, NextApiResponse } from 'next';
import { CollegeDatabaseVerificationService } from '@/lib/college-database-verification.service';
import { validateRequestBody } from '@/lib/validation';
import { z } from 'zod';

const CheckStudentSchema = z.object({
  student_name: z.string().min(2, 'Student name must be at least 2 characters'),
  branch: z.string().min(1, 'Branch is required'),
  year: z.number().int().min(1).max(6)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: collegeId } = req.query;

  if (!collegeId || typeof collegeId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COLLEGE_ID',
        message: 'Valid college ID is required'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });
  }

  try {
    // Validate request body
    const validation = validateRequestBody(CheckStudentSchema, req.body);
    if (!validation.success || !validation.data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.errors
        }
      });
    }

    const { student_name, branch, year } = validation.data;

    // Check if student exists
    const result = await CollegeDatabaseVerificationService.checkStudentExists(
      collegeId,
      student_name,
      branch,
      year
    );

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHECK_FAILED',
          message: result.error
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        exists: result.exists,
        used: result.used,
        available: result.exists && !result.used
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Check student API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}