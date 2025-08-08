import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      college_name,
      college_domain,
      country,
      provides_email,
      requester_name,
      requester_email,
      additional_info,
    } = body

    // Validate required fields
    if (!college_name || !country || !provides_email || !requester_name || !requester_email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert domain request into database
    const { data, error } = await supabase
      .from('domain_requests')
      .insert({
        college_name,
        college_domain: provides_email === 'yes' ? college_domain : null,
        country,
        provides_email: provides_email === 'yes',
        requester_name,
        requester_email,
        additional_info,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to submit request' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to admin team
    // TODO: Send confirmation email to requester

    return NextResponse.json({
      success: true,
      message: 'Domain request submitted successfully',
      data,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const { data, error } = await supabase
      .from('domain_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}