import { supabase } from './supabase';
import { Database } from './database.types';

type CollegeStudentRecord = Database['public']['Tables']['college_student_database']['Insert'];
type CollegeAdmin = Database['public']['Tables']['college_admins']['Row'];
type UploadTracking = Database['public']['Tables']['college_student_uploads']['Row'];

export interface BulkStudentData {
  student_name: string;
  branch: string;
  year: number;
  roll_number?: string;
  verification_password: string;
  expires_at?: string;
}

export interface CollegeVerificationAnalytics {
  total_students: number;
  active_students: number;
  used_credentials: number;
  expired_credentials: number;
  recent_verifications: number;
}

export class CollegeAdminService {
  /**
   * Add a single student to college database
   */
  static async addStudent(
    collegeId: string,
    studentData: Omit<BulkStudentData, 'expires_at'> & { expires_at?: Date }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Hash the password using the database function
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_college_password', { password: studentData.verification_password });

      if (hashError) {
        return { success: false, error: 'Failed to hash password' };
      }

      const { data, error } = await supabase
        .from('college_student_database')
        .insert({
          college_id: collegeId,
          student_name: studentData.student_name,
          branch: studentData.branch,
          year: studentData.year,
          roll_number: studentData.roll_number,
          verification_password: hashedPassword,
          expires_at: studentData.expires_at?.toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Student already exists in database' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to add student' };
    }
  }

  /**
   * Bulk upload students to college database
   */
  static async bulkUploadStudents(
    collegeId: string,
    students: BulkStudentData[],
    uploadedBy: string
  ): Promise<{ success: boolean; uploadId?: string; error?: string }> {
    try {
      const { data: uploadId, error } = await supabase
        .rpc('bulk_insert_college_students', {
          p_college_id: collegeId,
          p_students: students,
          p_uploaded_by: uploadedBy
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, uploadId };
    } catch (error) {
      return { success: false, error: 'Failed to bulk upload students' };
    }
  }

  /**
   * Get upload status and results
   */
  static async getUploadStatus(uploadId: string): Promise<{ 
    success: boolean; 
    data?: UploadTracking; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('college_student_uploads')
        .select('*')
        .eq('id', uploadId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to get upload status' };
    }
  }

  /**
   * Get college students with pagination
   */
  static async getCollegeStudents(
    collegeId: string,
    page: number = 1,
    limit: number = 50,
    filters?: {
      branch?: string;
      year?: number;
      is_active?: boolean;
      used?: boolean;
    }
  ): Promise<{
    success: boolean;
    data?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('college_student_database')
        .select('*', { count: 'exact' })
        .eq('college_id', collegeId);

      // Apply filters
      if (filters?.branch) {
        query = query.eq('branch', filters.branch);
      }
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.used !== undefined) {
        if (filters.used) {
          query = query.not('used_at', 'is', null);
        } else {
          query = query.is('used_at', null);
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, total: count || 0 };
    } catch (error) {
      return { success: false, error: 'Failed to get college students' };
    }
  }

  /**
   * Update student status (activate/deactivate)
   */
  static async updateStudentStatus(
    studentId: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('college_student_database')
        .update({ is_active: isActive })
        .eq('id', studentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update student status' };
    }
  }

  /**
   * Delete student from database
   */
  static async deleteStudent(studentId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const { error } = await supabase
        .from('college_student_database')
        .delete()
        .eq('id', studentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete student' };
    }
  }

  /**
   * Get college verification analytics
   */
  static async getCollegeAnalytics(collegeId: string): Promise<{
    success: boolean;
    data?: CollegeVerificationAnalytics;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_college_verification_analytics', { p_college_id: collegeId });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to get analytics' };
    }
  }

  /**
   * Create college admin
   */
  static async createCollegeAdmin(adminData: {
    college_id: string;
    admin_email: string;
    admin_name: string;
    permissions?: Record<string, boolean>;
  }): Promise<{ success: boolean; data?: CollegeAdmin; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('college_admins')
        .insert({
          college_id: adminData.college_id,
          admin_email: adminData.admin_email,
          admin_name: adminData.admin_name,
          permissions: adminData.permissions || {
            can_add_students: true,
            can_remove_students: true,
            can_view_analytics: true
          }
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Admin already exists for this college' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to create college admin' };
    }
  }

  /**
   * Get college admins
   */
  static async getCollegeAdmins(collegeId: string): Promise<{
    success: boolean;
    data?: CollegeAdmin[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('college_admins')
        .select('*')
        .eq('college_id', collegeId)
        .eq('is_active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to get college admins' };
    }
  }

  /**
   * Parse CSV data for bulk upload
   */
  static parseCsvData(csvContent: string): {
    success: boolean;
    data?: BulkStudentData[];
    errors?: string[];
  } {
    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['student_name', 'branch', 'year', 'verification_password'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        return {
          success: false,
          errors: [`Missing required headers: ${missingHeaders.join(', ')}`]
        };
      }

      const students: BulkStudentData[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const student: any = {};
        headers.forEach((header, index) => {
          student[header] = values[index];
        });

        // Validate and convert data types
        try {
          const studentData: BulkStudentData = {
            student_name: student.student_name?.trim(),
            branch: student.branch?.trim(),
            year: parseInt(student.year),
            verification_password: student.verification_password?.trim(),
            roll_number: student.roll_number?.trim() || undefined,
            expires_at: student.expires_at?.trim() || undefined
          };

          if (!studentData.student_name || !studentData.branch || !studentData.verification_password) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            continue;
          }

          if (isNaN(studentData.year) || studentData.year < 1 || studentData.year > 6) {
            errors.push(`Row ${i + 1}: Invalid year (must be 1-6)`);
            continue;
          }

          if (studentData.verification_password.length < 6) {
            errors.push(`Row ${i + 1}: Password must be at least 6 characters`);
            continue;
          }

          students.push(studentData);
        } catch (error) {
          errors.push(`Row ${i + 1}: Data validation error`);
        }
      }

      return { success: true, data: students, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      return { success: false, errors: ['Failed to parse CSV data'] };
    }
  }
}