/**
 * Privacy Service Tests
 * 
 * Tests for GDPR compliance and data privacy functionality
 */

import { privacyService } from '../privacy.service';
import { encryptionService } from '../encryption.service';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const mockProfile = {
  id: 'test-user-id',
  email: 'test@university.edu',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z'
};

const mockConsents = [
  {
    id: 'consent-1',
    user_id: 'test-user-id',
    consent_type: 'essential_functionality',
    granted: true,
    granted_at: '2024-01-01T00:00:00Z',
    legal_basis: 'Legitimate interest',
    version: 1,
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockExportRequest = {
  id: 'export-request-1',
  user_id: 'test-user-id',
  request_type: 'export',
  status: 'pending'
};

describe('Privacy Service', () => {
  const mockSupabase = require('../supabase').supabase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behavior
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          order: jest.fn().mockResolvedValue({ data: mockConsents, error: null })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockExportRequest, error: null })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    });
  });

  describe('Privacy Settings', () => {
    it('should update privacy settings successfully', async () => {
      const settings = {
        profileVisibility: 'students_only' as const,
        allowMessages: true,
        analyticsParticipation: false
      };

      const result = await privacyService.updatePrivacySettings('test-user-id', settings);
      expect(result.success).toBe(true);
    });

    it('should handle privacy settings update errors', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } })
        })
      });

      const result = await privacyService.updatePrivacySettings('test-user-id', {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Consent Management', () => {
    it('should update user consent successfully', async () => {
      const consentRequest = {
        consentType: 'analytics_and_performance' as const,
        granted: true,
        legalBasis: 'User consent'
      };

      const result = await privacyService.updateConsent('test-user-id', consentRequest);
      expect(result.success).toBe(true);
    });

    it('should check user consent correctly', async () => {
      const hasConsent = await privacyService.hasConsent('test-user-id', 'essential_functionality');
      expect(hasConsent).toBe(true);
    });

    it('should return false for non-existent consent', async () => {
      // Mock no data response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                })
              })
            })
          })
        })
      });

      const hasConsent = await privacyService.hasConsent('test-user-id', 'marketing_communications');
      expect(hasConsent).toBe(false);
    });
  });

  describe('Data Export', () => {
    it('should request data export successfully', async () => {
      const options = {
        format: 'json' as const,
        includeContent: true,
        includeInteractions: false
      };

      const result = await privacyService.requestDataExport('test-user-id', options);
      expect(result.success).toBe(true);
      expect(result.requestId).toBe('export-request-1');
    });

    it('should handle data export errors', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
          })
        })
      });

      const result = await privacyService.requestDataExport('test-user-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insert failed');
    });
  });

  describe('Account Deletion', () => {
    it('should request account deletion successfully', async () => {
      const result = await privacyService.requestAccountDeletion('test-user-id', 'No longer needed');
      expect(result.success).toBe(true);
      expect(result.requestId).toBe('export-request-1');
    });
  });

  describe('Audit Logging', () => {
    it('should log data access without throwing errors', async () => {
      // This should not throw even if logging fails
      await expect(privacyService.logDataAccess(
        'test-user-id',
        'test-user-id',
        'view_profile',
        'profiles',
        'User viewed their own profile'
      )).resolves.not.toThrow();
    });
  });
});

describe('Encryption Service', () => {
  beforeAll(() => {
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  describe('Basic Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive user data';
      const encrypted = encryptionService.encrypt(plaintext);
      
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption with wrong data', () => {
      const plaintext = 'sensitive user data';
      const encrypted = encryptionService.encrypt(plaintext);
      
      // Tamper with the encrypted data
      encrypted.encryptedData = 'invalid_data';
      
      expect(() => {
        encryptionService.decrypt(encrypted);
      }).toThrow('Failed to decrypt data');
    });
  });

  describe('Hashing', () => {
    it('should hash and verify data correctly', () => {
      const data = 'password123';
      const hashed = encryptionService.hash(data);
      
      expect(hashed).toContain(':');
      expect(encryptionService.verifyHash(data, hashed)).toBe(true);
      expect(encryptionService.verifyHash('wrong_password', hashed)).toBe(false);
    });
  });

  describe('Anonymous Post Encryption', () => {
    it('should encrypt and decrypt user ID for anonymous posts', () => {
      const userId = 'test-user-id';
      const encrypted = encryptionService.encryptUserIdForAnonymousPost(userId);
      
      expect(encrypted).toContain(':');
      
      const decrypted = encryptionService.decryptUserIdFromAnonymousPost(encrypted);
      expect(decrypted).toBe(userId);
    });

    it('should generate consistent anonymous IDs', () => {
      const userId = 'test-user-id';
      const postId = 'test-post-id';
      
      // Mock Date.now to ensure consistency
      const mockNow = 1640995200000; // 2022-01-01
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      const id1 = encryptionService.generateAnonymousId(userId, postId);
      const id2 = encryptionService.generateAnonymousId(userId, postId);
      
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^anon_[a-f0-9]{16}$/);
      
      jest.restoreAllMocks();
    });
  });

  describe('Personal Data Encryption', () => {
    it('should encrypt and decrypt personal data objects', () => {
      const personalData = {
        name: 'John Doe',
        email: 'john@university.edu',
        phone: '+1234567890'
      };

      const encrypted = encryptionService.encryptPersonalData(personalData);
      expect(encrypted).toContain(':');

      const decrypted = encryptionService.decryptPersonalData(encrypted);
      expect(decrypted).toEqual(personalData);
    });

    it('should handle decryption errors gracefully', () => {
      const invalidEncrypted = 'invalid:encrypted:data';
      const result = encryptionService.decryptPersonalData(invalidEncrypted);
      expect(result).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should create and verify integrity hashes', () => {
      const data = { id: 1, name: 'test', value: 'data' };
      const hash = encryptionService.createIntegrityHash(data);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(encryptionService.verifyIntegrity(data, hash)).toBe(true);
      
      // Modify data
      const modifiedData = { ...data, value: 'modified' };
      expect(encryptionService.verifyIntegrity(modifiedData, hash)).toBe(false);
    });
  });

  describe('Pseudonymization', () => {
    it('should generate consistent pseudonym IDs', () => {
      const userId = 'test-user-id';
      const pseudo1 = encryptionService.generatePseudonymId(userId);
      const pseudo2 = encryptionService.generatePseudonymId(userId);
      
      expect(pseudo1).toBe(pseudo2);
      expect(pseudo1).toMatch(/^pseudo_[a-f0-9]{16}$/);
    });

    it('should generate different pseudonyms for different users', () => {
      const pseudo1 = encryptionService.generatePseudonymId('user1');
      const pseudo2 = encryptionService.generatePseudonymId('user2');
      
      expect(pseudo1).not.toBe(pseudo2);
    });
  });

  describe('Audit Log Encryption', () => {
    it('should encrypt and decrypt audit logs with integrity check', () => {
      const logEntry = {
        action: 'view_profile',
        userId: 'test-user-id',
        details: 'User viewed profile'
      };

      const encrypted = encryptionService.encryptAuditLog(logEntry);
      expect(encrypted).toContain(':');

      const decrypted = encryptionService.decryptAuditLog(encrypted);
      expect(decrypted).toMatchObject(logEntry);
      expect(decrypted.timestamp).toBeDefined();
      expect(decrypted.integrity).toBeDefined();
    });

    it('should reject tampered audit logs', () => {
      const logEntry = {
        action: 'view_profile',
        userId: 'test-user-id'
      };

      const encrypted = encryptionService.encryptAuditLog(logEntry);
      
      // Simulate tampering by modifying the encrypted data
      const tamperedEncrypted = encrypted.replace(/.$/, '0');
      
      const decrypted = encryptionService.decryptAuditLog(tamperedEncrypted);
      expect(decrypted).toBeNull();
    });
  });
});