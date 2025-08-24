-- ============================================================================
-- MANUAL MIGRATION: User Isolation Architecture
-- ============================================================================
-- Copy and paste this entire script into Supabase Dashboard → SQL Editor
-- This creates the complete user isolation system

-- ============================================================================
-- 1. ENHANCE PROFILES TABLE
-- ============================================================================

-- Add new columns for user isolation
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_limit INTEGER DEFAULT 50;

-- Create unique constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_auth_user_id' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_telegram_chat_id' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT unique_telegram_chat_id UNIQUE (telegram_chat_id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_at);

-- ============================================================================
-- 2. TELEGRAM LINKING TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS telegram_linking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linking_token TEXT NOT NULL UNIQUE,
    telegram_chat_id BIGINT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for telegram_linking_tokens
CREATE INDEX IF NOT EXISTS idx_telegram_linking_tokens_token ON telegram_linking_tokens(linking_token);
CREATE INDEX IF NOT EXISTS idx_telegram_linking_tokens_user_id ON telegram_linking_tokens(auth_user_id);

-- ============================================================================
-- 3. USER SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT,
    session_token TEXT NOT NULL,
    jwt_token_hash TEXT,
    context JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_auth_user_id ON user_sessions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_telegram_chat_id ON user_sessions(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- 4. USER AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_audit_log (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT,
    action_type TEXT NOT NULL,
    action_detail TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_audit_log
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON user_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action_type ON user_audit_log(action_type);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user by telegram chat id
CREATE OR REPLACE FUNCTION get_user_by_telegram_chat_id(chat_id BIGINT)
RETURNS TABLE (
    auth_user_id UUID,
    profile_id UUID,
    email TEXT,
    tier TEXT,
    trial_active BOOLEAN,
    quota_used INTEGER,
    quota_limit INTEGER,
    telegram_username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.auth_user_id,
        p.id as profile_id,
        p.email,
        p.tier,
        (p.trial_started_at IS NOT NULL AND p.trial_expires_at > NOW()) as trial_active,
        COALESCE(p.quota_used, 0) as quota_used,
        COALESCE(p.quota_limit, 50) as quota_limit,
        p.telegram_username
    FROM profiles p
    WHERE p.telegram_chat_id = chat_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create linking token
CREATE OR REPLACE FUNCTION create_telegram_linking_token(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    -- Generate secure random token
    token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert token
    INSERT INTO telegram_linking_tokens (auth_user_id, linking_token)
    VALUES (user_id, token);
    
    RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link telegram account
CREATE OR REPLACE FUNCTION link_telegram_account(
    linking_token_param TEXT,
    chat_id_param BIGINT,
    username_param TEXT DEFAULT NULL,
    first_name_param TEXT DEFAULT NULL,
    last_name_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    token_record RECORD;
    profile_record RECORD;
BEGIN
    -- Find and validate linking token
    SELECT * INTO token_record
    FROM telegram_linking_tokens
    WHERE linking_token = linking_token_param
      AND expires_at > NOW()
      AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired linking token'
        );
    END IF;
    
    -- Update profile with Telegram info
    UPDATE profiles 
    SET 
        telegram_chat_id = chat_id_param::TEXT,
        telegram_username = username_param,
        telegram_first_name = first_name_param,
        telegram_last_name = last_name_param,
        telegram_linked_at = NOW(),
        updated_at = NOW()
    WHERE auth_user_id = token_record.auth_user_id
    RETURNING * INTO profile_record;
    
    -- Mark token as used
    UPDATE telegram_linking_tokens
    SET used_at = NOW()
    WHERE id = token_record.id;
    
    -- Log the linking event
    INSERT INTO user_audit_log (
        auth_user_id, 
        telegram_chat_id, 
        action_type, 
        action_detail, 
        context
    ) VALUES (
        token_record.auth_user_id,
        chat_id_param,
        'auth_event',
        'telegram_account_linked',
        jsonb_build_object(
            'username', username_param,
            'first_name', first_name_param,
            'linking_method', 'token'
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', profile_record.auth_user_id,
        'profile_id', profile_record.id,
        'telegram_chat_id', chat_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user quota
CREATE OR REPLACE FUNCTION increment_user_quota(user_id UUID, amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    user_limit INTEGER;
BEGIN
    SELECT COALESCE(quota_used, 0), COALESCE(quota_limit, 50) 
    INTO current_usage, user_limit
    FROM profiles 
    WHERE auth_user_id = user_id;
    
    IF current_usage + amount <= user_limit THEN
        UPDATE profiles 
        SET quota_used = COALESCE(quota_used, 0) + amount,
            last_activity_at = NOW()
        WHERE auth_user_id = user_id;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_linking_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM telegram_linking_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE telegram_linking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
DROP POLICY IF EXISTS profiles_user_isolation ON profiles;
CREATE POLICY profiles_user_isolation ON profiles
    FOR ALL USING (auth_user_id = auth.uid());

-- Linking tokens: Users can only access their own tokens
DROP POLICY IF EXISTS linking_tokens_user_isolation ON telegram_linking_tokens;
CREATE POLICY linking_tokens_user_isolation ON telegram_linking_tokens
    FOR ALL USING (auth_user_id = auth.uid());

-- Sessions: Users can only access their own sessions
DROP POLICY IF EXISTS sessions_user_isolation ON user_sessions;
CREATE POLICY sessions_user_isolation ON user_sessions
    FOR ALL USING (auth_user_id = auth.uid());

-- Audit log: Users can read their own audit log
DROP POLICY IF EXISTS audit_log_user_isolation ON user_audit_log;
CREATE POLICY audit_log_user_isolation ON user_audit_log
    FOR SELECT USING (auth_user_id = auth.uid());

-- ============================================================================
-- 7. GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant table permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON telegram_linking_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON user_audit_log TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_user_by_telegram_chat_id(BIGINT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_telegram_linking_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION link_telegram_account(TEXT, BIGINT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_user_quota(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_linking_tokens() TO authenticated;

-- ============================================================================
-- 8. POPULATE AUTH_USER_ID FOR EXISTING USERS
-- ============================================================================

-- Update existing profiles to link with auth.users
-- This assumes email is the linking field between profiles and auth.users
DO $$
DECLARE
    profile_record RECORD;
    auth_user_record RECORD;
BEGIN
    -- For each profile without auth_user_id
    FOR profile_record IN 
        SELECT id, email FROM profiles WHERE auth_user_id IS NULL
    LOOP
        -- Find matching auth.users record
        SELECT id INTO auth_user_record
        FROM auth.users 
        WHERE email = profile_record.email;
        
        -- Update profile with auth_user_id
        IF FOUND THEN
            UPDATE profiles 
            SET auth_user_id = auth_user_record.id,
                updated_at = NOW()
            WHERE id = profile_record.id;
            
            RAISE NOTICE 'Linked profile % to auth user %', profile_record.id, auth_user_record.id;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth with Telegram integration';
COMMENT ON TABLE telegram_linking_tokens IS 'Secure tokens for linking Telegram accounts to user profiles';
COMMENT ON TABLE user_sessions IS 'Active user sessions for JWT token tracking';
COMMENT ON TABLE user_audit_log IS 'Complete audit trail of all user actions across the system';

COMMENT ON COLUMN profiles.auth_user_id IS 'Link to Supabase auth.users table';
COMMENT ON COLUMN profiles.quota_used IS 'Current API usage count';
COMMENT ON COLUMN profiles.quota_limit IS 'Maximum API calls allowed per period';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
SELECT 
    'telegram_linking_tokens' as table_name,
    COUNT(*) as row_count
FROM telegram_linking_tokens
UNION ALL
SELECT 
    'user_sessions' as table_name,
    COUNT(*) as row_count  
FROM user_sessions
UNION ALL
SELECT 
    'user_audit_log' as table_name,
    COUNT(*) as row_count
FROM user_audit_log
UNION ALL
SELECT 
    'profiles_with_auth_id' as table_name,
    COUNT(*) as row_count
FROM profiles 
WHERE auth_user_id IS NOT NULL;

-- Show the successful migration message
SELECT 
    '🎉 User Isolation Architecture Migration Complete!' as status,
    'All tables, functions, and policies have been created.' as message,
    'You can now deploy the authenticated webhook handlers.' as next_step;