import { NextApiRequest, NextApiResponse } from 'next';
import { AuthMiddleware } from '@/lib/auth.middleware';
import { CollegeAdminService } from '@/lib/college-admin.service';
import { validateRequestBody } from '@/lib/validation';
import { z } from 'zod';

const GetStudentsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  branch: z.string().optional(),
  year: z.string().optional(),
  is_active: z.string().optional(),
  used: z.string().optional()
});

const AddStudentSchema = z.object({
  student_name: z.string().min(1, 'Student name is required'),
  branch: z.string().min(1, 'Branch is required'),
  year: z.number().int().min(1).max(6),
  roll_number: z.string().optional(),
  verification_password: z.string().min(6, 'Password must be at least 6 characters'),
  expires_at: z.string().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetStudents(req, res, collegeId);
      case 'POST':
        return await handleAddStudent(req, res, collegeId);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${req.method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('College students API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetStudents(
  req: NextApiRequest,
  res: NextApiResponse,
  collegeId: string
) {
  const validation = validateRequestBody(GetStudentsSchema, req.query);
  if (!validation.success || !validation.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: validation.errors
      }
    });
  }

  const { page: pageStr, limit: limitStr, branch, year: yearStr, is_active: isActiveStr, used: usedStr } = validation.data;

  // Parse and validate parameters
  const page = pageStr ? parseInt(pageStr) : 1;
  const limit = limitStr ? parseInt(limitStr) : 50;
  const year = yearStr ? parseInt(yearStr) : undefined;
  const is_active = isActiveStr === 'true';
  const used = usedStr === 'true';

  const result = await CollegeAdminService.getCollegeStudents(
    collegeId,
    page,
    limit,
    { branch, year, is_active, used }
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: result.error
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
    meta: {
      pagination: {
        page,
        limit,
        total: result.total || 0,
        hasMore: (result.total || 0) > page * limit
      }
    }
  });
}

async function handleAddStudent(
  req: NextApiRequest,
  res: NextApiResponse,
  collegeId: string
) {
  const validation = validateRequestBody(AddStudentSchema, req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid student data',
        details: validation.errors
      }
    });
  }

  const studentData = {
    ...validation.data,
    expires_at: validation.data.expires_at ? new Date(validation.data.expires_at) : undefined
  };

  const result = await CollegeAdminService.addStudent(collegeId, studentData);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ADD_STUDENT_FAILED',
        message: result.error
      }
    });
  }

  return res.status(201).json({
    success: true,
    data: result.data,
    message: 'Student added successfully'
  });
}

export default AuthMiddleware.requirePlatformAdmin(handler);