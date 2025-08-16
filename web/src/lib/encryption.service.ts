/**
 * Encryption Service - Data Protection and Security
 * 
 * This service handles encryption and decryption of sensitive data
 * including anonymous post user IDs, personal information, and audit logs.
 */

import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

interface DecryptionInput {
  encryptedData: string;
  iv: string;
  tag: string;
}

class EncryptionService {
  private encryptionKey: Buffer;

  constructor() {
    // In production, this should come from a secure key management service
    const keyString = process.env.ENCRYPTION_KEY || this.generateKey();
    
    try {
      this.encryptionKey = Buffer.from(keyString, 'hex');
      
      if (this.encryptionKey.length !== KEY_LENGTH) {
        throw new Error('Invalid encryption key length. Must be 32 bytes (256 bits).');
      }
    } catch (error) {
      // If hex parsing fails, generate a new key
      console.warn('Invalid encryption key format, generating new key');
      const newKey = this.generateKey();
      this.encryptionKey = Buffer.from(newKey, 'hex');
    }
  }

  /**
   * Generate a new encryption key (for development/setup)
   */
  private generateKey(): string {
    const key = crypto.randomBytes(KEY_LENGTH);
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Generated new encryption key. In production, store this securely:', key.toString('hex'));
    }
    return key.toString('hex');
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: '' // Not used for CBC mode
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(input: DecryptionInput): string {
    try {
      const iv = Buffer.from(input.iv, 'hex');
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

      let decrypted = decipher.update(input.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
      return hash === verifyHash.toString('hex');
    } catch (error) {
      console.error('Hash verification error:', error);
      return false;
    }
  }

  /**
   * Generate anonymous ID for posts
   */
  generateAnonymousId(userId: string, postId: string): string {
    const data = `${userId}:${postId}:${Date.now()}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `anon_${hash.substring(0, 16)}`;
  }

  /**
   * Encrypt user ID for anonymous posts
   */
  encryptUserIdForAnonymousPost(userId: string): string {
    const encrypted = this.encrypt(userId);
    return `${encrypted.encryptedData}:${encrypted.iv}:${encrypted.tag}`;
  }

  /**
   * Decrypt user ID from anonymous post (admin only)
   */
  decryptUserIdFromAnonymousPost(encryptedUserId: string): string {
    const [encryptedData, iv, tag] = encryptedUserId.split(':');
    return this.decrypt({ encryptedData, iv, tag });
  }

  /**
   * Secure data deletion (overwrite with random data)
   */
  secureDelete(data: string): void {
    // In memory, we can't truly secure delete, but we can overwrite
    // This is more relevant for file-based storage
    const randomData = crypto.randomBytes(data.length).toString('hex');
    // Overwrite the original data reference (limited effectiveness in JS)
    data = randomData;
  }

  /**
   * Generate secure token for data export URLs
   */
  generateSecureToken(userId: string, purpose: string): string {
    const data = `${userId}:${purpose}:${Date.now()}`;
    const token = crypto.createHash('sha256').update(data).digest('hex');
    return token.substring(0, 32);
  }

  /**
   * Encrypt personal data for storage
   */
  encryptPersonalData(data: any): string {
    const jsonData = JSON.stringify(data);
    const encrypted = this.encrypt(jsonData);
    return `${encrypted.encryptedData}:${encrypted.iv}:${encrypted.tag}`;
  }

  /**
   * Decrypt personal data from storage
   */
  decryptPersonalData(encryptedData: string): any {
    try {
      const [data, iv, tag] = encryptedData.split(':');
      const decrypted = this.decrypt({ encryptedData: data, iv, tag });
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Personal data decryption error:', error);
      return null;
    }
  }

  /**
   * Create data integrity hash
   */
  createIntegrityHash(data: any): string {
    const jsonData = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonData).digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyIntegrity(data: any, expectedHash: string): boolean {
    const actualHash = this.createIntegrityHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Generate GDPR-compliant pseudonymization ID
   */
  generatePseudonymId(userId: string): string {
    // Create a consistent but non-reversible pseudonym
    const hash = crypto.createHash('sha256').update(`${userId}:pseudonym:${process.env.PSEUDONYM_SALT || 'default-salt'}`).digest('hex');
    return `pseudo_${hash.substring(0, 16)}`;
  }

  /**
   * Encrypt audit log entries
   */
  encryptAuditLog(logEntry: any): string {
    // Add timestamp and integrity check
    const enhancedEntry = {
      ...logEntry,
      timestamp: new Date().toISOString(),
      integrity: this.createIntegrityHash(logEntry)
    };
    
    return this.encryptPersonalData(enhancedEntry);
  }

  /**
   * Decrypt and verify audit log entries
   */
  decryptAuditLog(encryptedEntry: string): any {
    const decrypted = this.decryptPersonalData(encryptedEntry);
    if (!decrypted) return null;

    // Verify integrity
    const { integrity, ...logEntry } = decrypted;
    const expectedIntegrity = this.createIntegrityHash(logEntry);
    
    if (integrity !== expectedIntegrity) {
      console.warn('Audit log integrity check failed');
      return null;
    }

    return decrypted;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();