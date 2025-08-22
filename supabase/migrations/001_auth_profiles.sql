-- B2C Automation Platform - Supabase Auth Integration
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================

-- Create profiles table that references Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    telegram_id TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    credits_remaining INTEGER DEFAULT 100,
    credits_used INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{
        "notifications": {
            "email": true,
            "push": false
        },
        "timezone": "UTC",
        "language": "en"
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_api_key ON profiles(api_key);
CREATE INDEX idx_profiles_tier ON profiles(tier);

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    ip_address INET,
    user_agent TEXT,
    context JSONB DEFAULT '{}',
    request_count INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- WORKFLOW EXECUTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    workflow_type TEXT NOT NULL,
    workflow_name TEXT,
    execution_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'canceled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    input_data JSONB,
    output_data JSONB,
    error_details JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    credits_consumed INTEGER DEFAULT 1,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_executions_type ON workflow_executions(workflow_type);
CREATE INDEX idx_executions_started_at ON workflow_executions(started_at DESC);

-- =====================================================
-- DOCUMENT ANALYTICS JOBS
-- =====================================================

CREATE TABLE IF NOT EXISTS document_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT CHECK (file_type IN ('pdf', 'csv', 'xlsx', 'docx', 'txt')),
    file_size_bytes BIGINT,
    analysis_type TEXT[] DEFAULT ARRAY['statistics'],
    processing_status TEXT DEFAULT 'pending',
    results JSONB,
    insights JSONB,
    charts JSONB,
    report_url TEXT,
    delivery_email TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON document_analytics(user_id);
CREATE INDEX idx_analytics_status ON document_analytics(processing_status);
CREATE INDEX idx_analytics_created_at ON document_analytics(created_at DESC);

-- =====================================================
-- USAGE METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    credits_used INTEGER DEFAULT 1,
    execution_id UUID REFERENCES workflow_executions(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_usage_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_service ON usage_metrics(service_type);
CREATE INDEX idx_usage_timestamp ON usage_metrics(timestamp DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check user credits
CREATE OR REPLACE FUNCTION public.check_user_credits(p_user_id UUID, p_credits_needed INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    remaining_credits INTEGER;
BEGIN
    SELECT credits_remaining INTO remaining_credits
    FROM profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(remaining_credits, 0) >= p_credits_needed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume credits
CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id UUID, p_credits INTEGER DEFAULT 1, p_service TEXT DEFAULT 'unknown')
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    UPDATE profiles 
    SET 
        credits_remaining = credits_remaining - p_credits,
        credits_used = credits_used + p_credits,
        updated_at = NOW()
    WHERE id = p_user_id AND credits_remaining >= p_credits;
    
    IF FOUND THEN
        INSERT INTO usage_metrics (user_id, service_type, credits_used)
        VALUES (p_user_id, p_service, p_credits);
        success := TRUE;
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for profile updates
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for workflow_executions
CREATE POLICY "Users can view own executions" ON workflow_executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions" ON workflow_executions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for document_analytics
CREATE POLICY "Users can view own analytics" ON document_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON document_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for usage_metrics
CREATE POLICY "Users can view own usage" ON usage_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- VIEWS
-- =====================================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.tier,
    p.credits_remaining,
    p.credits_used,
    p.onboarding_completed,
    p.created_at,
    COUNT(DISTINCT we.id) as total_executions,
    COUNT(DISTINCT CASE WHEN we.status = 'completed' THEN we.id END) as successful_executions,
    COUNT(DISTINCT da.id) as documents_analyzed,
    COALESCE(SUM(um.credits_used), 0) as total_credits_spent
FROM profiles p
LEFT JOIN workflow_executions we ON p.id = we.user_id
LEFT JOIN document_analytics da ON p.id = da.user_id
LEFT JOIN usage_metrics um ON p.id = um.user_id
GROUP BY p.id, p.email, p.full_name, p.tier, p.credits_remaining, p.credits_used, p.onboarding_completed, p.created_at;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create a webhook URL for n8n integration
INSERT INTO profiles (id, email, full_name, tier, api_key, credits_remaining)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'system@platform.com',
    'System User',
    'enterprise',
    'system_webhook_key_' || encode(gen_random_bytes(16), 'hex'),
    999999
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'system@platform.com');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;