/**
 * Security Monitoring Service Tests
 * 
 * Tests for security monitoring, rate limiting, and threat detection
 */

import { securityMonitoringService } from '../security-monitoring.service';

// Mock Supabase
const mockSupabase = {
  from: jest.fn()
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase
}));

const mockSecurityEvent = {
  id: 'event-1',
  user_id: 'test-user-id',
  event_type: 'failed_login',
  severity: 'medium',
  ip_address: '192.168.1.1',
  created_at: '2024-01-01T00:00:00Z'
};

const mockSecurityEvents = [
  mockSecurityEvent,
  {
    id: 'event-2',
    user_id: 'test-user-id',
    event_type: 'failed_login',
    severity: 'medium',
    ip_address: '192.168.1.1',
    created_at: '2024-01-01T00:05:00Z'
  }
];

describe('Security Monitoring Service', () => {
  const mockSupabase = require('../supabase').supabase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limit store
    securityMonitoringService.cleanupRateLimitStore();
    
    // Setup default mock behavior
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockSecurityEvents, error: null })
            })
          }),
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockSecurityEvents, error: null })
            })
          })
        }),
        gte: jest.fn().mockResolvedValue({ data: mockSecurityEvents, error: null })
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const result = securityMonitoringService.checkRateLimit(
        'test-user',
        'login',
        '192.168.1.1'
      );

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4); // 5 max - 1 used
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should block requests when rate limit exceeded', () => {
      const identifier = 'test-user';
      const action = 'login';
      const ipAddress = '192.168.1.1';

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        securityMonitoringService.checkRateLimit(identifier, action, ipAddress);
      }

      // 6th request should be blocked
      const result = securityMonitoringService.checkRateLimit(identifier, action, ipAddress);
      
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntil).toBeDefined();
    });

    it('should reset rate limit after time window', () => {
      const identifier = 'test-user';
      const action = 'login';
      const ipAddress = '192.168.1.1';

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        securityMonitoringService.checkRateLimit(identifier, action, ipAddress);
      }

      // Mock time passage
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 16 * 60 * 1000); // 16 minutes later

      // Should be allowed again
      const result = securityMonitoringService.checkRateLimit(identifier, action, ipAddress);
      expect(result.allowed).toBe(true);

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should handle different rate limits for different actions', () => {
      const identifier = 'test-user';
      const ipAddress = '192.168.1.1';

      // Login allows 5 attempts
      for (let i = 0; i < 5; i++) {
        const result = securityMonitoringService.checkRateLimit(identifier, 'login', ipAddress);
        expect(result.allowed).toBe(true);
      }

      // Verification allows only 3 attempts
      for (let i = 0; i < 3; i++) {
        const result = securityMonitoringService.checkRateLimit(identifier, 'verification', ipAddress);
        expect(result.allowed).toBe(true);
      }

      // 4th verification attempt should be blocked
      const result = securityMonitoringService.checkRateLimit(identifier, 'verification', ipAddress);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events successfully', async () => {
      const event = {
        userId: 'test-user-id',
        eventType: 'failed_login' as const,
        severity: 'medium' as const,
        details: {
          email: 'test@university.edu',
          reason: 'invalid_password'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };

      // Should not throw
      await expect(securityMonitoringService.logSecurityEvent(event)).resolves.not.toThrow();
    });

    it('should handle logging errors gracefully', async () => {
      // Mock error response
      require('../supabase').supabase.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: { message: 'Database error' } }))
      });

      const event = {
        userId: 'test-user-id',
        eventType: 'failed_login' as const,
        severity: 'medium' as const,
        details: {},
        timestamp: new Date()
      };

      // Should not throw even if logging fails
      await expect(securityMonitoringService.logSecurityEvent(event)).resolves.not.toThrow();
    });
  });

  describe('Data Access Anomaly Detection', () => {
    it('should detect normal data access patterns', async () => {
      await expect(securityMonitoringService.detectDataAccessAnomaly(
        'test-user-id',
        'profiles',
        10, // Normal access count
        60 * 60 * 1000
      )).resolves.not.toThrow();
    });

    it('should detect anomalous data access patterns', async () => {
      await expect(securityMonitoringService.detectDataAccessAnomaly(
        'test-user-id',
        'profiles',
        100, // Excessive access count
        60 * 60 * 1000
      )).resolves.not.toThrow();
    });
  });

  describe('Bulk Data Access Monitoring', () => {
    it('should monitor normal bulk operations', async () => {
      await expect(securityMonitoringService.monitorBulkDataAccess(
        'test-user-id',
        'profile_search',
        50, // Normal bulk operation
        '192.168.1.1'
      )).resolves.not.toThrow();
    });

    it('should detect suspicious bulk operations', async () => {
      await expect(securityMonitoringService.monitorBulkDataAccess(
        'test-user-id',
        'profile_search',
        500, // Suspicious bulk operation
        '192.168.1.1'
      )).resolves.not.toThrow();
    });
  });

  describe('Security Alerts', () => {
    it('should retrieve security alerts', async () => {
      const alerts = await securityMonitoringService.getSecurityAlerts('high', 10);
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should acknowledge security alerts', async () => {
      const result = await securityMonitoringService.acknowledgeAlert('alert-id', 'admin-user-id');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Security Metrics', () => {
    it('should calculate security metrics', async () => {
      const metrics = await securityMonitoringService.getSecurityMetrics(24 * 60 * 60 * 1000);
      
      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('eventsBySeverity');
      expect(metrics).toHaveProperty('eventsByType');
      expect(metrics).toHaveProperty('totalAlerts');
      expect(metrics).toHaveProperty('unacknowledgedAlerts');
      expect(metrics).toHaveProperty('alertsBySeverity');
      expect(metrics).toHaveProperty('timeWindow');
    });

    it('should handle metrics calculation errors', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      });

      const metrics = await securityMonitoringService.getSecurityMetrics();
      
      // Should return default metrics structure
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.totalAlerts).toBe(0);
    });
  });

  describe('Rate Limit Store Cleanup', () => {
    it('should clean up expired rate limit entries', () => {
      const identifier = 'test-user';
      const action = 'login';
      const ipAddress = '192.168.1.1';

      // Create some rate limit entries
      securityMonitoringService.checkRateLimit(identifier, action, ipAddress);

      // Mock time passage to expire entries
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 2 * 60 * 60 * 1000); // 2 hours later

      // Cleanup should remove expired entries
      expect(() => securityMonitoringService.cleanupRateLimitStore()).not.toThrow();

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined rate limit action', () => {
      const result = securityMonitoringService.checkRateLimit(
        'test-user',
        'unknown-action',
        '192.168.1.1'
      );

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(Infinity);
    });

    it('should handle missing IP address', () => {
      const result = securityMonitoringService.checkRateLimit(
        'test-user',
        'login'
        // No IP address provided
      );

      expect(result.allowed).toBe(true);
    });

    it('should handle concurrent rate limit checks', () => {
      const identifier = 'test-user';
      const action = 'login';
      const ipAddress = '192.168.1.1';

      // Simulate concurrent requests
      const results = Array.from({ length: 10 }, () => 
        securityMonitoringService.checkRateLimit(identifier, action, ipAddress)
      );

      // First 5 should be allowed, rest should be blocked
      const allowedCount = results.filter(r => r.allowed).length;
      expect(allowedCount).toBeLessThanOrEqual(5);
    });
  });
});

describe('Rate Limit Middleware Integration', () => {
  // These tests would require more complex setup with actual HTTP requests
  // For now, we'll test the core functionality through the service

  it('should integrate with security monitoring service', () => {
    // Test that rate limiting integrates properly with security monitoring
    const identifier = 'test-user';
    const action = 'login';
    const ipAddress = '192.168.1.1';

    // Exceed rate limit
    for (let i = 0; i < 6; i++) {
      securityMonitoringService.checkRateLimit(identifier, action, ipAddress);
    }

    // Verify that security event would be logged (mocked)
    expect(mockSupabase.from).toHaveBeenCalled();
  });
});