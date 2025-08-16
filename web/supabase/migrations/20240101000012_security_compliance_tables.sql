-- Security and Compliance Tables for Ascend Authentication System
-- Migration: 20240101000012_security_compliance_tables.sql

BEGIN;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB DEFAULT '{}',
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  geolocation JSONB,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compliance logs table
CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data_type TEXT CHECK (data_type IN ('personal', 'sensitive', 'authentication', 'communication')) NOT NULL,
  action TEXT CHECK (action IN ('create', 'read', 'update', 'delete', 'export', 'anonymize')) NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT,
  retention_period INTEGER, -- in days
  consent_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GDPR requests table
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  request_type TEXT CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
  request_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completion_date TIMESTAMPTZ,
  request_details JSONB DEFAULT '{}',
  response_data JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consent records table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  consent_type TEXT CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'research', 'recruitment')) NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  version TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories JSONB DEFAULT '[]',
  retention_period INTEGER NOT NULL, -- in days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- Create security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('data_breach', 'unauthorized_access', 'account_compromise', 'malware_detection', 'ddos_attack', 'insider_threat', 'system_compromise', 'privacy_violation')) NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  status TEXT CHECK (status IN ('detected', 'investigating', 'contained', 'resolved', 'closed')) DEFAULT 'detected',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  detected_by TEXT CHECK (detected_by IN ('automated', 'manual', 'external')) NOT NULL,
  affected_users JSONB DEFAULT '[]',
  affected_systems JSONB DEFAULT '[]',
  containment_actions JSONB DEFAULT '[]',
  resolution_actions JSONB DEFAULT '[]',
  lessons_learned JSONB DEFAULT '[]',
  assigned_to TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  evidence JSONB DEFAULT '{}',
  communication_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_timestamp ON compliance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_user_id ON compliance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_data_type ON compliance_logs(data_type);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_request_date ON gdpr_requests(request_date DESC);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);

CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_detected_at ON security_incidents(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Service role can manage audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for compliance_logs
CREATE POLICY "Service role can manage compliance logs" ON compliance_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view their own compliance logs" ON compliance_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for gdpr_requests
CREATE POLICY "Users can manage their own GDPR requests" ON gdpr_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all GDPR requests" ON gdpr_requests
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for consent_records
CREATE POLICY "Users can manage their own consent records" ON consent_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all consent records" ON consent_records
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for security_incidents
CREATE POLICY "Service role can manage security incidents" ON security_incidents
  FOR ALL USING (auth.role() = 'service_role');

-- Only admins can view security incidents (implement admin role check)
CREATE POLICY "Admins can view security incidents" ON security_incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for user_sessions
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Create functions for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = FALSE, 
      revoked_at = NOW(),
      revocation_reason = 'Expired'
  WHERE expires_at < NOW() 
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_gdpr_requests_updated_at
  BEFORE UPDATE ON gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON gdpr_requests TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON consent_records TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_incidents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated, service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;

COMMIT;