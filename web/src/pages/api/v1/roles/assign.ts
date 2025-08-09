import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../lib/database.types'
import { UserRole, VerificationMethod, VerificationStatus } from '../../../../lib/auth.types'
import { createRoleManagementService } from '../../../../lib/role-management.service'
import { withPlatformAdmin, withValidation } from '../../../../lib/permission.middleware'

interface AssignRoleRequest {
  userId: string
  verificationMethod: VerificationMethod
  verificationStatus: VerificationStatus
  collegeId?: string
}

function validateAssignRoleRequest(req: NextApiRequest) {
  const { userId, verificationMethod, verificationStatus, collegeId } = req.body

  const errors: string[] = []

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string')
  }

  if (!verificationMethod || !['email', 'college_database', 'manual'].includes(verificationMethod)) {
    errors.push('verificationMethod is required and must be one of: email, college_database, manual')
  }

  if (!verificationStatus || !['pending', 'verified', 'rejected', 'suspended'].includes(verificationStatus)) {
    errors.push('verificationStatus is required and must be one of: pending, verified, rejected, suspended')
  }

  if (collegeId && typeof collegeId !== 'string') {
    errors.push('collegeId must be a string if provided')
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: { userId, verificationMethod, verificationStatus, collegeId }
  }
}

/**
 * POST /api/v1/roles/assign
 * Assign role to user based on verification method and status
 * Requirements: 6.1, 6.2
 */
async function assignRoleHandler(req: NextApiRequest & { validatedData?: any }, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    })
  }

  try {
    const { userId, verificationMethod, verificationStatus, collegeId } = req.validatedData as AssignRoleRequest

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)

    // Assign role based on verification
    const result = await roleService.assignRoleBasedOnVerification(
      userId,
      verificationMethod,
      verificationStatus,
      collegeId
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_ASSIGNMENT_FAILED',
          message: result.error || 'Failed to assign role'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        assignedRole: result.role,
        message: 'Role assigned successfully'
      }
    })
  } catch (error) {
    console.error('Error in assign role handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withPlatformAdmin(withValidation(validateAssignRoleRequest)(assignRoleHandler))