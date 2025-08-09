import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../../lib/database.types'
import { createRoleManagementService } from '../../../../../lib/role-management.service'
import { withAuth, AuthenticatedRequest } from '../../../../../lib/permission.middleware'

/**
 * GET /api/v1/roles/permissions/user
 * Get current user's permissions based on role
 * Requirements: 6.4, 6.5
 */
async function getUserPermissionsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed'
      }
    })
  }

  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)

    // Get user permissions
    const permissions = await roleService.getUserPermissions(req.user!.id)

    if (!permissions) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PERMISSIONS_NOT_FOUND',
          message: 'User permissions not found or user not verified'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: req.user!.id,
        role: req.user!.role,
        permissions,
        verificationStatus: req.user!.verification_status
      }
    })
  } catch (error) {
    console.error('Error in get user permissions handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withAuth(getUserPermissionsHandler)