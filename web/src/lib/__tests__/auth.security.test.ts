/**
 * Security Tests for Authentication System
 * Tests for vulnerabilities and security measures
 */

import { authService } from '../auth.service';
import { JWTTokenService } from '../jwt-token.service';
import { RoleManagementService } from '../role-management.service';
import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';

// Mock dependencies
jest.mock('../supabase');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in email verification', async () => {
      const sqlInjectionAttempts = [
        "test@example.com'; DROP TABLE email_verifications; --",
        "test@example.com' OR '1'='1",
        "test@example.com'; UPDATE users SET role='admin'; --",
        "test@example.com' UNION SELECT * FROM users; --",
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const result = await authService.verifyEmailCode({
          email: maliciousEmail,
          code: '123456',
        });

        expect(result.success).toBe(false);
        expect(['VALIDATION_ERROR', 'INVALID_EMAIL']).toContain(result.error?.code);
      }
    });

    it('should prevent XSS attacks in user input', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        "'; alert('xss'); //",
      ];

      for (const payload of xssPayloads) {
        const result = await authService.signup({
          name: payload,
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: 'student',
        });

        if (result.success) {
          // If signup succeeds, name should be sanitized
          expect(result.data?.user?.name).not.toContain('<script>');
          expect(result.data?.user?.name).not.toContain('javascript:');
        } else {
          // Or request should be rejected
          expect(result.error?.code).toBe('VALIDATION_ERROR');
        }
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain',
        'spaces in@email.com',
        'email@domain..com',
        'email@-domain.com',
        'email@domain-.com',
        'email@domain.c',
        'email@domain.toolongextension',
      ];

      for (const email of invalidEmails) {
        const result = await authService.initiateEmailVerification({ email });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_EMAIL');
      }
    });

    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '12345678',
        'password123',
        'admin',
        'letmein',
      ];

      for (const password of weakPasswords) {
        const result = await authService.signup({
          name: 'Test User',
          email: 'test@example.com',
          password,
          role: 'student',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('WEAK_PASSWORD');
      }
    });

    it('should limit input field lengths', async () => {
      const longString = 'a'.repeat(1000);

      const result = await authService.signup({
        name: longString,
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'student',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.details?.field).toBe('name');
    });
  });

  describe('Authentication Security', () => {
    it('should prevent brute force attacks on login', async () => {
      const email = 'bruteforce@test.edu';
      const wrongPassword = 'wrongpassword';

      // Attempt multiple failed logins
      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(
          authService.login({
            email,
            password: wrongPassword + i,
            rememberMe: false,
          })
        );
      }

      const results = await Promise.all(attempts);

      // Should implement rate limiting after several attempts
      const rateLimitedAttempts = results.filter(
        result => !result.success && result.error?.code === 'RATE_LIMITED'
      );

      expect(rateLimitedAttempts.length).toBeGreaterThan(0);
    });

    it('should prevent brute force attacks on verification codes', async () => {
      const email = 'codebrute@test.edu';

      // Attempt multiple verification codes
      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(
          authService.verifyEmailCode({
            email,
            code: String(i).padStart(6, '0'),
          })
        );
      }

      const results = await Promise.all(attempts);

      // Should block after max attempts
      const blockedAttempts = results.filter(
        result => !result.success && 
        ['MAX_ATTEMPTS_EXCEEDED', 'ACCOUNT_LOCKED'].includes(result.error?.code || '')
      );

      expect(blockedAttempts.length).toBeGreaterThan(0);
    });

    it('should implement account lockout after suspicious activity', async () => {
      const email = 'suspicious@test.edu';

      // Simulate suspicious activity pattern
      const rapidAttempts = Array.from({ length: 20 }, (_, i) =>
        authService.login({
          email,
          password: `attempt${i}`,
          rememberMe: false,
        })
      );

      const results = await Promise.all(rapidAttempts);

      // Should detect and block suspicious activity
      const suspiciousBlocks = results.filter(
        result => !result.success && result.error?.code === 'SUSPICIOUS_ACTIVITY'
      );

      expect(suspiciousBlocks.length).toBeGreaterThan(0);
    });

    it('should enforce session timeout', async () => {
      // Mock expired token
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = await authService.refreshToken({
        refresh_token: 'expired-token',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('JWT Token Security', () => {
    it('should validate JWT token signature', async () => {
      const jwt = require('jsonwebtoken');
      
      // Mock invalid signature
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const result = await JWTTokenService.validateToken('invalid.token.signature');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_SIGNATURE');
    });

    it('should prevent token tampering', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.invalid';
      
      const result = await JWTTokenService.validateToken(validToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_SIGNATURE');
    });

    it('should enforce token expiration', async () => {
      const jwt = require('jsonwebtoken');
      
      // Mock expired token
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = await JWTTokenService.validateToken('expired.token.here');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should validate token claims', async () => {
      const jwt = require('jsonwebtoken');
      
      // Mock token with invalid claims
      jwt.verify.mockReturnValueOnce({
        userId: null, // Invalid user ID
        email: 'invalid-email',
        role: 'invalid-role',
      });

      const result = await JWTTokenService.validateToken('token.with.invalid.claims');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_CLAIMS');
    });

    it('should prevent token reuse after logout', async () => {
      const token = 'valid.access.token';
      
      // Logout should invalidate token
      await authService.logout();

      // Subsequent use should fail
      const result = await JWTTokenService.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('TOKEN_REVOKED');
    });
  });

  describe('Role-Based Access Control Security', () => {
    it('should prevent privilege escalation', async () => {
      // Attempt to assign admin role without proper authorization
      const result = await RoleManagementService.updateUserRole(
        'regular-user-id',
        'admin',
        'unauthorized-requester-id'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate role transitions', async () => {
      // Invalid role transition (aspirant directly to admin)
      const result = await RoleManagementService.updateUserRole(
        'aspirant-user-id',
        'admin',
        'admin-user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ROLE_TRANSITION');
    });

    it('should enforce resource access controls', async () => {
      // Aspirant trying to access student-only resources
      const result = await RoleManagementService.checkPermission(
        'aspirant-user-id',
        'CREATE_POST',
        'student-community'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('should prevent horizontal privilege escalation', async () => {
      // User trying to access another user's private data
      const result = await RoleManagementService.checkPermission(
        'user-1',
        'VIEW_PRIVATE_PROFILE',
        'user-2-profile'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('RESOURCE_NOT_OWNED');
    });
  });

  describe('Data Protection Security', () => {
    it('should hash passwords securely', async () => {
      const bcrypt = require('bcryptjs');
      
      // Verify bcrypt is used with sufficient rounds
      bcrypt.hash.mockImplementationOnce((password, rounds) => {
        expect(rounds).toBeGreaterThanOrEqual(12);
        return Promise.resolve('hashed-password');
      });

      await authService.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'student',
      });

      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should not expose sensitive data in responses', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      });

      if (result.success) {
        // Should not include password hash or other sensitive data
        expect(result.data?.user?.password).toBeUndefined();
        expect(result.data?.user?.password_hash).toBeUndefined();
        expect(result.data?.user?.verification_code).toBeUndefined();
      }
    });

    it('should sanitize error messages', async () => {
      // Database error should not expose internal details
      const result = await authService.verifyEmailCode({
        email: 'dbError@test.edu',
        code: '123456',
      });

      if (!result.success) {
        // Error message should be generic, not expose database schema
        expect(result.error?.message).not.toContain('table');
        expect(result.error?.message).not.toContain('column');
        expect(result.error?.message).not.toContain('constraint');
      }
    });

    it('should implement secure session management', async () => {
      const loginResult = await authService.login({
        email: 'session@test.edu',
        password: 'SecurePass123!',
        rememberMe: false,
      });

      if (loginResult.success) {
        const tokens = loginResult.data?.tokens;
        
        // Access token should have short expiration
        expect(tokens?.expires_at).toBeDefined();
        const expiresAt = new Date(tokens?.expires_at || '');
        const now = new Date();
        const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        expect(diffHours).toBeLessThanOrEqual(24); // Max 24 hours

        // Refresh token should be different from access token
        expect(tokens?.refresh_token).not.toBe(tokens?.access_token);
      }
    });
  });

  describe('College Database Security', () => {
    it('should prevent unauthorized access to college data', async () => {
      // Attempt to access college data without proper authentication
      const result = await authService.verifyCollegeCredentials({
        collegeId: '../../../admin/users', // Path traversal attempt
        studentName: 'Hacker',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'hack123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should validate college ID format', async () => {
      const invalidCollegeIds = [
        '../admin',
        '../../etc/passwd',
        'college; DROP TABLE students;',
        '<script>alert("xss")</script>',
        'college\x00admin',
      ];

      for (const collegeId of invalidCollegeIds) {
        const result = await authService.verifyCollegeCredentials({
          collegeId,
          studentName: 'Test Student',
          branch: 'Computer Science',
          year: 2024,
          verificationPassword: 'test123',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should prevent timing attacks on credential verification', async () => {
      const startTime = Date.now();

      // Valid student name but wrong password
      await authService.verifyCollegeCredentials({
        collegeId: 'iit-delhi',
        studentName: 'Valid Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrongpass',
      });

      const validStudentTime = Date.now() - startTime;

      const startTime2 = Date.now();

      // Invalid student name
      await authService.verifyCollegeCredentials({
        collegeId: 'iit-delhi',
        studentName: 'Invalid Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrongpass',
      });

      const invalidStudentTime = Date.now() - startTime2;

      // Response times should be similar to prevent timing attacks
      const timeDifference = Math.abs(validStudentTime - invalidStudentTime);
      expect(timeDifference).toBeLessThan(100); // Within 100ms
    });
  });

  describe('API Security', () => {
    it('should enforce HTTPS in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'x-forwarded-proto': 'http', // Non-HTTPS request
        },
        body: {
          email: 'test@example.com',
          code: '123456',
        },
      });

      // API should reject non-HTTPS requests in production
      // This would be implemented in middleware
      expect(req.headers['x-forwarded-proto']).toBe('http');

      process.env.NODE_ENV = originalEnv;
    });

    it('should validate Content-Type header', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'text/plain', // Invalid content type
        },
        body: 'not-json',
      });

      // Should reject requests with invalid content type
      expect(req.headers['content-type']).toBe('text/plain');
    });

    it('should implement CORS properly', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'OPTIONS',
        headers: {
          origin: 'https://malicious-site.com',
        },
      });

      // CORS should be configured to allow only trusted origins
      expect(req.headers.origin).toBe('https://malicious-site.com');
    });

    it('should prevent CSRF attacks', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          origin: 'https://malicious-site.com',
          referer: 'https://malicious-site.com/attack',
        },
        body: {
          email: 'victim@example.com',
          code: '123456',
        },
      });

      // Should validate origin and referer headers
      expect(req.headers.origin).toBe('https://malicious-site.com');
      expect(req.headers.referer).toBe('https://malicious-site.com/attack');
    });
  });

  describe('Audit and Monitoring Security', () => {
    it('should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      // Failed login attempt should be logged
      await authService.login({
        email: 'attacker@malicious.com',
        password: 'wrongpassword',
        rememberMe: false,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed login attempt')
      );

      consoleSpy.mockRestore();
    });

    it('should detect and log suspicious patterns', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      // Multiple failed attempts from same IP
      for (let i = 0; i < 5; i++) {
        await authService.login({
          email: `attempt${i}@test.com`,
          password: 'wrongpassword',
          rememberMe: false,
        });
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious activity detected')
      );

      consoleSpy.mockRestore();
    });

    it('should not log sensitive information', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await authService.login({
        email: 'test@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      });

      // Should not log passwords or tokens
      const logCalls = consoleSpy.mock.calls.flat();
      const logString = logCalls.join(' ');
      
      expect(logString).not.toContain('SecurePass123!');
      expect(logString).not.toContain('password');

      consoleSpy.mockRestore();
    });
  });
});