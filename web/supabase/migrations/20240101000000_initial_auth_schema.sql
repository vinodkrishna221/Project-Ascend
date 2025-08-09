-- Initial Authentication Schema Migration
-- This migration sets up the core authentication infrastructure for Ascend

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('student', 'aspirant', 'guild_admin', 'platform_admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE verification_method AS ENUM ('email', 'college_database', 'manual');
CREATE TYPE domain_verification_type AS ENUM ('automatic', 'manual', 'suspended', 'database_only');

-- Create college_domains table
CREATE TABLE college_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE, -- Nullable for colleges without email
  college_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  verification_type domain_verification_type DEFAULT 'automatic',
  provides_email BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  manual_review_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID -- Will reference profiles(id) after profiles table is created
);

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE, -- Nullable for college database verification
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  college_id UUID, -- Will reference guilds(id) when guilds table is created
  graduation_year INTEGER,
  verification_status verification_status DEFAULT 'pending',
  verification_method verification_method DEFAULT 'email',
  college_database_id UUID, -- Will reference college_student_database(id)
  skills JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);

-- Create college_student_database table
CREATE TABLE college_student_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID NOT NULL, -- Will reference guilds(id) when guilds table is created
  student_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year INTEGER NOT NULL,
  roll_number TEXT,
  verification_password TEXT NOT NULL, -- Hashed with bcrypt
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For graduated students
  used_at TIMESTAMPTZ, -- When student created account
  used_by UUID REFERENCES profiles(id),
  
  -- Ensure uniqueness per college
  UNIQUE(college_id, student_name, branch, year),
  UNIQUE(college_id, verification_password)
);

-- Create email_verifications table
CREATE TABLE email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
);

-- Create user_sessions table
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create auth_audit_log table for security monitoring
CREATE TABLE auth_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_college_domains_domain ON college_domains(domain);
CREATE INDEX idx_college_domains_active ON college_domains(is_active);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX idx_college_student_database_college_id ON college_student_database(college_id);
CREATE INDEX idx_college_student_database_active ON college_student_database(is_active);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_expires ON email_verifications(expires_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_created_at ON auth_audit_log(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE college_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_student_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- College domains policies
CREATE POLICY "Public can view active college domains" ON college_domains
  FOR SELECT USING (is_active = true);

CREATE POLICY "Platform admins can manage college domains" ON college_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

-- Profiles policies
CREATE POLICY "Users can view verified profiles" ON profiles
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- College student database policies
CREATE POLICY "Platform admins can manage college student database" ON college_student_database
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Guild admins can view their college student database" ON college_student_database
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'guild_admin'
      AND profiles.college_id = college_student_database.college_id
    )
  );

-- Email verifications policies
CREATE POLICY "Users can manage their own email verifications" ON email_verifications
  FOR ALL USING (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (user_id = auth.uid());

-- Auth audit log policies
CREATE POLICY "Users can view their own audit logs" ON auth_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Platform admins can view all audit logs" ON auth_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

-- Create functions for common operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_auth_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auth_audit_log (user_id, action, details, success)
  VALUES (p_user_id, p_action, p_details, p_success);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired email verifications
CREATE OR REPLACE FUNCTION cleanup_expired_email_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verifications 
  WHERE expires_at < NOW() AND verified_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired user sessions
CREATE OR REPLACE FUNCTION cleanup_expired_user_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE user_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some initial college domains for testing
INSERT INTO college_domains (domain, college_name, country, verification_type, provides_email) VALUES
  ('iitd.ac.in', 'Indian Institute of Technology Delhi', 'India', 'automatic', true),
  ('iitb.ac.in', 'Indian Institute of Technology Bombay', 'India', 'automatic', true),
  ('iitm.ac.in', 'Indian Institute of Technology Madras', 'India', 'automatic', true),
  ('iisc.ac.in', 'Indian Institute of Science Bangalore', 'India', 'automatic', true),
  ('du.ac.in', 'University of Delhi', 'India', 'automatic', true),
  ('jnu.ac.in', 'Jawaharlal Nehru University', 'India', 'automatic', true),
  (NULL, 'Local Engineering College', 'India', 'database_only', false),
  (NULL, 'Regional Technical University', 'India', 'database_only', false);

COMMIT;