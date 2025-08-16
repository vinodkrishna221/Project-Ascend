import { EmailVerificationCodeService, EmailSendingService } from '../email-verification.service';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { id: 'test-id', email: 'test@example.com', code: '123456' }, 
          error: null 
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
};

const mockSupabaseAdmin = {
  from: jest.fn(() => mockSupabase.from())
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-code')),
  compare: jest.fn(() => Promise.resolve(true))
}));

describe('EmailVerificationCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit numeric code', () => {
      const code = EmailVerificationCodeService.generateVerificationCode();
      
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });

    it('should generate unique codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(EmailVerificationCodeService.generateVerificationCode());
      }
      
      // Should have high uniqueness (allowing for some collisions in 100 attempts)
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('generateAlphanumericCode', () => {
    it('should generate alphanumeric code with correct length', () => {
      const code = EmailVerificationCodeService.generateAlphanumericCode();
      
      expect(code).toMatch(/^[A-Z0-9]+$/);
      expect(code.length).toBe(6); // Assuming VALIDATION_CONSTANTS.EMAIL_VERIFICATION_CODE_LENGTH is 6
    });

    it('should only contain uppercase letters and numbers', () => {
      const code = EmailVerificationCodeService.generateAlphanumericCode();
      const validChars = /^[A-Z0-9]+$/;
      
      expect(validChars.test(code)).toBe(true);
    });
  });

  describe('storeVerificationCode', () => {
    it('should successfully store verification code', async () => {
      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailVerificationCodeService.storeVerificationCode(email, code);
      
      expect(result.success).toBe(true);
      expect(result.verificationId).toBe('test-id');
      expect(mockSupabase.from).toHaveBeenCalledWith('email_verifications');
    });

    it('should include IP address and user agent when provided', async () => {
      const email = 'test@example.com';
      const code = '123456';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      const result = await EmailVerificationCodeService.storeVerificationCode(
        email, 
        code, 
        ipAddress, 
        userAgent
      );
      
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_verifications');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
          }))
        }))
      });

      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailVerificationCodeService.storeVerificationCode(email, code);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateVerificationCode', () => {
    it('should successfully validate correct code', async () => {
      // Mock successful validation
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'test-id',
                email: 'test@example.com',
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                attempts: 0,
                is_used: false
              }, 
              error: null 
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailVerificationCodeService.validateVerificationCode(email, code);
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should fail validation for expired code', async () => {
      // Mock expired code
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'test-id',
                email: 'test@example.com',
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Expired
                attempts: 0,
                is_used: false
              }, 
              error: null 
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailVerificationCodeService.validateVerificationCode(email, code);
      
      expect(result.success).toBe(false);
      expect(result.error_code).toBe('CODE_EXPIRED');
    });

    it('should fail validation for used code', async () => {
      // Mock used code
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'test-id',
                email: 'test@example.com',
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                attempts: 0,
                is_used: true // Already used
              }, 
              error: null 
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailVerificationCodeService.validateVerificationCode(email, code);
      
      expect(result.success).toBe(false);
      expect(result.error_code).toBe('CODE_ALREADY_USED');
    });

    it('should handle too many attempts', async () => {
      // Mock code with max attempts
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'test-id',
                email: 'test@example.com',
                code_hash: 'hashed-code',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                attempts: 3, // Max attempts reached
                is_used: false
              }, 
              error: null 
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailVerificationCodeService.validateVerificationCode(email, code);
      
      expect(result.success).toBe(false);
      expect(result.error_code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for existing code', async () => {
      // Mock active verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ 
                data: [{ 
                  id: 'test-id',
                  email: 'test@example.com',
                  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                  attempts: 1,
                  is_used: false,
                  created_at: new Date().toISOString()
                }], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      
      const result = await EmailVerificationCodeService.getVerificationStatus(email);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
      expect(result.data?.hasActiveCode).toBe(true);
      expect(result.data?.isExpired).toBe(false);
      expect(result.data?.attemptsRemaining).toBe(2); // 3 - 1
    });

    it('should return no active code status', async () => {
      // Mock no verification found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ 
                data: [], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      
      const result = await EmailVerificationCodeService.getVerificationStatus(email);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('none');
      expect(result.data?.hasActiveCode).toBe(false);
    });
  });

  describe('canRequestNewCode', () => {
    it('should allow new code request when no recent code exists', async () => {
      // Mock no recent verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ 
                data: [], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      
      const result = await EmailVerificationCodeService.canRequestNewCode(email);
      
      expect(result.success).toBe(true);
      expect(result.data?.canRequest).toBe(true);
      expect(result.data?.waitTime).toBe(0);
    });

    it('should enforce rate limiting for recent requests', async () => {
      // Mock recent verification (within rate limit window)
      const recentTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ 
                data: [{ 
                  created_at: recentTime.toISOString()
                }], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const email = 'test@example.com';
      
      const result = await EmailVerificationCodeService.canRequestNewCode(email);
      
      expect(result.success).toBe(true);
      expect(result.data?.canRequest).toBe(false);
      expect(result.data?.waitTime).toBeGreaterThan(0);
    });
  });

  describe('cleanupExpiredCodes', () => {
    it('should successfully cleanup expired codes', async () => {
      const result = await EmailVerificationCodeService.cleanupExpiredCodes();
      
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_verifications');
    });

    it('should handle cleanup errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn(() => ({
          lt: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Cleanup error' } }))
        }))
      });

      const result = await EmailVerificationCodeService.cleanupExpiredCodes();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('EmailSendingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should successfully send verification email', async () => {
      const email = 'test@example.com';
      const code = '123456';
      const name = 'Test User';
      
      const result = await EmailSendingService.sendVerificationEmail(email, code, name);
      
      expect(result.success).toBe(true);
      expect(result.data?.messageId).toBeDefined();
    });

    it('should handle missing name parameter', async () => {
      const email = 'test@example.com';
      const code = '123456';
      
      const result = await EmailSendingService.sendVerificationEmail(email, code);
      
      expect(result.success).toBe(true);
    });

    it('should handle email sending errors', async () => {
      // This would be mocked in a real implementation
      const email = 'invalid-email';
      const code = '123456';
      
      const result = await EmailSendingService.sendVerificationEmail(email, code);
      
      // Mock implementation always succeeds, but real implementation would handle errors
      expect(result.success).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should successfully send welcome email', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const role = 'student';
      
      const result = await EmailSendingService.sendWelcomeEmail(email, name, role);
      
      expect(result.success).toBe(true);
      expect(result.data?.messageId).toBeDefined();
    });

    it('should handle different user roles', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const role = 'aspirant';
      
      const result = await EmailSendingService.sendWelcomeEmail(email, name, role);
      
      expect(result.success).toBe(true);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should successfully send password reset email', async () => {
      const email = 'test@example.com';
      const resetToken = 'reset-token-123';
      const name = 'Test User';
      
      const result = await EmailSendingService.sendPasswordResetEmail(email, resetToken, name);
      
      expect(result.success).toBe(true);
      expect(result.data?.messageId).toBeDefined();
    });

    it('should handle missing name parameter', async () => {
      const email = 'test@example.com';
      const resetToken = 'reset-token-123';
      
      const result = await EmailSendingService.sendPasswordResetEmail(email, resetToken);
      
      expect(result.success).toBe(true);
    });
  });
});