import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface StudentRecord {
  student_name: string
  branch: string
  year: number
  roll_number?: string
  verification_password: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const collegeId = formData.get('college_id') as string

    if (!file || !collegeId) {
      return NextResponse.json(
        { success: false, message: 'Missing file or college ID' },
        { status: 400 }
      )
    }

    // Read and parse CSV file
    const csvText = await file.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, message: 'CSV file must contain header and at least one data row' },
        { status: 400 }
      )
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const requiredHeaders = ['student_name', 'branch', 'year', 'verification_password']
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required headers: ${missingHeaders.join(', ')}` 
        },
        { status: 400 }
      )
    }

    const students: StudentRecord[] = []
    const errors: string[] = []
    let processed = 0
    let duplicates = 0

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`)
        continue
      }

      const student: any = {}
      headers.forEach((header, index) => {
        student[header] = values[index]
      })

      // Validate required fields
      if (!student.student_name || !student.branch || !student.year || !student.verification_password) {
        errors.push(`Row ${i + 1}: Missing required fields`)
        continue
      }

      // Validate year
      const year = parseInt(student.year)
      if (isNaN(year) || year < 2020 || year > 2030) {
        errors.push(`Row ${i + 1}: Invalid year (${student.year})`)
        continue
      }

      students.push({
        student_name: student.student_name,
        branch: student.branch,
        year: year,
        roll_number: student.roll_number || null,
        verification_password: student.verification_password,
      })
    }

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid student records found' },
        { status: 400 }
      )
    }

    // Check for existing students to avoid duplicates
    const existingStudents = await supabase
      .from('college_student_database')
      .select('student_name, branch, year')
      .eq('college_id', collegeId)

    const existingKeys = new Set(
      existingStudents.data?.map(s => `${s.student_name}-${s.branch}-${s.year}`) || []
    )

    // Process students
    const studentsToInsert = []
    
    for (const student of students) {
      const key = `${student.student_name}-${student.branch}-${student.year}`
      
      if (existingKeys.has(key)) {
        duplicates++
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(student.verification_password, 12)

      studentsToInsert.push({
        college_id: collegeId,
        student_name: student.student_name,
        branch: student.branch,
        year: student.year,
        roll_number: student.roll_number,
        verification_password: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      
      processed++
    }

    // Insert students in batches
    if (studentsToInsert.length > 0) {
      const batchSize = 100
      for (let i = 0; i < studentsToInsert.length; i += batchSize) {
        const batch = studentsToInsert.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('college_student_database')
          .insert(batch)

        if (error) {
          console.error('Database error:', error)
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        }
      }
    }

    const result = {
      success: errors.length === 0,
      processed,
      duplicates,
      errors,
    }

    return NextResponse.json({
      success: true,
      message: 'Upload completed',
      result,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}