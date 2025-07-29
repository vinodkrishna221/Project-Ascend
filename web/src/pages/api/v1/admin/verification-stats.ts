import { NextApiRequest, NextApiResponse } from 'next';
import { AuthMiddleware } from '@/lib/auth.middleware';
import { CollegeDatabaseVerificationService } from '@/lib/college-database-verification.service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });
  }

  try {
    const { college_id } = req.query;

    // Get verification statistics
    const result = await CollegeDatabaseVerificationService.getVerificationStats(
      college_id as string | undefined
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: result.error || 'Failed to get verification statistics'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        timestamp: new Date().toISOString(),
        college_id: college_id || 'all_colleges'
      }
    });

  } catch (error) {
    console.error('Verification stats API error:', error);
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