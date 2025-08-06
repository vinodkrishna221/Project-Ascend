import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: 'Email is required' } },
        { status: 400 }
      )
    }

    // Validate email domain
    const domain = email.split('@')[1]
    const { data: collegeDomain, error: domainError } = await supabase
      .from('college_domains')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()

    if (domainError || !collegeDomain) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Please use your college email address. If your college is not supported, you can request to add it.' 
          } 
        },
        { status: 400 }
      )
    }

    if (!collegeDomain.provides_email) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'This college uses database verification. Please use the college verification flow.',
            college_id: collegeDomain.id
          } 
        },
        { status: 400 }
      )
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store verification code
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        ip_address: request.ip || null,
        user_agent: request.headers.get('user-agent') || null,
      })

    if (insertError) {
      console.error('Failed to store verification code:', insertError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to send verification code' } },
        { status: 500 }
      )
    }

    // TODO: Send email with verification code
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`Verification code for ${email}: ${code}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Verification code sent successfully',
        expires_at: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}