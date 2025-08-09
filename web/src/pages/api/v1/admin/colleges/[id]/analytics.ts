import { NextApiRequest, NextApiResponse } from 'next';
import { AuthMiddleware } from '@/lib/auth.middleware';
import { CollegeAdminService } from '@/lib/college-admin.service';

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

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`
      }
    });
  }

  try {
    const result = await CollegeAdminService.getCollegeAnalytics(collegeId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: result.error
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('College analytics API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

export default AuthMiddleware.requirePlatformAdmin(handler);