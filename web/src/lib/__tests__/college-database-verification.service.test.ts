import { CollegeDatabaseVerificationService } from '../college-database-verification.service';
import type { CollegeCredentialsRequest } from '../college-database-verification.service';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase
}));

// Mock bcrypt
const mockBcrypt = {
  compare: jest.fn(() => Promise.resolve(true))
};

jest.mock('bcrypt', () => mockBcrypt);

describe('CollegeDatabaseVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyCredentials', () => {
    const validCredentials: CollegeCredentialsRequest = {
      college_id: 'iit-delhi',
      student_name: 'John Doe',
      branch: 'Computer Science',
      year: 2024,
      verification_password: 'demo123',
      roll_number: 'CS2024001'
    };

    it('should successfully verify valid credentials with roll number', async () => {
      // Mock successful database lookup
      const mockStudentRecord = {
        id: 'student-123',
        college_id: 'iit-delhi',
        student_name: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        roll_number: 'CS2024001',
        verification_password: 'hashed-password',
        is_active: true,
        used_at: null,
        expires_at: null,
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockStudentRecord,
              error: null,
            })),
          })),
        })),
      });

      const result = await CollegeDatabaseVerificationService.verifyCredentials(validCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
      expect(result.data?.studentId).toBe('student-123');
    });

    it('should fail verification with invalid password', async () => {
      const invalidCredentials: CollegeCredentialsRequest = {
        college_id: 'iit-delhi',
        student_name: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verification_password: 'wrongpassword',
      };

      // Mock bcrypt compare to return false
      mockBcrypt.compare.mockResolvedValueOnce(false);

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'student-123',
                verification_password: 'hashed-password',
                is_active: true,
                used_at: null,
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await CollegeDatabaseVerificationService.verifyCredentials(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PASSWORD');
    });

    it('should handle student not found', async () => {
      const notFoundCredentials: CollegeCredentialsRequest = {
        college_id: 'iit-delhi',
        student_name: 'Nonexistent Student',
        branch: 'Computer Science',
        year: 2024,
        verification_password: 'demo123',
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'No rows returned' },
            })),
          })),
        })),
      });

      const result = await CollegeDatabaseVerificationService.verifyCredentials(notFoundCredentials);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STUDENT_NOT_FOUND');
    });
  });
});