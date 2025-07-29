-- College Admin Management Migration
-- This migration adds college admin management functionality

BEGIN;

-- Create college_admins table for managing college administrators
CREATE TABLE college_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID NOT NULL, -- Will reference guilds(id) when guilds table is created
  admin_email TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  permissions JSONB DEFAULT '{"can_add_students": true, "can_remove_students": true, "can_view_analytics": true}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  last_login TIMESTAMPTZ,
  
  -- Ensure unique admin per college
  UNIQUE(college_id, admin_email)
);

-- Create indexes
CREATE INDEX idx_college_admins_college_id ON college_admins(college_id);
CREATE INDEX idx_college_admins_email ON college_admins(admin_email);
CREATE INDEX idx_college_admins_active ON college_admins(is_active);

-- Enable RLS
ALTER TABLE college_admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Platform admins can manage college admins" ON college_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "College admins can view their own record" ON college_admins
  FOR SELECT USING (admin_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Add bulk upload tracking table
CREATE TABLE college_student_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for upload tracking
CREATE INDEX idx_college_student_uploads_college_id ON college_student_uploads(college_id);
CREATE INDEX idx_college_student_uploads_status ON college_student_uploads(status);
CREATE INDEX idx_college_student_uploads_uploaded_by ON college_student_uploads(uploaded_by);

-- Enable RLS for upload tracking
ALTER TABLE college_student_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for upload tracking
CREATE POLICY "Platform admins can manage upload tracking" ON college_student_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

-- Function to hash passwords for college student database
CREATE OR REPLACE FUNCTION hash_college_password(password TEXT)
RETURNS TEXT AS $
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify college password
CREATE OR REPLACE FUNCTION verify_college_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $
BEGIN
  RETURN hash = crypt(password, hash);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk insert college students with password hashing
CREATE OR REPLACE FUNCTION bulk_insert_college_students(
  p_college_id UUID,
  p_students JSONB,
  p_uploaded_by UUID
)
RETURNS UUID AS $
DECLARE
  upload_id UUID;
  student JSONB;
  total_count INTEGER;
  success_count INTEGER := 0;
  error_details JSONB := '[]'::JSONB;
BEGIN
  -- Get total count
  total_count := jsonb_array_length(p_students);
  
  -- Create upload tracking record
  INSERT INTO college_student_uploads (college_id, uploaded_by, filename, total_records)
  VALUES (p_college_id, p_uploaded_by, 'bulk_upload', total_count)
  RETURNING id INTO upload_id;
  
  -- Process each student
  FOR student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    BEGIN
      INSERT INTO college_student_database (
        college_id,
        student_name,
        branch,
        year,
        roll_number,
        verification_password,
        expires_at
      ) VALUES (
        p_college_id,
        student->>'student_name',
        student->>'branch',
        (student->>'year')::INTEGER,
        student->>'roll_number',
        hash_college_password(student->>'verification_password'),
        CASE 
          WHEN student->>'expires_at' IS NOT NULL 
          THEN (student->>'expires_at')::TIMESTAMPTZ 
          ELSE NULL 
        END
      );
      
      success_count := success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_details := error_details || jsonb_build_object(
        'student', student,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update upload tracking
  UPDATE college_student_uploads 
  SET 
    successful_records = success_count,
    failed_records = total_count - success_count,
    status = CASE WHEN success_count = total_count THEN 'completed' ELSE 'partial' END,
    error_details = error_details,
    completed_at = NOW()
  WHERE id = upload_id;
  
  RETURN upload_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get college verification analytics
CREATE OR REPLACE FUNCTION get_college_verification_analytics(p_college_id UUID)
RETURNS JSONB AS $
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_students', COUNT(*),
    'active_students', COUNT(*) FILTER (WHERE is_active = true),
    'used_credentials', COUNT(*) FILTER (WHERE used_at IS NOT NULL),
    'expired_credentials', COUNT(*) FILTER (WHERE expires_at < NOW()),
    'recent_verifications', COUNT(*) FILTER (WHERE used_at > NOW() - INTERVAL '30 days')
  )
  INTO result
  FROM college_student_database
  WHERE college_id = p_college_id;
  
  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;