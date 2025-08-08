import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and code are required' } },
        { status: 400 }
      )
    }

    // Find verification record
    const { data: verification, error: findError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .is('verified_at', null)
      .single()

    if (findError || !verification) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid verification code' } },
        { status: 400 }
      )
    }

    // Check if code is expired
    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.json(
        { success: false, error: { message: 'Verification code has expired' } },
        { status: 400 }
      )
    }

    // Check attempts
    if (verification.attempts >= verification.max_attempts) {
      return NextResponse.json(
        { success: false, error: { message: 'Too many attempts. Please request a new code.' } },
        { status: 400 }
      )
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({
        verified_at: new Date().toISOString(),
        attempts: verification.attempts + 1,
      })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Failed to update verification:', updateError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to verify code' } },
        { status: 500 }
      )
    }

    // TODO: Create user account or update verification status
    // This would integrate with Supabase Auth to create the user account

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
        verified: true,
      },
    })
  } catch (error) {
    console.error('Code verification error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}