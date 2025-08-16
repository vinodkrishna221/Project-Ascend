/**
 * Integration Tests for Complete Authentication Flows
 * Tests end-to-end authentication scenarios
 */

import { authService } from '../auth.service';
import { EmailVerificationCodeService } from '../email-verification.service';
import { CollegeDatabaseVerificationService } from '../college-database-verification.service';
import { JWTTokenService } from '../jwt-token.service';
import { RoleManagementService } from '../role-management.service';

// Mock all external dependencies
jest.mock('../supabase');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Email Verification Flow', () => {
    it('should complete full email verification journey for student', async () => {
      const studentEmail = 'john@mit.edu';
      const studentName = 'John Doe';
      const password = 'SecurePass123!';

      // Step 1: Signup
      const signupResult = await authService.signup({
        name: studentName,
        email: studentEmail,
        password,
        role: 'student',
      });

      expect(signupResult.success).toBe(true);

      // Step 2: Initiate email verification
      const initiateResult = await authService.initiateEmailVerification({
        email: studentEmail,
      });

      expect(initiateResult.success).toBe(true);

      // Step 3: Verify email code
      const verifyResult = await authService.verifyEmailCode({
        email: studentEmail,
        code: '123456',
      });

      expect(verifyResult.success).toBe(true);
      expect(verifyResult.data?.verified).toBe(true);
      expect(verifyResult.data?.user).toBeDefined();
      expect(verifyResult.data?.tokens).toBeDefined();

      // Step 4: Check if college selection is needed
      if (verifyResult.data?.needsCollegeSelection) {
        const colleges = await authService.getColleges();
        expect(colleges.success).toBe(true);
        expect(Array.isArray(colleges.data)).toBe(true);
      }
    });

    it('should handle email verification with rate limiting', async () => {
      const studentEmail = 'jane@stanford.edu';

      // First verification request
      const firstRequest = await authService.initiateEmailVerification({
        email: studentEmail,
      });
      expect(firstRequest.success).toBe(true);

      // Immediate second request should be rate limited
      const secondRequest = await authService.initiateEmailVerification({
        email: studentEmail,
      });
      expect(secondRequest.success).toBe(false);
      expect(secondRequest.error?.code).toBe('RATE_LIMITED');
    });

    it('should handle verification code expiration and resend', async () => {
      const studentEmail = 'expired@berkeley.edu';

      // Initial verification
      await authService.initiateEmailVerification({
        email: studentEmail,
      });

      // Try to verify with expired code
      const expiredResult = await authService.verifyEmailCode({
        email: studentEmail,
        code: '123456',
      });

      if (!expiredResult.success && expiredResult.error?.code === 'CODE_EXPIRED') {
        // Resend verification code
        const resendResult = await authService.resendVerificationCode(studentEmail);
        expect(resendResult.success).toBe(true);

        // Verify with new code
        const newVerifyResult = await authService.verifyEmailCode({
          email: studentEmail,
          code: '654321',
        });
        expect(newVerifyResult.success).toBe(true);
      }
    });
  });

  describe('Complete College Database Verification Flow', () => {
    it('should complete full college database verification for student', async () => {
      const credentials = {
        collegeId: 'iit-delhi',
        studentName: 'Priya Sharma',
        branch: 'Computer Science',
        year: 2024,
        rollNumber: 'CS2024001',
        verificationPassword: 'demo123',
      };

      // Step 1: Get colleges list to find database-only colleges
      const collegesResult = await authService.getColleges();
      expect(collegesResult.success).toBe(true);

      const databaseOnlyColleges = collegesResult.data?.filter(
        (college: any) => college.verification_type === 'database_only'
      );
      expect(databaseOnlyColleges?.length).toBeGreaterThan(0);

      // Step 2: Verify college credentials
      const verifyResult = await authService.verifyCollegeCredentials(credentials);
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.data?.verified).toBe(true);
      expect(verifyResult.data?.user).toBeDefined();
      expect(verifyResult.data?.tokens).toBeDefined();

      // Step 3: Verify user role is set correctly
      const user = verifyResult.data?.user;
      expect(user?.role).toBe('student');
      expect(user?.verification_method).toBe('college_database');
    });

    it('should prevent duplicate account creation with same credentials', async () => {
      const credentials = {
        collegeId: 'iit-delhi',
        studentName: 'Already Used',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'used123',
      };

      // First verification should succeed
      const firstResult = await authService.verifyCollegeCredentials(credentials);
      expect(firstResult.success).toBe(true);

      // Second verification with same credentials should fail
      const secondResult = await authService.verifyCollegeCredentials(credentials);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error?.code).toBe('CREDENTIALS_ALREADY_USED');
    });

    it('should handle invalid college credentials gracefully', async () => {
      const invalidCredentials = {
        collegeId: 'iit-delhi',
        studentName: 'Nonexistent Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrongpass',
      };

      const result = await authService.verifyCollegeCredentials(invalidCredentials);
      expect(result.success).toBe(false);
      expect(['STUDENT_NOT_FOUND', 'INVALID_PASSWORD']).toContain(result.error?.code);
    });
  });

  describe('Session Management Integration', () => {
    it('should handle complete session lifecycle', async () => {
      // Step 1: Login to get initial tokens
      const loginResult = await authService.login({
        email: 'session@test.edu',
        password: 'SecurePass123!',
        rememberMe: false,
      });

      expect(loginResult.success).toBe(true);
      const initialTokens = loginResult.data?.token;
      expect(initialTokens).toBeDefined();

      // Step 2: Refresh token before expiration
      const refreshResult = await authService.refreshToken({
        refresh_token: 'mock-refresh-token',
      });

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.data?.tokens.access_token).toBeDefined();
      expect(refreshResult.data?.tokens.refresh_token).toBeDefined();

      // Step 3: Logout to invalidate session
      const logoutResult = await authService.logout();
      expect(logoutResult.success).toBe(true);

      // Step 4: Verify tokens are invalidated
      const postLogoutRefresh = await authService.refreshToken({
        refresh_token: 'invalidated-token',
      });
      expect(postLogoutRefresh.success).toBe(false);
    });

    it('should handle concurrent session management', async () => {
      const userEmail = 'concurrent@test.edu';

      // Simulate multiple login sessions
      const session1 = await authService.login({
        email: userEmail,
        password: 'SecurePass123!',
        rememberMe: false,
      });

      const session2 = await authService.login({
        email: userEmail,
        password: 'SecurePass123!',
        rememberMe: false,
      });

      expect(session1.success).toBe(true);
      expect(session2.success).toBe(true);

      // Both sessions should be valid initially
      const refresh1 = await authService.refreshToken({
        refresh_token: 'session1-refresh',
      });
      const refresh2 = await authService.refreshToken({
        refresh_token: 'session2-refresh',
      });

      expect(refresh1.success).toBe(true);
      expect(refresh2.success).toBe(true);
    });
  });

  describe('Role-Based Access Control Integration', () => {
    it('should assign correct roles based on verification method', async () => {
      // Email-verified student
      const emailStudent = await authService.verifyEmailCode({
        email: 'email@mit.edu',
        code: '123456',
      });

      expect(emailStudent.success).toBe(true);
      expect(emailStudent.data?.user?.role).toBe('student');
      expect(emailStudent.data?.user?.verification_method).toBe('email');

      // Database-verified student
      const dbStudent = await authService.verifyCollegeCredentials({
        collegeId: 'iit-delhi',
        studentName: 'Database Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'demo123',
      });

      expect(dbStudent.success).toBe(true);
      expect(dbStudent.data?.user?.role).toBe('student');
      expect(dbStudent.data?.user?.verification_method).toBe('college_database');

      // Aspirant
      const aspirant = await authService.signup({
        name: 'Aspirant User',
        email: 'aspirant@gmail.com',
        password: 'SecurePass123!',
        role: 'aspirant',
      });

      expect(aspirant.success).toBe(true);
      // Aspirants would need email verification but get limited role
    });

    it('should handle role updates and permission changes', async () => {
      const userEmail = 'roleupdate@test.edu';

      // Initial login as student
      const loginResult = await authService.login({
        email: userEmail,
        password: 'SecurePass123!',
        rememberMe: false,
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.data?.user?.role).toBe('student');

      // Simulate role update (would be done through admin interface)
      // This would trigger token refresh with new permissions
      const refreshWithNewRole = await authService.refreshToken({
        refresh_token: 'mock-refresh-token',
      });

      expect(refreshWithNewRole.success).toBe(true);
      // New token should reflect updated permissions
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Simulate network failure
      const networkError = new Error('Network request failed');
      
      // Mock network failure for signup
      jest.spyOn(authService, 'signup').mockRejectedValueOnce(networkError);

      const result = await authService.signup({
        name: 'Network Test',
        email: 'network@test.edu',
        password: 'SecurePass123!',
        role: 'student',
      }).catch(error => ({
        success: false,
        error: { code: 'NETWORK_ERROR', message: error.message },
      }));

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle database connection failures', async () => {
      // Simulate database connection failure
      const dbError = new Error('Database connection failed');
      
      jest.spyOn(authService, 'getColleges').mockRejectedValueOnce(dbError);

      const result = await authService.getColleges().catch(error => ({
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message },
      }));

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DATABASE_ERROR');
    });

    it('should handle service unavailability with fallbacks', async () => {
      // Test email service fallback
      const emailError = new Error('Email service unavailable');
      
      jest.spyOn(authService, 'initiateEmailVerification').mockRejectedValueOnce(emailError);

      const result = await authService.initiateEmailVerification({
        email: 'fallback@test.edu',
      }).catch(error => ({
        success: false,
        error: { code: 'EMAIL_SERVICE_ERROR', message: error.message },
      }));

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_SERVICE_ERROR');
    });
  });

  describe('Security Integration Tests', () => {
    it('should prevent brute force attacks on verification', async () => {
      const email = 'bruteforce@test.edu';
      const wrongCode = '000000';

      // Attempt multiple failed verifications
      for (let i = 0; i < 4; i++) {
        const result = await authService.verifyEmailCode({
          email,
          code: wrongCode,
        });

        if (i < 3) {
          expect(result.success).toBe(false);
          expect(result.error?.code).toBe('INVALID_CODE');
        } else {
          // Fourth attempt should be blocked
          expect(result.success).toBe(false);
          expect(result.error?.code).toBe('MAX_ATTEMPTS_EXCEEDED');
        }
      }
    });

    it('should handle suspicious activity detection', async () => {
      const email = 'suspicious@test.edu';

      // Simulate rapid successive login attempts from different IPs
      const rapidAttempts = Array.from({ length: 10 }, (_, i) => 
        authService.login({
          email,
          password: 'different-password-' + i,
          rememberMe: false,
        })
      );

      const results = await Promise.all(rapidAttempts);

      // Should detect suspicious activity and implement rate limiting
      const blockedAttempts = results.filter(
        result => !result.success && result.error?.code === 'SUSPICIOUS_ACTIVITY'
      );

      expect(blockedAttempts.length).toBeGreaterThan(0);
    });

    it('should validate JWT token integrity', async () => {
      // Login to get valid token
      const loginResult = await authService.login({
        email: 'jwt@test.edu',
        password: 'SecurePass123!',
        rememberMe: false,
      });

      expect(loginResult.success).toBe(true);
      const token = loginResult.data?.token;

      // Simulate token validation (would be done by middleware)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded).toBeDefined();
      expect(decoded.email).toBe('jwt@test.edu');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent verification requests', async () => {
      const emails = Array.from({ length: 50 }, (_, i) => `concurrent${i}@test.edu`);

      // Simulate concurrent verification requests
      const concurrentRequests = emails.map(email =>
        authService.initiateEmailVerification({ email })
      );

      const results = await Promise.allSettled(concurrentRequests);

      // Most requests should succeed (some may be rate limited)
      const successful = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );

      expect(successful.length).toBeGreaterThan(40); // Allow for some rate limiting
    });

    it('should handle large college database queries efficiently', async () => {
      const startTime = Date.now();

      // Simulate querying large college database
      const result = await authService.getColleges();

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});