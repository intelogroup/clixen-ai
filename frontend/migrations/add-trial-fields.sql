-- Add trial system fields to profiles table
-- Run this migration to support the 7-day free trial system

-- Add trial-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index on trial fields for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON profiles(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_started ON profiles(trial_started_at);

-- Update the user_dashboard view to include trial information
DROP VIEW IF EXISTS user_dashboard;

CREATE VIEW user_dashboard AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.tier,
    p.credits_remaining,
    p.api_key,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    p.trial_started_at,
    p.trial_expires_at,
    -- Trial status calculation
    CASE 
        WHEN p.trial_started_at IS NOT NULL AND p.trial_expires_at > NOW() THEN true
        ELSE false
    END AS trial_active,
    CASE 
        WHEN p.trial_expires_at IS NOT NULL THEN 
            GREATEST(0, EXTRACT(day FROM p.trial_expires_at - NOW())::INTEGER)
        ELSE 0
    END AS trial_days_remaining,
    -- Aggregated stats
    COALESCE(SUM(CASE WHEN we.status = 'completed' THEN 1 ELSE 0 END), 0) as successful_executions,
    COALESCE(COUNT(we.id), 0) as total_executions,
    COALESCE(SUM(CASE WHEN da.status = 'completed' THEN 1 ELSE 0 END), 0) as documents_analyzed,
    COALESCE(SUM(we.credits_used), 0) as total_credits_spent
FROM profiles p
LEFT JOIN workflow_executions we ON p.id = we.user_id
LEFT JOIN document_analytics da ON p.id = da.user_id
GROUP BY 
    p.id, p.email, p.full_name, p.tier, p.credits_remaining, 
    p.api_key, p.onboarding_completed, p.created_at, p.updated_at,
    p.trial_started_at, p.trial_expires_at;

-- Create a function to check if user has bot access (paid or trial)
CREATE OR REPLACE FUNCTION user_has_bot_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    trial_active BOOLEAN;
BEGIN
    SELECT tier, 
           (trial_started_at IS NOT NULL AND trial_expires_at > NOW())
    INTO user_tier, trial_active
    FROM profiles 
    WHERE id = user_id;
    
    -- Return true if user is paid OR has active trial
    RETURN (user_tier != 'free' AND user_tier IS NOT NULL) OR trial_active;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically expire trials
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS void AS $$
BEGIN
    -- This function can be called by a cron job to clean up expired trials
    UPDATE profiles 
    SET updated_at = NOW()
    WHERE trial_expires_at IS NOT NULL 
      AND trial_expires_at < NOW() 
      AND tier = 'free';
      
    -- Log expired trials
    INSERT INTO workflow_executions (user_id, workflow_type, status, credits_used, execution_data)
    SELECT id, 'trial_expired', 'completed', 0, 
           json_build_object('expired_at', NOW(), 'trial_end', trial_expires_at)
    FROM profiles 
    WHERE trial_expires_at IS NOT NULL 
      AND trial_expires_at < NOW() 
      AND tier = 'free'
      AND NOT EXISTS (
          SELECT 1 FROM workflow_executions we 
          WHERE we.user_id = profiles.id 
            AND we.workflow_type = 'trial_expired'
      );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON user_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_bot_access(UUID) TO authenticated;

-- Insert a comment to track this migration
INSERT INTO workflow_executions (user_id, workflow_type, status, credits_used, execution_data)
SELECT 
    id,
    'system_migration',
    'completed',
    0,
    json_build_object(
        'migration', 'add_trial_fields',
        'timestamp', NOW(),
        'description', 'Added trial system support to profiles table'
    )
FROM profiles 
WHERE email = 'system@clixen.ai' 
LIMIT 1;

-- If system user doesn't exist, create it for migration tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'system@clixen.ai') THEN
        INSERT INTO profiles (id, email, full_name, tier) 
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            'system@clixen.ai',
            'System User',
            'admin'
        );
        
        INSERT INTO workflow_executions (user_id, workflow_type, status, credits_used, execution_data)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            'system_migration',
            'completed',
            0,
            json_build_object(
                'migration', 'add_trial_fields',
                'timestamp', NOW(),
                'description', 'Added trial system support to profiles table'
            )
        );
    END IF;
END $$;