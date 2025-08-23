-- Telegram Integration Database Schema Extensions
-- Extends the existing B2C platform schema with Telegram bot support
-- Run this after the main b2c-platform-schema.sql

-- =====================================================
-- TELEGRAM ACCOUNT LINKING
-- =====================================================

-- Telegram accounts linked to users
CREATE TABLE IF NOT EXISTS telegram_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    activation_token VARCHAR(255) UNIQUE,
    activation_method VARCHAR(50) CHECK (activation_method IN ('web_to_telegram', 'telegram_to_web')),
    activated_at TIMESTAMP WITH TIME ZONE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversation_state JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{
        "language": "en",
        "timezone": "UTC",
        "notifications": true,
        "workflow_suggestions": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_telegram_accounts_telegram_id ON telegram_accounts(telegram_id);
CREATE INDEX idx_telegram_accounts_user_id ON telegram_accounts(user_id);
CREATE INDEX idx_telegram_accounts_activation_token ON telegram_accounts(activation_token);
CREATE INDEX idx_telegram_accounts_activated_at ON telegram_accounts(activated_at);
CREATE INDEX idx_telegram_accounts_last_active ON telegram_accounts(last_active DESC);

-- =====================================================
-- PAYMENT SESSIONS
-- =====================================================

-- Payment sessions for linking payments to users
CREATE TABLE IF NOT EXISTS payment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT,
    user_id UUID REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    tier VARCHAR(50) CHECK (tier IN ('free', 'pro', 'enterprise')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired', 'cancelled')),
    stripe_session_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    payment_method VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure either telegram_id or user_id is provided
    CONSTRAINT payment_session_user_check CHECK (telegram_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_payment_sessions_telegram_id ON payment_sessions(telegram_id);
CREATE INDEX idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_session_token ON payment_sessions(session_token);
CREATE INDEX idx_payment_sessions_stripe_session_id ON payment_sessions(stripe_session_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_expires_at ON payment_sessions(expires_at);

-- =====================================================
-- ENHANCED WORKFLOW USAGE TRACKING
-- =====================================================

-- Enhanced workflow usage tracking (extends existing workflow_usage if exists)
CREATE TABLE IF NOT EXISTS workflow_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    telegram_id BIGINT,
    workflow_type VARCHAR(100) NOT NULL,
    workflow_name VARCHAR(255),
    
    -- Execution details
    nodes_executed INTEGER DEFAULT 0,
    credits_consumed INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER,
    input_size_bytes INTEGER,
    output_size_bytes INTEGER,
    
    -- AI usage tracking
    ai_models_used JSONB DEFAULT '{}', -- {"gpt-4": 2, "claude-3": 1}
    ai_tokens_consumed INTEGER DEFAULT 0,
    ai_cost_usd DECIMAL(10,4) DEFAULT 0,
    
    -- Status and error tracking
    status VARCHAR(50) NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'running', 'completed', 'failed', 'timeout', 'cancelled')),
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Data storage
    input_data JSONB,
    output_data JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Performance tracking
    queue_time_ms INTEGER,
    n8n_execution_id VARCHAR(255)
);

-- Indexes for workflow usage
CREATE INDEX idx_workflow_usage_user_id ON workflow_usage(user_id);
CREATE INDEX idx_workflow_usage_telegram_id ON workflow_usage(telegram_id);
CREATE INDEX idx_workflow_usage_execution_id ON workflow_usage(execution_id);
CREATE INDEX idx_workflow_usage_workflow_type ON workflow_usage(workflow_type);
CREATE INDEX idx_workflow_usage_status ON workflow_usage(status);
CREATE INDEX idx_workflow_usage_started_at ON workflow_usage(started_at DESC);
CREATE INDEX idx_workflow_usage_completed_at ON workflow_usage(completed_at DESC);
CREATE INDEX idx_workflow_usage_credits ON workflow_usage(credits_consumed);

-- =====================================================
-- USER CREDITS MANAGEMENT
-- =====================================================

-- Enhanced user credits table
CREATE TABLE IF NOT EXISTS user_credits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL DEFAULT 'free',
    
    -- Credit amounts
    total_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER DEFAULT 0,
    bonus_credits INTEGER DEFAULT 0,
    rollover_credits INTEGER DEFAULT 0, -- Unused credits from previous month
    
    -- Billing cycle
    billing_cycle_start TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', CURRENT_DATE),
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', CURRENT_DATE + INTERVAL '1 month'),
    
    -- Limits
    daily_limit INTEGER,
    monthly_limit INTEGER,
    workflow_limits JSONB DEFAULT '{}', -- Per-workflow limits
    
    -- Tracking
    last_credit_purchase TIMESTAMP WITH TIME ZONE,
    last_reset TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credits_non_negative CHECK (total_credits >= 0 AND used_credits >= 0 AND bonus_credits >= 0)
);

-- Indexes
CREATE INDEX idx_user_credits_tier ON user_credits(tier);
CREATE INDEX idx_user_credits_reset_date ON user_credits(reset_date);
CREATE INDEX idx_user_credits_updated_at ON user_credits(updated_at DESC);

-- =====================================================
-- WORKFLOW TEMPLATES & MARKETPLACE
-- =====================================================

-- Enhanced workflow templates
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    category VARCHAR(100),
    description TEXT,
    
    -- Template data
    workflow_json JSONB NOT NULL,
    thumbnail_url TEXT,
    screenshot_urls TEXT[],
    demo_video_url TEXT,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    required_tier VARCHAR(50) DEFAULT 'free',
    credit_cost INTEGER DEFAULT 5,
    estimated_time_seconds INTEGER,
    
    -- Usage stats
    use_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    avg_execution_time_ms INTEGER,
    rating DECIMAL(3,2), -- 0-5 star rating
    rating_count INTEGER DEFAULT 0,
    
    -- Publication
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Ownership
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    config_schema JSONB, -- JSON schema for user configuration
    required_integrations TEXT[], -- Required API keys/integrations
    supported_languages TEXT[] DEFAULT '{"en"}'
);

-- Indexes for workflow templates
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_slug ON workflow_templates(slug);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_featured ON workflow_templates(is_featured);
CREATE INDEX idx_workflow_templates_tier ON workflow_templates(required_tier);
CREATE INDEX idx_workflow_templates_rating ON workflow_templates(rating DESC);
CREATE INDEX idx_workflow_templates_use_count ON workflow_templates(use_count DESC);
CREATE INDEX idx_workflow_templates_created_at ON workflow_templates(created_at DESC);

-- =====================================================
-- USER WORKFLOW SUBSCRIPTIONS
-- =====================================================

-- User subscriptions to workflow templates
CREATE TABLE IF NOT EXISTS user_workflow_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE,
    
    -- Configuration
    active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}', -- User's custom configuration
    schedule_config JSONB, -- If scheduled execution
    
    -- Usage tracking
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    total_credits_consumed INTEGER DEFAULT 0,
    
    -- Subscription details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint
    UNIQUE(user_id, workflow_template_id)
);

-- Indexes
CREATE INDEX idx_user_workflow_subscriptions_user_id ON user_workflow_subscriptions(user_id);
CREATE INDEX idx_user_workflow_subscriptions_template_id ON user_workflow_subscriptions(workflow_template_id);
CREATE INDEX idx_user_workflow_subscriptions_active ON user_workflow_subscriptions(active);
CREATE INDEX idx_user_workflow_subscriptions_next_run ON user_workflow_subscriptions(next_run);

-- =====================================================
-- TELEGRAM BOT ANALYTICS
-- =====================================================

-- Telegram bot interaction analytics
CREATE TABLE IF NOT EXISTS telegram_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    user_id UUID REFERENCES users(id),
    
    -- Interaction details
    interaction_type VARCHAR(50) NOT NULL, -- 'message', 'command', 'callback', 'inline_query'
    command VARCHAR(50), -- If it's a command
    message_text TEXT,
    message_type VARCHAR(50), -- 'text', 'photo', 'document', 'voice', etc.
    
    -- Context
    chat_id BIGINT,
    chat_type VARCHAR(20), -- 'private', 'group', 'supergroup', 'channel'
    message_id INTEGER,
    
    -- Response
    response_text TEXT,
    response_type VARCHAR(50),
    response_time_ms INTEGER,
    
    -- Workflow execution
    workflow_triggered VARCHAR(100),
    workflow_execution_id UUID,
    credits_consumed INTEGER DEFAULT 0,
    
    -- Success/failure
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_telegram_interactions_telegram_id ON telegram_interactions(telegram_id);
CREATE INDEX idx_telegram_interactions_user_id ON telegram_interactions(user_id);
CREATE INDEX idx_telegram_interactions_type ON telegram_interactions(interaction_type);
CREATE INDEX idx_telegram_interactions_timestamp ON telegram_interactions(timestamp DESC);
CREATE INDEX idx_telegram_interactions_workflow ON telegram_interactions(workflow_triggered);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to consume user credits
CREATE OR REPLACE FUNCTION consume_user_credits(
    p_user_id UUID,
    p_credits INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
    remaining_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT (total_credits + bonus_credits + rollover_credits - used_credits)
    INTO current_credits
    FROM user_credits 
    WHERE user_id = p_user_id;
    
    -- Check if user has enough credits
    IF current_credits IS NULL OR current_credits < p_credits THEN
        RETURN FALSE;
    END IF;
    
    -- Consume credits
    UPDATE user_credits 
    SET used_credits = used_credits + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits() RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER := 0;
BEGIN
    UPDATE user_credits 
    SET 
        used_credits = 0,
        rollover_credits = CASE 
            WHEN (total_credits + bonus_credits - used_credits) > 0 
            THEN LEAST((total_credits + bonus_credits - used_credits), total_credits / 2)  -- Max 50% rollover
            ELSE 0 
        END,
        billing_cycle_start = date_trunc('month', CURRENT_DATE),
        reset_date = date_trunc('month', CURRENT_DATE + INTERVAL '1 month'),
        last_reset = NOW(),
        updated_at = NOW()
    WHERE reset_date <= CURRENT_DATE;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS TABLE(
    total_credits INTEGER,
    used_credits INTEGER,
    bonus_credits INTEGER,
    rollover_credits INTEGER,
    remaining_credits INTEGER,
    reset_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.total_credits,
        uc.used_credits,
        uc.bonus_credits,
        uc.rollover_credits,
        (uc.total_credits + uc.bonus_credits + uc.rollover_credits - uc.used_credits) as remaining_credits,
        uc.reset_date
    FROM user_credits uc
    WHERE uc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workflow_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_interactions ENABLE ROW LEVEL SECURITY;

-- Telegram accounts policies
CREATE POLICY telegram_accounts_user_policy ON telegram_accounts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY telegram_accounts_service_policy ON telegram_accounts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment sessions policies
CREATE POLICY payment_sessions_user_policy ON payment_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY payment_sessions_service_policy ON payment_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Workflow usage policies
CREATE POLICY workflow_usage_user_policy ON workflow_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY workflow_usage_service_policy ON workflow_usage
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User credits policies
CREATE POLICY user_credits_user_policy ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_credits_service_policy ON user_credits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User workflow subscriptions policies
CREATE POLICY user_workflow_subscriptions_user_policy ON user_workflow_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Telegram interactions policies (users can see their own interactions)
CREATE POLICY telegram_interactions_user_policy ON telegram_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY telegram_interactions_service_policy ON telegram_interactions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Workflow templates policies (public templates visible to all)
CREATE POLICY workflow_templates_public_policy ON workflow_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY workflow_templates_owner_policy ON workflow_templates
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY workflow_templates_service_policy ON workflow_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER set_telegram_accounts_updated_at
    BEFORE UPDATE ON telegram_accounts
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_workflow_templates_updated_at
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_user_workflow_subscriptions_updated_at
    BEFORE UPDATE ON user_workflow_subscriptions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.tier,
    ta.telegram_id,
    ta.telegram_username,
    ta.last_active as telegram_last_active,
    
    -- Credits
    COALESCE(uc.total_credits, 0) + COALESCE(uc.bonus_credits, 0) + COALESCE(uc.rollover_credits, 0) - COALESCE(uc.used_credits, 0) as credits_remaining,
    COALESCE(uc.total_credits, 0) as credits_total,
    COALESCE(uc.used_credits, 0) as credits_used,
    uc.reset_date as credits_reset_date,
    
    -- Usage stats (last 30 days)
    COALESCE(usage_stats.total_executions, 0) as executions_last_30d,
    COALESCE(usage_stats.successful_executions, 0) as successful_executions_last_30d,
    COALESCE(usage_stats.credits_consumed, 0) as credits_consumed_last_30d,
    
    -- Account info
    u.created_at as account_created,
    ta.activated_at as telegram_activated,
    ta.created_at as telegram_linked
    
FROM users u
LEFT JOIN telegram_accounts ta ON u.id = ta.user_id
LEFT JOIN user_credits uc ON u.id = uc.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
        COALESCE(SUM(credits_consumed), 0) as credits_consumed
    FROM workflow_usage 
    WHERE started_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
) usage_stats ON u.id = usage_stats.user_id;

-- Workflow analytics view
CREATE OR REPLACE VIEW workflow_analytics AS
SELECT 
    wt.id as template_id,
    wt.name,
    wt.category,
    wt.slug,
    wt.required_tier,
    wt.credit_cost,
    
    -- Usage stats
    COUNT(wu.id) as total_executions,
    COUNT(wu.id) FILTER (WHERE wu.status = 'completed') as successful_executions,
    COUNT(wu.id) FILTER (WHERE wu.status = 'failed') as failed_executions,
    
    -- Performance stats
    AVG(wu.execution_time_ms) FILTER (WHERE wu.status = 'completed') as avg_execution_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY wu.execution_time_ms) FILTER (WHERE wu.status = 'completed') as median_execution_time,
    
    -- Financial stats
    COALESCE(SUM(wu.credits_consumed), 0) as total_credits_consumed,
    AVG(wu.credits_consumed) as avg_credits_per_execution,
    
    -- Recent activity
    MAX(wu.started_at) as last_executed,
    COUNT(wu.id) FILTER (WHERE wu.started_at >= NOW() - INTERVAL '24 hours') as executions_last_24h,
    COUNT(wu.id) FILTER (WHERE wu.started_at >= NOW() - INTERVAL '7 days') as executions_last_7d,
    
    wt.created_at,
    wt.updated_at
    
FROM workflow_templates wt
LEFT JOIN workflow_usage wu ON wt.slug = wu.workflow_type
GROUP BY wt.id, wt.name, wt.category, wt.slug, wt.required_tier, wt.credit_cost, wt.created_at, wt.updated_at;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default workflow templates
INSERT INTO workflow_templates (name, slug, category, description, workflow_json, required_tier, credit_cost, tags) VALUES
('Competitor Price Monitor', 'competitor-monitor', 'Business Intelligence', 'Track competitor prices and get alerts when they change', '{}', 'pro', 5, ARRAY['monitoring', 'ecommerce', 'alerts']),
('Social Media Tracker', 'social-tracker', 'Social Media', 'Monitor brand mentions across social media platforms', '{}', 'pro', 3, ARRAY['social', 'monitoring', 'brand']),
('Document Processor', 'document-processor', 'Productivity', 'Extract and analyze data from PDFs, images, and documents', '{}', 'free', 10, ARRAY['documents', 'ai', 'extraction']),
('Email Automation', 'email-automation', 'Communication', 'Smart email filtering, responses, and organization', '{}', 'pro', 2, ARRAY['email', 'automation', 'productivity']),
('News Aggregator', 'news-aggregator', 'Information', 'Curated news updates based on your interests', '{}', 'free', 1, ARRAY['news', 'aggregation', 'information']),
('Lead Generator', 'lead-generator', 'Sales', 'Find and qualify potential customers from various sources', '{}', 'pro', 8, ARRAY['sales', 'leads', 'prospecting']),
('SEO Monitor', 'seo-monitor', 'Marketing', 'Track keyword rankings and SEO performance', '{}', 'pro', 4, ARRAY['seo', 'marketing', 'analytics']),
('Calendar Assistant', 'calendar-assistant', 'Productivity', 'Smart meeting scheduling and calendar management', '{}', 'free', 2, ARRAY['calendar', 'scheduling', 'productivity']),
('Data Reporter', 'data-reporter', 'Analytics', 'Generate automated reports from your data sources', '{}', 'pro', 6, ARRAY['reporting', 'analytics', 'data']),
('Web Scraper', 'web-scraper', 'Data Collection', 'Extract structured data from websites', '{}', 'free', 3, ARRAY['scraping', 'data', 'automation'])
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

-- Cleanup expired payment sessions
CREATE OR REPLACE FUNCTION cleanup_expired_payment_sessions() RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    UPDATE payment_sessions 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Delete old expired sessions (older than 30 days)
    DELETE FROM payment_sessions 
    WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '30 days';
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old workflow usage data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_workflow_usage() RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    DELETE FROM workflow_usage 
    WHERE started_at < NOW() - INTERVAL '90 days'
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Telegram integration schema extensions completed successfully!';
    RAISE NOTICE 'Tables created: telegram_accounts, payment_sessions, workflow_usage, user_credits, workflow_templates, user_workflow_subscriptions, telegram_interactions';
    RAISE NOTICE 'Functions created: consume_user_credits, reset_monthly_credits, get_user_credit_balance';
    RAISE NOTICE 'Views created: user_dashboard, workflow_analytics';
    RAISE NOTICE 'RLS policies applied to all new tables';
END $$;