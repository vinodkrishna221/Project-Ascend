import { NextApiRequest, NextApiResponse } from 'next';
import { AuthMiddleware } from '@/lib/auth.middleware';
import { CollegeAdminService } from '@/lib/college-admin.service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uploadId } = req.query;

  if (!uploadId || typeof uploadId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_UPLOAD_ID',
        message: 'Valid upload ID is required'
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
    const result = await CollegeAdminService.getUploadStatus(uploadId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'UPLOAD_NOT_FOUND',
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
    console.error('Upload status API error:', error);
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