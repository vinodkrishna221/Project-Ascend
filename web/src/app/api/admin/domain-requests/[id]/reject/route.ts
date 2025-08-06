import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id
    const body = await request.json()
    const { reason } = body

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

    // Update request status
    const { error: updateError } = await supabase
      .from('domain_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // TODO: Get actual admin user ID
        rejection_reason: reason,
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Failed to update request status:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update request status' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to requester with rejection reason

    return NextResponse.json({
      success: true,
      message: 'Domain request rejected',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}