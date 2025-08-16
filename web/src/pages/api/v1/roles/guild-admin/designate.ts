import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../../lib/database.types'
import { createRoleManagementService } from '../../../../../lib/role-management.service'
import { withPlatformAdmin, withValidation, AuthenticatedRequest } from '../../../../../lib/permission.middleware'

interface DesignateGuildAdminRequest {
  userId: string
  guildId: string
}

function validateDesignateGuildAdminRequest(req: NextApiRequest) {
  const { userId, guildId } = req.body

  const errors: string[] = []

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string')
  }

  if (!guildId || typeof guildId !== 'string') {
    errors.push('guildId is required and must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: { userId, guildId }
  }
}

/**
 * POST /api/v1/roles/guild-admin/designate
 * Verify and designate guild admin
 * Requirements: 6.3, 6.4
 */
async function designateGuildAdminHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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
    const { userId, guildId } = req.validatedData as DesignateGuildAdminRequest

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const roleService = createRoleManagementService(supabase)

    // Verify and designate guild admin
    const result = await roleService.verifyAndDesignateGuildAdmin(
      userId,
      guildId,
      req.user!.id
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'GUILD_ADMIN_DESIGNATION_FAILED',
          message: result.error || 'Failed to designate guild admin'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        guildId: result.guildId,
        isVerified: result.isVerified,
        message: 'User successfully designated as guild admin. Sessions have been invalidated to update permissions.'
      }
    })
  } catch (error) {
    console.error('Error in designate guild admin handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withPlatformAdmin(withValidation(validateDesignateGuildAdminRequest)(designateGuildAdminHandler))