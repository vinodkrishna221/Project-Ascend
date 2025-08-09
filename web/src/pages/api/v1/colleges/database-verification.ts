import { NextApiRequest, NextApiResponse } from 'next';
import { CollegeDatabaseVerificationService } from '@/lib/college-database-verification.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const result = await CollegeDatabaseVerificationService.getDatabaseVerificationColleges();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: result.error || 'Failed to fetch colleges'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        count: result.data?.length || 0,
        timestamp: new Date().toISOString(),
        description: 'Colleges that use database verification instead of email verification'
      }
    });

  } catch (error) {
    console.error('Database verification colleges API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}