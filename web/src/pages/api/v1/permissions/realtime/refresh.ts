import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../../lib/database.types'
import { createRealtimePermissionsService } from '../../../../../lib/realtime-permissions.service'
import { withPlatformAdmin, withValidation, AuthenticatedRequest } from '../../../../../lib/permission.middleware'

interface RefreshPermissionsRequest {
  userId: string
  reason?: string
}

function validateRefreshPermissionsRequest(req: NextApiRequest) {
  const { userId, reason } = req.body

  const errors: string[] = []

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string')
  }

  if (reason && typeof reason !== 'string') {
    errors.push('reason must be a string if provided')
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: { userId, reason }
  }
}

/**
 * POST /api/v1/permissions/realtime/refresh
 * Force refresh permissions for a specific user across all active sessions
 * Requirements: 6.4, 6.5
 */
async function refreshPermissionsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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
    const { userId, reason } = req.validatedData as RefreshPermissionsRequest

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const realtimeService = createRealtimePermissionsService(supabase)

    // Force permission refresh
    await realtimeService.forcePermissionRefresh(
      userId,
      reason || `Manual refresh by ${req.user!.name}`
    )

    // Get user's active sessions count
    const activeSessions = await realtimeService.getUserActiveSessions(userId)

    return res.status(200).json({
      success: true,
      data: {
        userId,
        message: 'Permission refresh broadcast sent',
        activeSessionsCount: activeSessions.length,
        refreshedBy: req.user!.id,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in refresh permissions handler:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
}

export default withPlatformAdmin(withValidation(validateRefreshPermissionsRequest)(refreshPermissionsHandler))