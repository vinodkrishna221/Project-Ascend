import { supabase } from './supabase';
import { Database } from './database.types';

type CollegeStudentRecord = Database['public']['Tables']['college_student_database']['Row'];

export interface CollegeCredentialsRequest {
  college_id: string;
  student_name: string;
  branch: string;
  year: number;
  verification_password: string;
  roll_number?: string;
}

export interface CollegeVerificationResult {
  success: boolean;
  student_id?: string;
  college_id?: string;
  verified?: boolean;
  error?: string;
  error_code?: string;
}

export class CollegeDatabaseVerificationService {
  /**
   * Verify student credentials against college database
   */
  static async verifyCredentials(
    credentials: CollegeCredentialsRequest
  ): Promise<CollegeVerificationResult> {
    try {
      const { college_id, student_name, branch, year, verification_password, roll_number } = credentials;

      // First, find the student record
      let query = supabase
        .from('college_student_database')
        .select('*')
        .eq('college_id', college_id)
        .eq('student_name', student_name)
        .eq('branch', branch)
        .eq('year', year)
        .eq('is_active', true);

      // Add roll number filter if provided
      if (roll_number) {
        query = query.eq('roll_number', roll_number);
      }

      const { data: studentRecord, error: fetchError } = await query.single();

      if (fetchError || !studentRecord) {
        return {
          success: false,
          error: 'Student not found in college database',
          error_code: 'STUDENT_NOT_FOUND'
        };
      }

      // Check if credentials have already been used
      if (studentRecord.used_at) {
        return {
          success: false,
          error: 'These credentials have already been used to create an account',
          error_code: 'CREDENTIALS_ALREADY_USED'
        };
      }

      // Check if credentials have expired
      if (studentRecord.expires_at && new Date(studentRecord.expires_at) < new Date()) {
        return {
          success: false,
          error: 'These credentials have expired',
          error_code: 'CREDENTIALS_EXPIRED'
        };
      }

      // Verify password using database function
      const { data: passwordValid, error: verifyError } = await supabase
        .rpc('verify_college_password', {
          password: verification_password,
          hash: studentRecord.verification_password
        });

      if (verifyError) {
        console.error('Password verification error:', verifyError);
        return {
          success: false,
          error: 'Failed to verify credentials',
          error_code: 'VERIFICATION_FAILED'
        };
      }

      if (!passwordValid) {
        return {
          success: false,
          error: 'Invalid verification password',
          error_code: 'INVALID_PASSWORD'
        };
      }

      return {
        success: true,
        student_id: studentRecord.id,
        college_id: studentRecord.college_id,
        verified: true
      };

    } catch (error) {
      console.error('College database verification error:', error);
      return {
        success: false,
        error: 'Failed to verify credentials',
        error_code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Mark credentials as used after successful account creation
   */
  static async markCredentialsAsUsed(
    studentId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('college_student_database')
        .update({
          used_at: new Date().toISOString(),
          used_by: userId
        })
        .eq('id', studentId);

      if (error) {
        console.error('Failed to mark credentials as used:', error);
        return { success: false, error: 'Failed to update credential status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark credentials as used error:', error);
      return { success: false, error: 'Failed to update credential status' };
    }
  }

  /**
   * Get college information by ID
   */
  static async getCollegeInfo(collegeId: string): Promise<{
    success: boolean;
    data?: { college_name: string; provides_email: boolean };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('college_domains')
        .select('college_name, provides_email')
        .eq('id', collegeId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'College not found or inactive'
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get college info error:', error);
      return { success: false, error: 'Failed to get college information' };
    }
  }

  /**
   * Check if student credentials exist (for duplicate prevention)
   */
  static async checkStudentExists(
    collegeId: string,
    studentName: string,
    branch: string,
    year: number
  ): Promise<{ exists: boolean; used: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('college_student_database')
        .select('used_at')
        .eq('college_id', collegeId)
        .eq('student_name', studentName)
        .eq('branch', branch)
        .eq('year', year)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { exists: false, used: false };
        }
        return { exists: false, used: false, error: error.message };
      }

      return {
        exists: true,
        used: data.used_at !== null
      };
    } catch (error) {
      console.error('Check student exists error:', error);
      return { exists: false, used: false, error: 'Failed to check student existence' };
    }
  }

  /**
   * Get colleges that use database verification (no email domain)
   */
  static async getDatabaseVerificationColleges(): Promise<{
    success: boolean;
    data?: Array<{ id: string; college_name: string; country: string }>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('college_domains')
        .select('id, college_name, country')
        .eq('provides_email', false)
        .eq('is_active', true)
        .order('college_name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get database verification colleges error:', error);
      return { success: false, error: 'Failed to get colleges' };
    }
  }

  /**
   * Validate credential format before verification
   */
  static validateCredentialFormat(credentials: CollegeCredentialsRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!credentials.college_id?.trim()) {
      errors.push('College ID is required');
    }

    if (!credentials.student_name?.trim()) {
      errors.push('Student name is required');
    } else if (credentials.student_name.length < 2) {
      errors.push('Student name must be at least 2 characters');
    }

    if (!credentials.branch?.trim()) {
      errors.push('Branch is required');
    }

    if (!credentials.year || credentials.year < 1 || credentials.year > 6) {
      errors.push('Year must be between 1 and 6');
    }

    if (!credentials.verification_password?.trim()) {
      errors.push('Verification password is required');
    } else if (credentials.verification_password.length < 6) {
      errors.push('Verification password must be at least 6 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get verification statistics for monitoring
   */
  static async getVerificationStats(collegeId?: string): Promise<{
    success: boolean;
    data?: {
      total_attempts: number;
      successful_verifications: number;
      failed_verifications: number;
      success_rate: number;
    };
    error?: string;
  }> {
    try {
      // This would typically be implemented with proper audit logging
      // For now, we'll return basic stats from the college_student_database
      let query = supabase
        .from('college_student_database')
        .select('used_at');

      if (collegeId) {
        query = query.eq('college_id', collegeId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const total = data.length;
      const used = data.filter(record => record.used_at !== null).length;

      return {
        success: true,
        data: {
          total_attempts: total,
          successful_verifications: used,
          failed_verifications: 0, // Would need audit log for this
          success_rate: total > 0 ? (used / total) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Get verification stats error:', error);
      return { success: false, error: 'Failed to get verification statistics' };
    }
  }

  /**
   * Create audit log entry for verification attempts
   */
  static async logVerificationAttempt(
    credentials: Partial<CollegeCredentialsRequest>,
    success: boolean,
    errorCode?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Create audit log entry using the database function
      const { error } = await supabase.rpc('create_auth_audit_log', {
        p_user_id: null, // No user ID for verification attempts
        p_action: 'college_database_verification',
        p_details: {
          college_id: credentials.college_id,
          student_name: credentials.student_name,
          branch: credentials.branch,
          year: credentials.year,
          error_code: errorCode,
          ip_address: ipAddress,
          user_agent: userAgent
        },
        p_success: success
      });

      if (error && process.env.NODE_ENV === 'development') {
        console.warn('Audit log creation failed:', error);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to log verification attempt:', error);
      }
      // Don't throw error as this is just logging
    }
  }
}