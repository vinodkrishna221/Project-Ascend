-- Privacy and GDPR Compliance Migration
-- This migration implements data privacy features and GDPR compliance requirements

BEGIN;

-- User consent management table
CREATE TABLE user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  consent_type consent_category NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  legal_basis TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent categories enum
CREATE TYPE consent_category AS ENUM (
  'essential_functionality',
  'analytics_and_performance',
  'marketing_communications',
  'research_participation',
  'recruiter_visibility'
);

-- Privacy settings table
CREATE TABLE privacy_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  profile_visibility TEXT DEFAULT 'students_only' CHECK (profile_visibility IN ('public', 'students_only', 'communities_only')),
  allow_messages BOOLEAN DEFAULT TRUE,
  allow_collaboration_requests BOOLEAN DEFAULT TRUE,
  allow_skill_endorsements BOOLEAN DEFAULT TRUE,
  allow_recruiter_contact BOOLEAN DEFAULT FALSE,
  analytics_participation BOOLEAN DEFAULT TRUE,
  research_participation BOOLEAN DEFAULT FALSE,
  feature_improvement BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_communications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data export requests table
CREATE TABLE data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Data retention policies table
CREATE TABLE data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL,
  retention_period INTERVAL NOT NULL,
  description TEXT,
  legal_basis TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for data access and modifications
CREATE TABLE data_access_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  accessed_user_id UUID REFERENCES profiles(id), -- User whose data was accessed
  action TEXT NOT NULL,
  data_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  purpose TEXT,
  legal_basis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_privacy_settings_user_id ON privacy_settings(user_id);
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX idx_data_access_audit_user_id ON data_access_audit(user_id);
CREATE INDEX idx_data_access_audit_accessed_user_id ON data_access_audit(accessed_user_id);
CREATE INDEX idx_data_access_audit_created_at ON data_access_audit(created_at);

-- Insert default data retention policies
INSERT INTO data_retention_policies (data_type, retention_period, description, legal_basis) VALUES
('email_verifications', INTERVAL '30 days', 'Email verification codes and attempts', 'Security and fraud prevention'),
('session_logs', INTERVAL '90 days', 'User session and authentication logs', 'Security monitoring'),
('audit_logs', INTERVAL '7 years', 'Data access and modification audit logs', 'Legal compliance and accountability'),
('user_content', INTERVAL '10 years', 'User posts, comments, and content', 'Platform functionality and user experience'),
('anonymous_posts', INTERVAL '5 years', 'Anonymous posts with encrypted user links', 'Platform functionality and moderation'),
('deleted_accounts', INTERVAL '30 days', 'Soft-deleted account data before permanent removal', 'Account recovery and legal compliance');

-- Row Level Security policies
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit ENABLE ROW LEVEL SECURITY;

-- Users can only access their own consent records
CREATE POLICY "Users can manage own consents" ON user_consents
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own privacy settings
CREATE POLICY "Users can manage own privacy settings" ON privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own data export requests
CREATE POLICY "Users can manage own data export requests" ON data_export_requests
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs are read-only for users (their own records only)
CREATE POLICY "Users can view own audit logs" ON data_access_audit
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = accessed_user_id);

-- Admin access policies
CREATE POLICY "Admins can view all audit logs" ON data_access_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Function to automatically create privacy settings for new users
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default essential consent
  INSERT INTO user_consents (user_id, consent_type, granted, granted_at, legal_basis)
  VALUES (NEW.id, 'essential_functionality', TRUE, NOW(), 'Legitimate interest for platform functionality');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create privacy settings for new users
CREATE TRIGGER create_privacy_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_privacy_settings();

-- Function to handle data retention cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
DECLARE
  policy RECORD;
BEGIN
  -- Loop through active retention policies
  FOR policy IN SELECT * FROM data_retention_policies WHERE is_active = TRUE LOOP
    CASE policy.data_type
      WHEN 'email_verifications' THEN
        DELETE FROM email_verifications 
        WHERE created_at < NOW() - policy.retention_period;
        
      WHEN 'session_logs' THEN
        DELETE FROM user_sessions 
        WHERE created_at < NOW() - policy.retention_period 
        AND is_active = FALSE;
        
      WHEN 'audit_logs' THEN
        DELETE FROM data_access_audit 
        WHERE created_at < NOW() - policy.retention_period;
        
      WHEN 'deleted_accounts' THEN
        -- Permanently delete soft-deleted accounts
        DELETE FROM profiles 
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < NOW() - policy.retention_period;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;