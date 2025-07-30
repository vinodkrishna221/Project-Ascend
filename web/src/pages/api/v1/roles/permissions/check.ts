import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../../lib/database.types'
import { createRoleManagementService, Permission } from '../../../../../lib/role-management.service'
import { withAuth, AuthenticatedRequest } from '../../../../../lib/permission.middleware'

interface CheckPermissionRequest {
  permission: Permission
  context?: {
    guildId?: string
    communityId?: string
    resourceId?: string
  }
}

/**
 * POST /api/v1/roles/permissions/check
 * Check if user has specific permission
 * Requirements: 6.4, 6.5
 */
async function checkPermissionHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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
    const { permission, context } = req.body as CheckPermissionRequest

    if (!permission) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PERMISSION',
          message: 'Permission parameter is required'
        }
      })
    }

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)

    // Check permission
    const result = await roleService.checkPermission(
      req.user!.id,
      permission,
      context
    )

    return res.status(200).json({
      success: true,
      data: {
        hasPermission: result.hasPermission,
        reason: result.reason,
        permission,
        context
      }
    })
  } catch (error) {
    console.error('Error in check permission handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withAuth(checkPermissionHandler)