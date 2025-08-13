import { metricsService } from '../metrics.service';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('MetricsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackAuthAttempt', () => {
    it('should track authentication attempt successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any);

      const metric = {
        metric_type: 'email_verification',
        verification_method: 'email' as const,
        success: true,
        response_time_ms: 500,
        user_id: 'user-123',
        college_id: 'college-456',
        error_code: null,
        error_message: null,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0'
      };

      await metricsService.trackAuthAttempt(metric);

      expect(mockSupabase.from).toHaveBeenCalledWith('auth_metrics');
      expect(mockInsert).toHaveBeenCalledWith(metric);
    });

    it('should handle tracking errors gracefully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ 
        error: { message: 'Database error' } 
      });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const metric = {
        metric_type: 'email_verification',
        verification_method: 'email' as const,
        success: false,
        response_time_ms: 1000,
        user_id: null,
        college_id: null,
        error_code: 'INVALID_EMAIL',
        error_message: 'Invalid email format',
        ip_address: null,
        user_agent: null
      };

      await metricsService.trackAuthAttempt(metric);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to track auth attempt:', 
        { message: 'Database error' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('trackAPIPerformance', () => {
    it('should track API performance metrics', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any);

      const metric = {
        endpoint: '/api/v1/auth/verify-email',
        method: 'POST',
        response_time_ms: 250,
        status_code: 200,
        user_id: 'user-123',
        request_size_bytes: 1024,
        response_size_bytes: 512
      };

      await metricsService.trackAPIPerformance(metric);

      expect(mockSupabase.from).toHaveBeenCalledWith('api_performance_metrics');
      expect(mockInsert).toHaveBeenCalledWith(metric);
    });
  });

  describe('trackOnboardingStep', () => {
    it('should track onboarding step metrics', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any);

      const metric = {
        user_id: 'user-123',
        step: 'email_verification',
        action: 'submit_code',
        success: true,
        time_spent_seconds: 30,
        error_details: null,
        device_info: { platform: 'web', browser: 'Chrome' }
      };

      await metricsService.trackOnboardingStep(metric);

      expect(mockSupabase.from).toHaveBeenCalledWith('onboarding_metrics');
      expect(mockInsert).toHaveBeenCalledWith(metric);
    });
  });

  describe('getAuthSuccessRates', () => {
    it('should return authentication success rates', async () => {
      const mockRpc = jest.fn()
        .mockResolvedValueOnce({
          data: [{ total_attempts: 100, successful_attempts: 95, success_rate: 95.0, avg_response_time_ms: 500 }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [{ total_attempts: 50, successful_attempts: 48, success_rate: 96.0, avg_response_time_ms: 750 }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [{ total_attempts: 150, successful_attempts: 143, success_rate: 95.3, avg_response_time_ms: 600 }],
          error: null
        });

      mockSupabase.rpc = mockRpc;

      const result = await metricsService.getAuthSuccessRates(24);

      expect(result).toEqual({
        email_verification: {
          total_attempts: 100,
          successful_attempts: 95,
          success_rate: 95.0,
          avg_response_time_ms: 500
        },
        database_verification: {
          total_attempts: 50,
          successful_attempts: 48,
          success_rate: 96.0,
          avg_response_time_ms: 750
        },
        overall: {
          total_attempts: 150,
          successful_attempts: 143,
          success_rate: 95.3,
          avg_response_time_ms: 600
        }
      });

      expect(mockRpc).toHaveBeenCalledTimes(3);
      expect(mockRpc).toHaveBeenNthCalledWith(1, 'calculate_success_rate', {
        p_metric_type: 'email_verification',
        p_verification_method: 'email',
        p_time_window_hours: 24
      });
    });

    it('should handle missing data gracefully', async () => {
      const mockRpc = jest.fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabase.rpc = mockRpc;

      const result = await metricsService.getAuthSuccessRates(24);

      expect(result.email_verification).toEqual({
        total_attempts: 0,
        successful_attempts: 0,
        success_rate: 0,
        avg_response_time_ms: 0
      });
    });
  });

  describe('getAPIPerformanceSummary', () => {
    it('should return API performance summary', async () => {
      const mockData = [
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

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const result = await metricsService.getAPIPerformanceSummary(24);

      expect(result).toEqual([
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
      ]);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_api_performance_summary', {
        p_time_window_hours: 24
      });
    });
  });

  describe('getActiveAlerts', () => {
    it('should return active alerts', async () => {
      const mockData = [
        {
          id: 'alert-1',
          severity: 'warning',
          message: 'Email verification success rate below threshold',
          metric_value: 82,
          threshold_exceeded: 85,
          acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null,
          created_at: '2024-01-01T10:00:00Z',
          alert_configurations: {
            alert_name: 'Email Verification Success Rate'
          }
        }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await metricsService.getActiveAlerts();

      expect(result).toEqual([
        {
          id: 'alert-1',
          alert_name: 'Email Verification Success Rate',
          severity: 'warning',
          message: 'Email verification success rate below threshold',
          metric_value: 82,
          threshold_exceeded: 85,
          acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null,
          created_at: '2024-01-01T10:00:00Z'
        }
      ]);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      } as any);

      await metricsService.acknowledgeAlert('alert-1', 'user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('active_alerts');
      expect(mockUpdate).toHaveBeenCalledWith({
        acknowledged: true,
        acknowledged_by: 'user-123',
        acknowledged_at: expect.any(String)
      });
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      } as any);

      await metricsService.resolveAlert('alert-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('active_alerts');
      expect(mockUpdate).toHaveBeenCalledWith({
        resolved: true,
        resolved_at: expect.any(String)
      });
    });
  });
});