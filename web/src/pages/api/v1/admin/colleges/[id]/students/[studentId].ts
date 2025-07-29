import { NextApiRequest, NextApiResponse } from 'next';
import { AuthMiddleware } from '@/lib/auth.middleware';
import { CollegeAdminService } from '@/lib/college-admin.service';
import { validateRequestBody } from '@/lib/validation';
import { z } from 'zod';

const UpdateStudentSchema = z.object({
  is_active: z.boolean()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: collegeId, studentId } = req.query;

  if (!collegeId || typeof collegeId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COLLEGE_ID',
        message: 'Valid college ID is required'
      }
    });
  }

  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STUDENT_ID',
        message: 'Valid student ID is required'
      }
    });
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await handleUpdateStudent(req, res, studentId);
      case 'DELETE':
        return await handleDeleteStudent(req, res, studentId);
      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${req.method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Student management API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleUpdateStudent(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  const validation = validateRequestBody(UpdateStudentSchema, req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid update data',
        details: validation.errors
      }
    });
  }

  const { is_active } = validation.data;

  const result = await CollegeAdminService.updateStudentStatus(studentId, is_active);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: result.error
      }
    });
  }

  return res.status(200).json({
    success: true,
    message: `Student ${is_active ? 'activated' : 'deactivated'} successfully`
  });
}

async function handleDeleteStudent(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  const result = await CollegeAdminService.deleteStudent(studentId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: result.error
      }
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Student deleted successfully'
  });
}

export default AuthMiddleware.requirePlatformAdmin(handler);