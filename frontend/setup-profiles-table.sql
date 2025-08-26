-- Setup profiles table for NeonAuth + Stack integration
-- Run this SQL against your Neon database

-- First, let's check if profiles table exists and create it if needed
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stack_user_id TEXT UNIQUE, -- Link to Stack Auth user
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    telegram_chat_id TEXT UNIQUE,
    telegram_username TEXT,
    telegram_first_name TEXT,
    telegram_last_name TEXT,
    telegram_linked_at TIMESTAMPTZ,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
    trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    trial_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    trial_active BOOLEAN DEFAULT true,
    quota_used INTEGER DEFAULT 0,
    quota_limit INTEGER DEFAULT 50, -- -1 for unlimited
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Stack Auth column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='stack_user_id') THEN
        ALTER TABLE profiles ADD COLUMN stack_user_id TEXT UNIQUE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stack_user_id ON profiles(stack_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create usage logs table for tracking automation usage
CREATE TABLE IF NOT EXISTS usage_logs (
    id BIGSERIAL PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stack_user_id TEXT,
    telegram_chat_id TEXT,
    action TEXT NOT NULL,
    telegram_message_id BIGINT,
    workflow_type TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_profile_id ON usage_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_stack_user_id ON usage_logs(stack_user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- Sample data (optional - remove in production)
-- This creates a test user profile that you can link to Stack Auth
INSERT INTO profiles (
    email, 
    display_name, 
    tier, 
    quota_limit,
    trial_active
) VALUES (
    'test@example.com',
    'Test User', 
    'free',
    50,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();