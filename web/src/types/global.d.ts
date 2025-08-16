// Global type declarations for Ascend Authentication System

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Metrics types
export interface AuthMetric {
  id?: string;
  user_id?: string;
  action: string;
  metric_type?: string;
  verification_method?: string;
  success: boolean;
  response_time_ms?: number;
  college_id?: string;
  error_code?: string;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  created_at?: string;
}

export interface APIMetric {
  id?: string;
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  user_id?: string;
  request_size_bytes?: number;
  response_size_bytes?: number;
  error_details?: any;
  created_at?: string;
}

export interface OnboardingMetric {
  id?: string;
  user_id: string;
  step: string;
  action: string;
  completed: boolean;
  success: boolean;
  time_spent_seconds?: number;
  error_details?: any;
  device_info?: any;
  created_at?: string;
}

export interface SystemHealthMetric {
  id?: string;
  metric_name: string;
  metric_value: number;
  value: number;
  unit: string;
  metric_unit?: string;
  threshold_warning?: number;
  threshold_critical?: number;
  status?: string;
  details?: any;
  created_at?: string;
}

export {};
