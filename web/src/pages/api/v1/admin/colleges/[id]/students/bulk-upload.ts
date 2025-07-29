import { NextApiRequest, NextApiResponse } from 'next';
import { AuthMiddleware } from '@/lib/auth.middleware';
import { CollegeAdminService } from '@/lib/college-admin.service';
import { validateRequestBody } from '@/lib/validation';
import { z } from 'zod';
import multer from 'multer';
import { promisify } from 'util';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const uploadMiddleware = promisify(upload.single('file'));

const BulkUploadSchema = z.object({
  validate_only: z.string().optional()
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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`
      }
    });
  }

  try {
    // Handle file upload
    await uploadMiddleware(req as any, res as any);

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'CSV file is required'
        }
      });
    }

    const validation = validateRequestBody(BulkUploadSchema, req.body);
    if (!validation.success || !validation.data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: validation.errors
        }
      });
    }

    const { validate_only: validateOnlyStr } = validation.data;
    const validate_only = validateOnlyStr === 'true';

    // Parse CSV content
    const csvContent = file.buffer.toString('utf-8');
    const parseResult = CollegeAdminService.parseCsvData(csvContent);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CSV_PARSE_ERROR',
          message: 'Failed to parse CSV file',
          details: parseResult.errors
        }
      });
    }

    // If validation only, return parsed data with any errors
    if (validate_only) {
      return res.status(200).json({
        success: true,
        data: {
          total_records: parseResult.data?.length || 0,
          valid_records: parseResult.data?.length || 0,
          errors: parseResult.errors || [],
          preview: parseResult.data?.slice(0, 5) // Show first 5 records as preview
        },
        message: 'CSV validation completed'
      });
    }

    // Get current user for tracking
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required'
        }
      });
    }

    // Perform bulk upload
    const uploadResult = await CollegeAdminService.bulkUploadStudents(
      collegeId,
      parseResult.data!,
      user.id
    );

    if (!uploadResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BULK_UPLOAD_FAILED',
          message: uploadResult.error
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        upload_id: uploadResult.uploadId,
        total_records: parseResult.data?.length || 0,
        parsing_errors: parseResult.errors || []
      },
      message: 'Bulk upload initiated successfully'
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: error.message
        }
      });
    }

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

// Disable Next.js body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};