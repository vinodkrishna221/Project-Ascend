import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id

    // Get the domain request
    const { data: domainRequest, error: fetchError } = await supabase
      .from('domain_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !domainRequest) {
      return NextResponse.json(
        { success: false, message: 'Domain request not found' },
        { status: 404 }
      )
    }

    if (domainRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // Add college to college_domains table
    const { error: insertError } = await supabase
      .from('college_domains')
      .insert({
        college_name: domainRequest.college_name,
        domain: domainRequest.college_domain,
        country: domainRequest.country,
        provides_email: domainRequest.provides_email,
        verification_type: domainRequest.provides_email ? 'automatic' : 'database_only',
        is_active: true,
        created_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        verified_by: 'admin', // TODO: Get actual admin user ID
      })

    if (insertError) {
      console.error('Failed to insert college:', insertError)
      return NextResponse.json(
        { success: false, message: 'Failed to add college to system' },
        { status: 500 }
      )
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('domain_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // TODO: Get actual admin user ID
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Failed to update request status:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update request status' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to requester

    return NextResponse.json({
      success: true,
      message: 'Domain request approved and college added to system',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}