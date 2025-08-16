/**
 * Comprehensive Unit Tests for Authentication Service
 * Tests all authentication services and utilities with proper mocking
 */

import { authService } from '../auth.service';
import type { SignupData, LoginData, VerifyEmailData, VerifyCollegeCredentialsData } from '../auth.service';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
};

jest.mock('../supabase', () => ({
  supabase: mockSupabaseClient,
  supabaseAdmin: mockSupabaseClient,
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id', email: 'test@example.com' })),
}));

describe('AuthService - Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully signup a student with college email', async () => {
      const signupData: SignupData = {
        name: 'John Doe',
        email: 'john@mit.edu',
        password: 'SecurePass123!',
        role: 'student',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: signupData.email },
          session: null,
        },
        error: null,
      });

      const result = await authService.signup(signupData);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
            role: signupData.role,
          },
        },
      });
    });

    it('should handle signup errors gracefully', async () => {
      const signupData: SignupData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'weak',
        role: 'student',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      const result = await authService.signup(signupData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      const incompleteData: Partial<SignupData> = {
        email: 'test@example.com',
        // Missing name, password, role
      };

      const result = await authService.signup(incompleteData as SignupData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle aspirant signup differently', async () => {
      const aspirantData: SignupData = {
        name: 'Jane Smith',
        email: 'jane@gmail.com',
        password: 'SecurePass123!',
        role: 'aspirant',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-456', email: aspirantData.email },
          session: null,
        },
        error: null,
      });

      const result = await authService.signup(aspirantData);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: aspirantData.email,
        password: aspirantData.password,
        options: {
          data: {
            name: aspirantData.name,
            role: aspirantData.role,
          },
        },
      });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData: LoginData = {
        email: 'john@mit.edu',
        password: 'SecurePass123!',
        rememberMe: false,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: loginData.email },
          session: { access_token: 'token-123', refresh_token: 'refresh-123' },
        },
        error: null,
      });

      const result = await authService.login(loginData);

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.token).toBeDefined();
    });

    it('should handle invalid credentials', async () => {
      const loginData: LoginData = {
        email: 'john@mit.edu',
        password: 'wrongpassword',
        rememberMe: false,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.login(loginData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle remember me functionality', async () => {
      const loginData: LoginData = {
        email: 'john@mit.edu',
        password: 'SecurePass123!',
        rememberMe: true,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: loginData.email },
          session: { access_token: 'token-123', refresh_token: 'refresh-123' },
        },
        error: null,
      });

      const result = await authService.login(loginData);

      expect(result.success).toBe(true);
      // Should set longer session duration for remember me
    });

    it('should handle account not verified error', async () => {
      const loginData: LoginData = {
        email: 'unverified@mit.edu',
        password: 'SecurePass123!',
        rememberMe: false,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      const result = await authService.login(loginData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with correct code', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: '123456',
      };

      // Mock email verification lookup
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'verification-123',
                email: verifyData.email,
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                attempts: 0,
                is_used: false,
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(true);
      expect(result.data?.needsCollegeSelection).toBeDefined();
    });

    it('should fail with invalid verification code', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: '000000',
      };

      // Mock bcrypt compare to return false
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValueOnce(false);

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'verification-123',
                email: verifyData.email,
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                attempts: 0,
                is_used: false,
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CODE');
    });

    it('should fail with expired verification code', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: '123456',
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'verification-123',
                email: verifyData.email,
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Expired
                attempts: 0,
                is_used: false,
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CODE_EXPIRED');
    });

    it('should handle maximum attempts exceeded', async () => {
      const verifyData: VerifyEmailData = {
        email: 'john@mit.edu',
        code: '123456',
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'verification-123',
                email: verifyData.email,
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                attempts: 3, // Max attempts reached
                is_used: false,
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.verifyEmail(verifyData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });
  });

  describe('getColleges', () => {
    it('should return list of active colleges', async () => {
      const mockColleges = [
        {
          id: 'mit',
          name: 'Massachusetts Institute of Technology',
          domain: 'mit.edu',
          country: 'United States',
          verification_type: 'automatic',
          provides_email: true,
          is_active: true,
        },
        {
          id: 'iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          domain: null,
          country: 'India',
          verification_type: 'database_only',
          provides_email: false,
          is_active: true,
        },
      ];

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockColleges,
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.getColleges();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockColleges);
      expect(result.data?.length).toBe(2);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })),
          })),
        })),
      });

      const result = await authService.getColleges();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyCollegeCredentials', () => {
    it('should successfully verify valid college credentials', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        rollNumber: 'CS2024001',
        verificationPassword: 'demo123',
      };

      // Mock student record lookup
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'student-123',
                college_id: credentialsData.collegeId,
                student_name: credentialsData.studentName,
                branch: credentialsData.branch,
                year: credentialsData.year,
                roll_number: credentialsData.rollNumber,
                verification_password: 'hashed-password',
                is_active: true,
                used_at: null,
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
      expect(result.data?.studentId).toBe('student-123');
    });

    it('should fail with invalid credentials', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrongpassword',
      };

      // Mock bcrypt compare to return false
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValueOnce(false);

      mockSupabaseClient.from.mockReturnValueOnce({
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

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PASSWORD');
    });

    it('should fail when credentials already used', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'demo123',
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'student-123',
                verification_password: 'hashed-password',
                is_active: true,
                used_at: new Date().toISOString(), // Already used
              },
              error: null,
            })),
          })),
        })),
      });

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_ALREADY_USED');
    });

    it('should handle student not found', async () => {
      const credentialsData: VerifyCollegeCredentialsData = {
        collegeId: 'iit-delhi',
        studentName: 'Nonexistent Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'demo123',
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'No rows returned' },
            })),
          })),
        })),
      });

      const result = await authService.verifyCollegeCredentials(credentialsData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STUDENT_NOT_FOUND');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      const refreshData = { refresh_token: 'valid-refresh-token' };

      mockSupabaseClient.auth.refreshSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          },
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      });

      const result = await authService.refreshToken(refreshData);

      expect(result.success).toBe(true);
      expect(result.data?.tokens.access_token).toBe('new-access-token');
      expect(result.data?.tokens.refresh_token).toBe('new-refresh-token');
    });

    it('should handle invalid refresh token', async () => {
      const refreshData = { refresh_token: 'invalid-refresh-token' };

      mockSupabaseClient.auth.refreshSession.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid refresh token' },
      });

      const result = await authService.refreshToken(refreshData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Logout failed' },
      });

      const result = await authService.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('resendVerificationCode', () => {
    it('should successfully resend verification code', async () => {
      const email = 'john@mit.edu';

      // Mock rate limit check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [], // No recent codes
                error: null,
              })),
            })),
          })),
        })),
      });

      const result = await authService.resendVerificationCode(email);

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('sent');
    });

    it('should enforce rate limiting', async () => {
      const email = 'john@mit.edu';

      // Mock recent verification code
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [{
                  created_at: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
                }],
                error: null,
              })),
            })),
          })),
        })),
      });

      const result = await authService.resendVerificationCode(email);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMITED');
    });
  });
});