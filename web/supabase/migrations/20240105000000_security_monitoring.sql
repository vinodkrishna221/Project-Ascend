-- Security Monitoring Migration
-- This migration implements security monitoring, audit logging, and threat detection

BEGIN;

-- Security events table for logging all security-related events
CREATE TABLE security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type security_event_type NOT NULL,
  severity security_severity NOT NULL,
  details TEXT, -- Encrypted JSON data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security event types enum
CREATE TYPE security_event_type AS ENUM (
  'failed_login',
  'multiple_failed_logins',
  'suspicious_location',
  'rate_limit_exceeded',
  'account_lockout',
  'password_reset_abuse',
  'verification_abuse',
  'data_access_anomaly',
  'privilege_escalation',
  'bulk_data_access',
  'unauthorized_api_access',
  'session_hijacking',
  'brute_force_attack'
);

-- Security severity levels enum
CREATE TYPE security_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Security alerts table for actionable security incidents
CREATE TABLE security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type security_event_type NOT NULL,
  severity security_severity NOT NULL,
  user_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  details TEXT, -- Encrypted JSON data
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking table
CREATE TABLE rate_limit_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- user_id, email, or IP
  action TEXT NOT NULL,
  ip_address INET,
  violation_count INTEGER DEFAULT 1,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suspicious activity patterns table
CREATE TABLE suspicious_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP reputation table
CREATE TABLE ip_reputation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET UNIQUE NOT NULL,
  reputation_score INTEGER NOT NULL CHECK (reputation_score >= 0 AND reputation_score <= 100),
  threat_types TEXT[] DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session security tracking
CREATE TABLE session_security (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  anomalies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_ip_address ON security_events(ip_address);

CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at);
CREATE INDEX idx_security_alerts_user_id ON security_alerts(user_id);

CREATE INDEX idx_rate_limit_violations_identifier ON rate_limit_violations(identifier);
CREATE INDEX idx_rate_limit_violations_action ON rate_limit_violations(action);
CREATE INDEX idx_rate_limit_violations_ip_address ON rate_limit_violations(ip_address);
CREATE INDEX idx_rate_limit_violations_blocked_until ON rate_limit_violations(blocked_until);

CREATE INDEX idx_ip_reputation_ip_address ON ip_reputation(ip_address);
CREATE INDEX idx_ip_reputation_reputation_score ON ip_reputation(reputation_score);
CREATE INDEX idx_ip_reputation_blocked ON ip_reputation(blocked);

CREATE INDEX idx_session_security_session_id ON session_security(session_id);
CREATE INDEX idx_session_security_user_id ON session_security(user_id);
CREATE INDEX idx_session_security_risk_score ON session_security(risk_score);

-- Row Level Security policies
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_security ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view security events and alerts
CREATE POLICY "Admins can view security events" ON security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "Admins can manage security alerts" ON security_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Users can view their own session security data
CREATE POLICY "Users can view own session security" ON session_security
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically clean up old security events
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  -- Delete security events older than 1 year (except critical ones)
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND severity != 'critical';
  
  -- Delete resolved security alerts older than 6 months
  DELETE FROM security_alerts 
  WHERE resolved_at IS NOT NULL 
  AND resolved_at < NOW() - INTERVAL '6 months';
  
  -- Delete old rate limit violations (keep for 30 days)
  DELETE FROM rate_limit_violations 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old session security data (keep for 90 days)
  DELETE FROM session_security 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate risk score for sessions
CREATE OR REPLACE FUNCTION calculate_session_risk_score(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT
) RETURNS INTEGER AS $$
DECLARE
  risk_score INTEGER := 0;
  ip_reputation_score INTEGER;
  recent_failures INTEGER;
  location_changes INTEGER;
BEGIN
  -- Check IP reputation
  SELECT reputation_score INTO ip_reputation_score
  FROM ip_reputation 
  WHERE ip_address = p_ip_address;
  
  IF ip_reputation_score IS NOT NULL THEN
    risk_score := risk_score + (100 - ip_reputation_score);
  END IF;
  
  -- Check recent failed logins
  SELECT COUNT(*) INTO recent_failures
  FROM security_events 
  WHERE user_id = p_user_id 
  AND event_type = 'failed_login'
  AND created_at > NOW() - INTERVAL '1 hour';
  
  risk_score := risk_score + (recent_failures * 10);
  
  -- Check for frequent location changes
  SELECT COUNT(DISTINCT ip_address) INTO location_changes
  FROM session_security 
  WHERE user_id = p_user_id 
  AND created_at > NOW() - INTERVAL '24 hours';
  
  IF location_changes > 3 THEN
    risk_score := risk_score + 20;
  END IF;
  
  -- Cap risk score at 100
  RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update IP reputation based on security events
CREATE OR REPLACE FUNCTION update_ip_reputation()
RETURNS TRIGGER AS $$
DECLARE
  current_reputation INTEGER;
  reputation_change INTEGER := 0;
BEGIN
  -- Only process events with IP addresses
  IF NEW.ip_address IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate reputation change based on event type and severity
  CASE NEW.event_type
    WHEN 'failed_login' THEN
      reputation_change := -5;
    WHEN 'brute_force_attack' THEN
      reputation_change := -30;
    WHEN 'rate_limit_exceeded' THEN
      reputation_change := -10;
    WHEN 'suspicious_location' THEN
      reputation_change := -15;
    ELSE
      reputation_change := -2;
  END CASE;
  
  -- Adjust based on severity
  CASE NEW.severity
    WHEN 'critical' THEN
      reputation_change := reputation_change * 2;
    WHEN 'high' THEN
      reputation_change := reputation_change * 1.5;
    WHEN 'medium' THEN
      reputation_change := reputation_change * 1;
    WHEN 'low' THEN
      reputation_change := reputation_change * 0.5;
  END CASE;
  
  -- Update or insert IP reputation
  INSERT INTO ip_reputation (ip_address, reputation_score, last_seen)
  VALUES (NEW.ip_address, GREATEST(0, 100 + reputation_change), NOW())
  ON CONFLICT (ip_address) 
  DO UPDATE SET 
    reputation_score = GREATEST(0, LEAST(100, ip_reputation.reputation_score + reputation_change)),
    last_seen = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update IP reputation when security events are logged
CREATE TRIGGER update_ip_reputation_trigger
  AFTER INSERT ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION update_ip_reputation();

-- Function to detect anomalous patterns
CREATE OR REPLACE FUNCTION detect_anomalous_patterns()
RETURNS void AS $$
DECLARE
  pattern RECORD;
BEGIN
  -- Detect users with unusual login patterns
  FOR pattern IN
    SELECT user_id, COUNT(*) as login_count, 
           COUNT(DISTINCT ip_address) as unique_ips
    FROM security_events 
    WHERE event_type = 'failed_login'
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 10 OR COUNT(DISTINCT ip_address) > 5
  LOOP
    INSERT INTO suspicious_patterns (pattern_type, pattern_data, risk_score)
    VALUES (
      'unusual_login_pattern',
      jsonb_build_object(
        'user_id', pattern.user_id,
        'login_count', pattern.login_count,
        'unique_ips', pattern.unique_ips,
        'time_window', '1 hour'
      ),
      LEAST(100, pattern.login_count * 5 + pattern.unique_ips * 10)
    );
  END LOOP;
  
  -- Detect IPs with high activity across multiple users
  FOR pattern IN
    SELECT ip_address, COUNT(DISTINCT user_id) as user_count,
           COUNT(*) as event_count
    FROM security_events 
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(DISTINCT user_id) > 5 AND COUNT(*) > 20
  LOOP
    INSERT INTO suspicious_patterns (pattern_type, pattern_data, risk_score)
    VALUES (
      'high_activity_ip',
      jsonb_build_object(
        'ip_address', pattern.ip_address,
        'user_count', pattern.user_count,
        'event_count', pattern.event_count,
        'time_window', '1 hour'
      ),
      LEAST(100, pattern.user_count * 10 + pattern.event_count)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;