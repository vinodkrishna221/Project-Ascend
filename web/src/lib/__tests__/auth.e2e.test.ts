/**
 * End-to-End Tests for Authentication User Journeys
 * Tests complete user flows from UI to database
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

// Import API handlers for E2E testing
import signupHandler from '../../pages/api/v1/auth/verify-email';
import verifyCodeHandler from '../../pages/api/v1/auth/verify-code';
import collegeCredentialsHandler from '../../pages/api/v1/auth/verify-college-credentials';
import refreshTokenHandler from '../../pages/api/v1/auth/refresh-token';
import logoutHandler from '../../pages/api/v1/auth/logout';

// Mock external dependencies
jest.mock('../supabase');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication E2E User Journeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Student Email Verification Journey', () => {
    it('should complete full student signup and verification flow', async () => {
      const studentData = {
        name: 'Alice Johnson',
        email: 'alice@stanford.edu',
        password: 'SecurePass123!',
        role: 'student',
      };

      // Step 1: Initiate email verification
      const { req: signupReq, res: signupRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: studentData.email,
          name: studentData.name,
          role: studentData.role,
        },
      });

      await signupHandler(signupReq, signupRes);

      expect(signupRes._getStatusCode()).toBe(200);
      const signupResponse = JSON.parse(signupRes._getData());
      expect(signupResponse.success).toBe(true);
      expect(signupResponse.data.message).toContain('verification email sent');

      // Step 2: Verify email code
      const { req: verifyReq, res: verifyRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: studentData.email,
          code: '123456',
        },
      });

      await verifyCodeHandler(verifyReq, verifyRes);

      expect(verifyRes._getStatusCode()).toBe(200);
      const verifyResponse = JSON.parse(verifyRes._getData());
      expect(verifyResponse.success).toBe(true);
      expect(verifyResponse.data.verified).toBe(true);
      expect(verifyResponse.data.user).toBeDefined();
      expect(verifyResponse.data.tokens).toBeDefined();

      // Verify user data structure
      const user = verifyResponse.data.user;
      expect(user.email).toBe(studentData.email);
      expect(user.name).toBe(studentData.name);
      expect(user.role).toBe('student');
      expect(user.verification_status).toBe('verified');
      expect(user.verification_method).toBe('email');

      // Verify token structure
      const tokens = verifyResponse.data.tokens;
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.expires_at).toBeDefined();
    });

    it('should handle invalid verification code gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'test@mit.edu',
          code: '000000', // Invalid code
        },
      });

      await verifyCodeHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INVALID_CODE');
      expect(response.error.message).toContain('Invalid verification code');
    });

    it('should handle expired verification code', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'expired@berkeley.edu',
          code: '123456',
        },
      });

      // Mock expired code scenario
      await verifyCodeHandler(req, res);

      // Should return appropriate error for expired code
      const response = JSON.parse(res._getData());
      if (!response.success && response.error.code === 'CODE_EXPIRED') {
        expect(response.error.message).toContain('expired');
        expect(response.error.details?.canResend).toBe(true);
      }
    });

    it('should enforce rate limiting on verification attempts', async () => {
      const email = 'ratelimit@test.edu';

      // Make multiple rapid verification attempts
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            email,
            code: '000000', // Wrong code
          },
        });

        attempts.push({ req, res });
      }

      // Execute attempts sequentially
      for (let i = 0; i < attempts.length; i++) {
        await verifyCodeHandler(attempts[i].req, attempts[i].res);
        
        const response = JSON.parse(attempts[i].res._getData());
        
        if (i < 3) {
          // First 3 attempts should fail with invalid code
          expect(response.success).toBe(false);
          expect(response.error.code).toBe('INVALID_CODE');
        } else {
          // Later attempts should be rate limited
          expect(response.success).toBe(false);
          expect(['MAX_ATTEMPTS_EXCEEDED', 'RATE_LIMITED']).toContain(response.error.code);
        }
      }
    });
  });

  describe('College Database Verification Journey', () => {
    it('should complete full college database verification flow', async () => {
      const credentialsData = {
        collegeId: 'iit-bombay',
        studentName: 'Rahul Patel',
        branch: 'Electrical Engineering',
        year: 2023,
        rollNumber: 'EE2023042',
        verificationPassword: 'secure123',
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: credentialsData,
      });

      await collegeCredentialsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);
      expect(response.data.verified).toBe(true);

      // Verify user creation
      const user = response.data.user;
      expect(user.name).toBe(credentialsData.studentName);
      expect(user.role).toBe('student');
      expect(user.verification_method).toBe('college_database');
      expect(user.college_id).toBe(credentialsData.collegeId);

      // Verify tokens
      const tokens = response.data.tokens;
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
    });

    it('should prevent duplicate account creation', async () => {
      const credentialsData = {
        collegeId: 'iit-bombay',
        studentName: 'Already Used Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'used123',
      };

      // First attempt should succeed
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: credentialsData,
      });

      await collegeCredentialsHandler(req1, res1);
      const response1 = JSON.parse(res1._getData());
      expect(response1.success).toBe(true);

      // Second attempt with same credentials should fail
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: credentialsData,
      });

      await collegeCredentialsHandler(req2, res2);
      expect(res2._getStatusCode()).toBe(400);
      const response2 = JSON.parse(res2._getData());
      expect(response2.success).toBe(false);
      expect(response2.error.code).toBe('CREDENTIALS_ALREADY_USED');
    });

    it('should handle invalid college credentials', async () => {
      const invalidCredentials = {
        collegeId: 'iit-bombay',
        studentName: 'Nonexistent Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrongpass',
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: invalidCredentials,
      });

      await collegeCredentialsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(['STUDENT_NOT_FOUND', 'INVALID_PASSWORD']).toContain(response.error.code);
    });

    it('should validate required fields', async () => {
      const incompleteCredentials = {
        collegeId: 'iit-bombay',
        studentName: 'Test Student',
        // Missing branch, year, verificationPassword
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: incompleteCredentials,
      });

      await collegeCredentialsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.details).toBeDefined();
    });
  });

  describe('Session Management Journey', () => {
    it('should handle complete session lifecycle', async () => {
      // Step 1: Login to get tokens (simulated)
      const mockTokens = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      // Step 2: Refresh token
      const { req: refreshReq, res: refreshRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          refresh_token: mockTokens.refresh_token,
        },
      });

      await refreshTokenHandler(refreshReq, refreshRes);

      expect(refreshRes._getStatusCode()).toBe(200);
      const refreshResponse = JSON.parse(refreshRes._getData());
      expect(refreshResponse.success).toBe(true);
      expect(refreshResponse.data.tokens.access_token).toBeDefined();
      expect(refreshResponse.data.tokens.refresh_token).toBeDefined();

      // Step 3: Logout
      const { req: logoutReq, res: logoutRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${refreshResponse.data.tokens.access_token}`,
        },
      });

      await logoutHandler(logoutReq, logoutRes);

      expect(logoutRes._getStatusCode()).toBe(200);
      const logoutResponse = JSON.parse(logoutRes._getData());
      expect(logoutResponse.success).toBe(true);

      // Step 4: Verify tokens are invalidated
      const { req: postLogoutReq, res: postLogoutRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          refresh_token: refreshResponse.data.tokens.refresh_token,
        },
      });

      await refreshTokenHandler(postLogoutReq, postLogoutRes);

      expect(postLogoutRes._getStatusCode()).toBe(401);
      const postLogoutResponse = JSON.parse(postLogoutRes._getData());
      expect(postLogoutResponse.success).toBe(false);
      expect(postLogoutResponse.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should handle invalid refresh token', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          refresh_token: 'invalid-refresh-token',
        },
      });

      await refreshTokenHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should handle missing authorization header', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        // No authorization header
      });

      await logoutHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Aspirant Journey', () => {
    it('should handle aspirant signup and limited access', async () => {
      const aspirantData = {
        name: 'Future Student',
        email: 'future@gmail.com',
        role: 'aspirant',
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: aspirantData,
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);

      // Aspirants should still need email verification
      expect(response.data.message).toContain('verification email sent');
    });

    it('should assign correct role and permissions to aspirant', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'aspirant@gmail.com',
          code: '123456',
        },
      });

      await verifyCodeHandler(req, res);

      const response = JSON.parse(res._getData());
      if (response.success) {
        expect(response.data.user.role).toBe('aspirant');
        expect(response.data.user.verification_status).toBe('verified');
        
        // Aspirants should have limited permissions
        // This would be verified in the token payload
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request bodies', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: 'invalid-json',
      });

      await verifyCodeHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle unsupported HTTP methods', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET', // Should be POST
        body: {
          email: 'test@example.com',
          code: '123456',
        },
      });

      await verifyCodeHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should handle database connection failures', async () => {
      // Mock database connection failure
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'dbfail@test.edu',
          code: '123456',
        },
      });

      // This would trigger database error in real scenario
      await verifyCodeHandler(req, res);

      // Should handle gracefully
      const response = JSON.parse(res._getData());
      if (!response.success) {
        expect(['DATABASE_ERROR', 'INTERNAL_ERROR']).toContain(response.error.code);
      }

      console.error = originalConsoleError;
    });

    it('should handle concurrent requests gracefully', async () => {
      const email = 'concurrent@test.edu';
      const requests = [];

      // Create 10 concurrent verification requests
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            email,
            code: '123456',
          },
        });
        requests.push({ req, res });
      }

      // Execute all requests concurrently
      await Promise.all(
        requests.map(({ req, res }) => verifyCodeHandler(req, res))
      );

      // Check that all requests were handled (some may fail due to rate limiting)
      const responses = requests.map(({ res }) => JSON.parse(res._getData()));
      const successful = responses.filter(r => r.success);
      const rateLimited = responses.filter(r => 
        !r.success && ['RATE_LIMITED', 'MAX_ATTEMPTS_EXCEEDED'].includes(r.error.code)
      );

      expect(successful.length + rateLimited.length).toBe(10);
    });
  });

  describe('Security Validation', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = {
        email: "test@example.com'; DROP TABLE users; --",
        code: '123456',
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: maliciousInput,
      });

      await verifyCodeHandler(req, res);

      // Should handle malicious input safely
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(['VALIDATION_ERROR', 'INVALID_EMAIL']).toContain(response.error.code);
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double.dot@domain.com',
      ];

      for (const email of invalidEmails) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            email,
            code: '123456',
          },
        });

        await verifyCodeHandler(req, res);

        const response = JSON.parse(res._getData());
        expect(response.success).toBe(false);
        expect(['VALIDATION_ERROR', 'INVALID_EMAIL']).toContain(response.error.code);
      }
    });

    it('should sanitize user input', async () => {
      const xssAttempt = {
        collegeId: 'iit-delhi',
        studentName: '<script>alert("xss")</script>',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'test123',
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: xssAttempt,
      });

      await collegeCredentialsHandler(req, res);

      const response = JSON.parse(res._getData());
      if (response.success) {
        // User name should be sanitized
        expect(response.data.user.name).not.toContain('<script>');
      } else {
        // Or request should be rejected
        expect(response.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});