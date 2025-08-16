/**
 * Cleanup Expired Data Edge Function
 * 
 * This function runs periodically to clean up expired verification codes,
 * old verified codes, and expired user sessions.
 * 
 * Can be triggered by:
 * - Cron job (recommended)
 * - Manual API call
 * - Database trigger
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CleanupResult {
  expiredCodes: number
  oldVerifiedCodes: number
  expiredSessions: number
  timestamp: string
}

serve(async (req) => {
  try {
    // Verify this is a scheduled request or from an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting cleanup tasks...')

    // Run cleanup for expired email verifications
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('scheduled_cleanup_email_verifications')

    if (cleanupError) {
      console.error('Email verification cleanup error:', cleanupError)
      throw cleanupError
    }

    const expiredCodes = cleanupResult?.[0]?.expired_codes_deleted || 0
    const oldVerifiedCodes = cleanupResult?.[0]?.old_verified_codes_deleted || 0

    // Clean up expired user sessions
    const { data: sessionCleanup, error: sessionError } = await supabase
      .rpc('cleanup_expired_user_sessions')

    if (sessionError) {
      console.error('Session cleanup error:', sessionError)
      throw sessionError
    }

    const expiredSessions = sessionCleanup || 0

    // Clean up old audit logs (older than 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { count: auditLogsDeleted, error: auditError } = await supabase
      .from('auth_audit_log')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('*', { count: 'exact', head: true })

    if (auditError) {
      console.error('Audit log cleanup error:', auditError)
    }

    const result: CleanupResult = {
      expiredCodes,
      oldVerifiedCodes,
      expiredSessions,
      timestamp: new Date().toISOString()
    }

    console.log('Cleanup completed:', result)

    // Log cleanup activity
    await supabase
      .from('auth_audit_log')
      .insert({
        user_id: null,
        action: 'scheduled_cleanup',
        details: result,
        success: true
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Cleanup function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})