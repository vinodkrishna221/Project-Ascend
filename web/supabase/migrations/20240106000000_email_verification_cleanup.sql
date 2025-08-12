-- Email Verification Cleanup Migration
-- Adds automatic cleanup triggers for expired verification codes

BEGIN;

-- Create a function to automatically clean up expired codes
CREATE OR REPLACE FUNCTION auto_cleanup_expired_verifications()
RETURNS TRIGGER AS $
BEGIN
  -- Clean up expired codes when new ones are inserted
  DELETE FROM email_verifications 
  WHERE expires_at < NOW() 
    AND verified_at IS NULL 
    AND created_at < NOW() - INTERVAL '1 hour'; -- Keep recent ones for debugging
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to run cleanup on new verification code insertion
CREATE TRIGGER trigger_cleanup_expired_verifications
  AFTER INSERT ON email_verifications
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_expired_verifications();

-- Create a scheduled cleanup function (to be called by cron job or Edge Function)
CREATE OR REPLACE FUNCTION scheduled_cleanup_email_verifications()
RETURNS TABLE(
  expired_codes_deleted INTEGER,
  old_verified_codes_deleted INTEGER
) AS $
DECLARE
  expired_count INTEGER;
  old_verified_count INTEGER;
BEGIN
  -- Delete expired unverified codes
  DELETE FROM email_verifications 
  WHERE expires_at < NOW() AND verified_at IS NULL;
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Delete old verified codes (older than 24 hours)
  DELETE FROM email_verifications 
  WHERE verified_at IS NOT NULL 
    AND verified_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS old_verified_count = ROW_COUNT;
  
  RETURN QUERY SELECT expired_count, old_verified_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_email_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION scheduled_cleanup_email_verifications() TO service_role;

COMMIT;