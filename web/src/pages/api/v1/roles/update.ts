import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../lib/database.types'
import { UserRole } from '../../../../lib/auth.types'
import { createRoleManagementService } from '../../../../lib/role-management.service'
import { withPlatformAdmin, withValidation, AuthenticatedRequest } from '../../../../lib/permission.middleware'

interface UpdateRoleRequest {
  userId: string
  newRole: UserRole
  reason?: string
}

function validateUpdateRoleRequest(req: NextApiRequest) {
  const { userId, newRole, reason } = req.body

  const errors: string[] = []

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string')
  }

  if (!newRole || !['student', 'aspirant', 'guild_admin', 'platform_admin'].includes(newRole)) {
    errors.push('newRole is required and must be one of: student, aspirant, guild_admin, platform_admin')
  }

  if (reason && typeof reason !== 'string') {
    errors.push('reason must be a string if provided')
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: { userId, newRole, reason }
  }
}

/**
 * PUT /api/v1/roles/update
 * Update user role with real-time session updates
 * Requirements: 6.3, 6.4
 */
async function updateRoleHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only PUT method is allowed'
      }
    })
  }

  try {
    const { userId, newRole, reason } = req.validatedData as UpdateRoleRequest

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)

    // Update user role
    const result = await roleService.updateUserRole(
      userId,
      newRole,
      req.user!.id,
      reason
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_UPDATE_FAILED',
          message: result.error || 'Failed to update role'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        updatedRole: result.updatedRole,
        message: 'Role updated successfully. User sessions have been invalidated.'
      }
    })
  } catch (error) {
    console.error('Error in update role handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withPlatformAdmin(withValidation(validateUpdateRoleRequest)(updateRoleHandler))