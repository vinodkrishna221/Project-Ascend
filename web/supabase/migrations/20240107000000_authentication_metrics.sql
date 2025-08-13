-- Authentication Metrics and Monitoring Schema
-- This migration creates tables and functions for tracking authentication metrics

BEGIN;

-- Authentication metrics table for tracking success/failure rates
CREATE TABLE auth_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  verification_method verification_method NOT NULL,
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  user_id UUID REFERENCES profiles(id),
  college_id UUID REFERENCES guilds(id),
  error_code TEXT,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics for API endpoints
CREATE TABLE api_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES profiles(id),
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User experience metrics for onboarding flow
CREATE TABLE onboarding_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  step TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  error_details JSONB,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System health metrics
CREATE TABLE system_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  status TEXT DEFAULT 'normal',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert configurations
CREATE TABLE alert_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_name TEXT UNIQUE NOT NULL,
  metric_type TEXT NOT NULL,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  time_window_minutes INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  notification_channels JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active alerts
CREATE TABLE active_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_config_id UUID REFERENCES alert_configurations(id) NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_exceeded NUMERIC,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auth_metrics_type_created ON auth_metrics(metric_type, created_at DESC);
CREATE INDEX idx_auth_metrics_method_success ON auth_metrics(verification_method, success);
CREATE INDEX idx_auth_metrics_college_created ON auth_metrics(college_id, created_at DESC);
CREATE INDEX idx_api_performance_endpoint ON api_performance_metrics(endpoint, created_at DESC);
CREATE INDEX idx_onboarding_user_step ON onboarding_metrics(user_id, step, created_at);
CREATE INDEX idx_system_health_name_created ON system_health_metrics(metric_name, created_at DESC);
CREATE INDEX idx_active_alerts_severity ON active_alerts(severity, resolved, created_at);

-- Function to calculate success rates
CREATE OR REPLACE FUNCTION calculate_success_rate(
  p_metric_type TEXT,
  p_verification_method verification_method DEFAULT NULL,
  p_time_window_hours INTEGER DEFAULT 24
) RETURNS TABLE (
  total_attempts BIGINT,
  successful_attempts BIGINT,
  success_rate NUMERIC,
  avg_response_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = TRUE) as successful_attempts,
    ROUND(
      (COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as success_rate,
    ROUND(AVG(response_time_ms), 2) as avg_response_time_ms
  FROM auth_metrics
  WHERE 
    metric_type = p_metric_type
    AND (p_verification_method IS NULL OR verification_method = p_verification_method)
    AND created_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to get API performance summary
CREATE OR REPLACE FUNCTION get_api_performance_summary(
  p_time_window_hours INTEGER DEFAULT 24
) RETURNS TABLE (
  endpoint TEXT,
  total_requests BIGINT,
  avg_response_time_ms NUMERIC,
  p95_response_time_ms NUMERIC,
  error_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    apm.endpoint,
    COUNT(*) as total_requests,
    ROUND(AVG(apm.response_time_ms), 2) as avg_response_time_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY apm.response_time_ms), 2) as p95_response_time_ms,
    ROUND(
      (COUNT(*) FILTER (WHERE apm.status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as error_rate
  FROM api_performance_metrics apm
  WHERE apm.created_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
  GROUP BY apm.endpoint
  ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check system health and trigger alerts
CREATE OR REPLACE FUNCTION check_system_health() RETURNS VOID AS $$
DECLARE
  config_record RECORD;
  metric_value NUMERIC;
  alert_message TEXT;
BEGIN
  -- Check each alert configuration
  FOR config_record IN 
    SELECT * FROM alert_configurations WHERE is_active = TRUE
  LOOP
    -- Get latest metric value based on type
    CASE config_record.metric_type
      WHEN 'email_verification_success_rate' THEN
        SELECT success_rate INTO metric_value
        FROM calculate_success_rate('email_verification', 'email', config_record.time_window_minutes / 60);
      
      WHEN 'database_verification_success_rate' THEN
        SELECT success_rate INTO metric_value
        FROM calculate_success_rate('database_verification', 'college_database', config_record.time_window_minutes / 60);
      
      WHEN 'api_response_time' THEN
        SELECT avg_response_time_ms INTO metric_value
        FROM get_api_performance_summary(config_record.time_window_minutes / 60)
        ORDER BY total_requests DESC
        LIMIT 1;
      
      ELSE
        -- Get from system_health_metrics
        SELECT metric_value INTO metric_value
        FROM system_health_metrics
        WHERE metric_name = config_record.metric_type
        ORDER BY created_at DESC
        LIMIT 1;
    END CASE;

    -- Check thresholds and create alerts
    IF metric_value IS NOT NULL THEN
      IF config_record.threshold_critical IS NOT NULL AND metric_value <= config_record.threshold_critical THEN
        alert_message := format('CRITICAL: %s is %s (threshold: %s)', 
          config_record.alert_name, metric_value, config_record.threshold_critical);
        
        INSERT INTO active_alerts (alert_config_id, severity, message, metric_value, threshold_exceeded)
        VALUES (config_record.id, 'critical', alert_message, metric_value, config_record.threshold_critical)
        ON CONFLICT DO NOTHING;
        
      ELSIF config_record.threshold_warning IS NOT NULL AND metric_value <= config_record.threshold_warning THEN
        alert_message := format('WARNING: %s is %s (threshold: %s)', 
          config_record.alert_name, metric_value, config_record.threshold_warning);
        
        INSERT INTO active_alerts (alert_config_id, severity, message, metric_value, threshold_exceeded)
        VALUES (config_record.id, 'warning', alert_message, metric_value, config_record.threshold_warning)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert default alert configurations
INSERT INTO alert_configurations (alert_name, metric_type, threshold_warning, threshold_critical, time_window_minutes, notification_channels) VALUES
('Email Verification Success Rate', 'email_verification_success_rate', 85.0, 70.0, 60, '["email", "slack"]'),
('Database Verification Success Rate', 'database_verification_success_rate', 90.0, 75.0, 60, '["email", "slack"]'),
('API Response Time', 'api_response_time', 1000.0, 2000.0, 15, '["slack"]'),
('System Health Check', 'system_uptime', 95.0, 90.0, 5, '["email", "slack", "pagerduty"]');

-- Enable RLS
ALTER TABLE auth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can view all metrics" ON auth_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Admin can view API metrics" ON api_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Users can view own onboarding metrics" ON onboarding_metrics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view onboarding metrics" ON onboarding_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Admin can manage system health" ON system_health_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Admin can manage alerts" ON alert_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Admin can view alerts" ON active_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

COMMIT;