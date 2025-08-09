import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { college_id, student_name, branch, year, verification_password, roll_number } = await request.json()

    if (!college_id || !student_name || !branch || !year || !verification_password) {
      return NextResponse.json(
        { success: false, error: { message: 'All required fields must be provided' } },
        { status: 400 }
      )
    }

    // Find student record in college database
    const { data: studentRecord, error: findError } = await supabase
      .from('college_student_database')
      .select('*')
      .eq('college_id', college_id)
      .eq('student_name', student_name)
      .eq('branch', branch)
      .eq('year', year)
      .eq('is_active', true)
      .single()

    if (findError || !studentRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Student not found in college database. Please check your details or contact your college administration.' 
          } 
        },
        { status: 404 }
      )
    }

    // Check if credentials are already used
    if (studentRecord.used_at) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'These credentials have already been used to create an account.' 
          } 
        },
        { status: 400 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(verification_password, studentRecord.verification_password)
    if (!passwordMatch) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Invalid verification password. Please check your credentials.' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if record is expired (for graduated students)
    if (studentRecord.expires_at && new Date() > new Date(studentRecord.expires_at)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Your student record has expired. Please contact your college administration.' 
          } 
        },
        { status: 400 }
      )
    }

    // Mark credentials as used
    const { error: updateError } = await supabase
      .from('college_student_database')
      .update({
        used_at: new Date().toISOString(),
        // used_by will be set when the user account is created
      })
      .eq('id', studentRecord.id)

    if (updateError) {
      console.error('Failed to mark credentials as used:', updateError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to verify credentials' } },
        { status: 500 }
      )
    }

    // TODO: Create user account with college database verification
    // This would integrate with Supabase Auth to create the user account

    return NextResponse.json({
      success: true,
      data: {
        message: 'Student credentials verified successfully',
        student_id: studentRecord.id,
        college_id: studentRecord.college_id,
        verified: true,
        verification_method: 'college_database',
      },
    })
  } catch (error) {
    console.error('College credentials verification error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}