import { analyticsService } from '../analytics.service';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVerificationPatternAnalysis', () => {
    it('should return verification pattern analysis', async () => {
      const mockAuthMetrics = [
        {
          id: '1',
          metric_type: 'email_verification',
          verification_method: 'email',
          success: true,
          response_time_ms: 500,
          user_id: 'user-1',
          college_id: 'college-1',
          error_code: null,
          error_message: null,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          metric_type: 'database_verification',
          verification_method: 'college_database',
          success: false,
          response_time_ms: 1000,
          user_id: 'user-2',
          college_id: 'college-2',
          error_code: 'INVALID_CREDENTIALS',
          error_message: 'Invalid student credentials',
          ip_address: '192.168.1.2',
          user_agent: 'Chrome/91.0',
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: mockAuthMetrics, error: null })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getVerificationPatternAnalysis(24);

      expect(result.total_verification_attempts).toBe(2);
      expect(result.verification_methods.email.attempts).toBe(1);
      expect(result.verification_methods.email.success_rate).toBe(100);
      expect(result.verification_methods.college_database.attempts).toBe(1);
      expect(result.verification_methods.college_database.success_rate).toBe(0);
      expect(result.verification_methods.college_database.common_errors).toContain('INVALID_CREDENTIALS');
    });

    it('should handle empty metrics data', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getVerificationPatternAnalysis(24);

      expect(result.total_verification_attempts).toBe(0);
      expect(result.verification_methods.email.attempts).toBe(0);
      expect(result.verification_methods.college_database.attempts).toBe(0);
    });
  });

  describe('getCollegeSpecificAnalytics', () => {
    it('should return college-specific analytics', async () => {
      const mockColleges = [
        {
          id: 'college-1',
          college_name: 'Test University',
          college_domain: 'test.edu',
          is_verified: true
        }
      ];

      const mockAuthMetrics = [
        {
          id: '1',
          college_id: 'college-1',
          success: true,
          response_time_ms: 500,
          user_id: 'user-1',
          error_code: null,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          college_id: 'college-1',
          success: false,
          response_time_ms: 1000,
          user_id: 'user-2',
          error_code: 'INVALID_EMAIL',
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      const mockOnboardingMetrics = [
        {
          id: '1',
          user_id: 'user-1',
          step: 'email_verification',
          time_spent_seconds: 120,
          success: true,
          created_at: '2024-01-01T10:00:00Z'
        }
      ];

      // Mock college query
      const mockCollegeSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockColleges, error: null })
      });

      // Mock auth metrics query
      const mockAuthSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: mockAuthMetrics, error: null })
      });

      // Mock onboarding metrics query
      const mockOnboardingSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: mockOnboardingMetrics, error: null })
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockCollegeSelect } as any)
        .mockReturnValueOnce({ select: mockAuthSelect } as any)
        .mockReturnValueOnce({ select: mockOnboardingSelect } as any);

      const result = await analyticsService.getCollegeSpecificAnalytics('college-1', 24);

      expect(result.college_performance['college-1']).toBeDefined();
      expect(result.college_performance['college-1'].college_name).toBe('Test University');
      expect(result.college_performance['college-1'].verification_attempts).toBe(2);
      expect(result.college_performance['college-1'].success_rate).toBe(50);
      expect(result.college_performance['college-1'].top_error_reasons).toContain('INVALID_EMAIL');

      expect(result.partnership_readiness['college-1']).toBeDefined();
      expect(result.partnership_readiness['college-1'].readiness_score).toBeGreaterThan(0);
    });
  });

  describe('getUserSatisfactionMetrics', () => {
    it('should return user satisfaction metrics', async () => {
      const mockOnboardingMetrics = [
        {
          id: '1',
          user_id: 'user-1',
          step: 'welcome',
          action: 'complete',
          success: true,
          time_spent_seconds: 30,
          error_details: null,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          user_id: 'user-1',
          step: 'email_verification',
          action: 'submit_code',
          success: true,
          time_spent_seconds: 60,
          error_details: null,
          created_at: '2024-01-01T10:01:00Z'
        },
        {
          id: '4',
          user_id: 'user-1',
          step: 'profile_setup',
          action: 'complete',
          success: true,
          time_spent_seconds: 90,
          error_details: null,
          created_at: '2024-01-01T10:02:00Z'
        },
        {
          id: '3',
          user_id: 'user-2',
          step: 'welcome',
          action: 'complete',
          success: true,
          time_spent_seconds: 45,
          error_details: null,
          created_at: '2024-01-01T10:02:00Z'
        },
        {
          id: '5',
          user_id: 'user-2',
          step: 'email_verification',
          action: 'submit_code',
          success: true,
          time_spent_seconds: 75,
          error_details: null,
          created_at: '2024-01-01T10:03:00Z'
        },
        {
          id: '6',
          user_id: 'user-2',
          step: 'profile_setup',
          action: 'complete',
          success: true,
          time_spent_seconds: 120,
          error_details: null,
          created_at: '2024-01-01T10:04:00Z'
        },
        {
          id: '7',
          user_id: 'user-3',
          step: 'welcome',
          action: 'complete',
          success: false,
          time_spent_seconds: 30,
          error_details: { message: 'Network error' },
          created_at: '2024-01-01T10:05:00Z'
        }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: mockOnboardingMetrics, error: null })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getUserSatisfactionMetrics(24);

      expect(result.onboarding_feedback.completion_rate).toBeGreaterThan(0);
      expect(result.onboarding_feedback.avg_completion_time_minutes).toBeGreaterThan(0);
      expect(result.onboarding_feedback.step_satisfaction.welcome).toBeDefined();
      expect(result.onboarding_feedback.step_satisfaction.welcome.common_complaints).toContain('Network error');
      expect(result.overall_satisfaction.average_rating).toBe(4.2);
    });
  });

  describe('getSystemPerformanceReport', () => {
    it('should return system performance report', async () => {
      const mockApiMetrics = [
        {
          endpoint: '/api/v1/auth/verify-email',
          total_requests: 1000,
          avg_response_time_ms: 250,
          p95_response_time_ms: 500,
          error_rate: 2.5
        },
        {
          endpoint: '/api/v1/auth/verify-code',
          total_requests: 800,
          avg_response_time_ms: 180,
          p95_response_time_ms: 350,
          error_rate: 1.2
        }
      ];

      const mockHealthMetrics = [
        {
          id: '1',
          metric_name: 'system_uptime',
          metric_value: 99.5,
          created_at: '2024-01-01T10:00:00Z'
        }
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockApiMetrics, error: null });

      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockHealthMetrics, error: null })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getSystemPerformanceReport(24);

      expect(result.api_performance.overall_health).toBeDefined();
      expect(result.api_performance.avg_response_time_ms).toBe(215); // Average of 250 and 180
      expect(result.api_performance.error_rate_percentage).toBe(1.85); // Average of 2.5 and 1.2
      expect(result.api_performance.uptime_percentage).toBe(99.5);
      expect(result.api_performance.slowest_endpoints).toHaveLength(2);
    });
  });

  describe('getSecurityAnalytics', () => {
    it('should return security analytics', async () => {
      const mockSecurityEvents = [
        {
          id: '1',
          event_type: 'rate_limit_exceeded',
          severity: 'medium',
          details: { user_agent: 'Bot/1.0' },
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          event_type: 'brute_force_attempt',
          severity: 'high',
          details: { ip_address: '192.168.1.1' },
          timestamp: '2024-01-01T10:01:00Z'
        }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: mockSecurityEvents, error: null })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getSecurityAnalytics(168);

      expect(result.threat_detection.rate_limit_violations).toBe(1);
      expect(result.threat_detection.suspicious_activities).toBe(1);
      expect(result.threat_detection.potential_bot_traffic).toBe(1);
      expect(result.authentication_security.brute_force_attempts).toBe(1);
      expect(result.compliance_status.gdpr_compliance_score).toBe(95);
    });

    it('should handle missing security events table', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'table not found' } 
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getSecurityAnalytics(168);

      expect(result.threat_detection.blocked_ips).toBe(0);
      expect(result.threat_detection.suspicious_activities).toBe(0);
      expect(result.compliance_status).toBeDefined();
    });
  });

  describe('getPartnershipInsights', () => {
    it('should return partnership insights', async () => {
      const mockColleges = [
        {
          id: 'college-1',
          college_name: 'Test University',
          college_domain: 'test.edu'
        },
        {
          id: 'college-2',
          college_name: 'Another College',
          college_domain: 'another.edu'
        }
      ];

      const mockSelect = jest.fn().mockResolvedValue({ data: mockColleges, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await analyticsService.getPartnershipInsights(720);

      expect(result.college_engagement['college-1']).toBeDefined();
      expect(result.college_engagement['college-1'].college_name).toBe('Test University');
      expect(result.college_engagement['college-1'].partnership_health).toMatch(/excellent|good|needs_attention|at_risk/);

      expect(result.expansion_opportunities.high_potential_colleges).toHaveLength(2);
      expect(result.expansion_opportunities.geographic_expansion).toBeDefined();
      expect(result.partnership_roi['college-1']).toBeDefined();
    });
  });
});