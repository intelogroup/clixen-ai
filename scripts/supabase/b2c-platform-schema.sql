-- B2C Automation Platform - Complete Database Schema
-- Supabase PostgreSQL Database Setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    api_key VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{
        "notifications": {
            "email": true,
            "sms": false,
            "push": false
        },
        "timezone": "UTC",
        "language": "en"
    }'
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_users_tier ON users(tier);

-- =====================================================
-- SESSIONS & AUTHENTICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    ip_address INET,
    user_agent TEXT,
    context JSONB DEFAULT '{}',
    request_count INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    CONSTRAINT valid_session CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- WORKFLOW EXECUTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    workflow_type VARCHAR(100) NOT NULL,
    workflow_id VARCHAR(255),
    execution_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'canceled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    input_data JSONB,
    output_data JSONB,
    error JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    parent_execution_id UUID REFERENCES executions(id),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_workflow_type ON executions(workflow_type);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);

-- =====================================================
-- DOCUMENT ANALYTICS JOBS
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50) CHECK (file_type IN ('pdf', 'csv', 'xlsx', 'docx', 'txt', 'json')),
    file_size_bytes BIGINT,
    analysis_type TEXT[] DEFAULT '{}',
    processing_status VARCHAR(50) DEFAULT 'pending',
    results JSONB,
    statistics JSONB,
    insights JSONB,
    charts JSONB,
    report_url TEXT,
    report_format VARCHAR(20) CHECK (report_format IN ('pdf', 'ppt', 'excel', 'json')),
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('email', 'download', 'webhook')),
    delivery_status VARCHAR(50),
    delivery_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_analytics_jobs_user_id ON analytics_jobs(user_id);
CREATE INDEX idx_analytics_jobs_execution_id ON analytics_jobs(execution_id);
CREATE INDEX idx_analytics_jobs_created_at ON analytics_jobs(created_at DESC);

-- =====================================================
-- SCHEDULED TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_id VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(100),
    cron_expression VARCHAR(100),
    schedule_type VARCHAR(50) CHECK (schedule_type IN ('once', 'recurring', 'interval')),
    schedule_config JSONB,
    payload JSONB,
    notification_channels TEXT[] DEFAULT '{}',
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    max_runs INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
CREATE INDEX idx_scheduled_tasks_next_run ON scheduled_tasks(next_run);
CREATE INDEX idx_scheduled_tasks_active ON scheduled_tasks(active);

-- =====================================================
-- API INTEGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) CHECK (service_type IN ('oauth2', 'api_key', 'basic_auth', 'webhook')),
    credentials JSONB, -- Encrypted in application layer
    config JSONB,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'expired')),
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_integrations_user_id ON api_integrations(user_id);
CREATE INDEX idx_api_integrations_service ON api_integrations(service_name);

-- =====================================================
-- USAGE METRICS & BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255),
    value NUMERIC NOT NULL,
    unit VARCHAR(50),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    tier_at_time VARCHAR(50),
    billable BOOLEAN DEFAULT false,
    cost DECIMAL(10, 4) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX idx_usage_metrics_timestamp ON usage_metrics(timestamp DESC);
CREATE INDEX idx_usage_metrics_billable ON usage_metrics(billable);

-- =====================================================
-- NOTIFICATIONS & ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error', 'alert')),
    channel VARCHAR(50) CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- WORKFLOW TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    workflow_json JSONB NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    use_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2),
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public);

-- =====================================================
-- USER SUBSCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_template_id UUID REFERENCES workflow_templates(id),
    active BOOLEAN DEFAULT true,
    config JSONB,
    last_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_template_id ON subscriptions(workflow_template_id);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User usage summary
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
    u.id,
    u.email,
    u.tier,
    COUNT(DISTINCT e.id) as total_executions,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as successful_executions,
    COUNT(DISTINCT s.id) as active_sessions,
    COUNT(DISTINCT st.id) as scheduled_tasks,
    COUNT(DISTINCT ai.id) as api_integrations,
    COALESCE(SUM(um.value) FILTER (WHERE um.metric_type = 'api_calls'), 0) as total_api_calls,
    MAX(u.last_login) as last_active
FROM users u
LEFT JOIN executions e ON u.id = e.user_id AND e.started_at > NOW() - INTERVAL '30 days'
LEFT JOIN sessions s ON u.id = s.user_id AND s.expires_at > NOW()
LEFT JOIN scheduled_tasks st ON u.id = st.user_id AND st.active = true
LEFT JOIN api_integrations ai ON u.id = ai.user_id AND ai.status = 'active'
LEFT JOIN usage_metrics um ON u.id = um.user_id AND um.timestamp > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.tier;

-- Daily active users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
    DATE(timestamp) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_actions
FROM audit_log
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Workflow performance stats
CREATE OR REPLACE VIEW workflow_performance AS
SELECT 
    workflow_type,
    COUNT(*) as total_executions,
    AVG(duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as success_rate
FROM executions
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY workflow_type;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update user tier based on usage
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-upgrade logic based on usage
    IF NEW.value > 1000 AND OLD.tier = 'free' THEN
        UPDATE users SET tier = 'pro' WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tier_on_usage
    AFTER INSERT OR UPDATE ON usage_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tier();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user's remaining quota
CREATE OR REPLACE FUNCTION get_user_quota(p_user_id UUID)
RETURNS TABLE (
    tier VARCHAR,
    daily_limit INTEGER,
    used_today INTEGER,
    remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.tier,
        CASE u.tier
            WHEN 'free' THEN 100
            WHEN 'pro' THEN 1000
            WHEN 'enterprise' THEN -1
        END as daily_limit,
        COUNT(e.id)::INTEGER as used_today,
        GREATEST(0, 
            CASE u.tier
                WHEN 'free' THEN 100
                WHEN 'pro' THEN 1000
                WHEN 'enterprise' THEN 999999
            END - COUNT(e.id)::INTEGER
        ) as remaining
    FROM users u
    LEFT JOIN executions e ON u.id = e.user_id 
        AND e.started_at > CURRENT_DATE
    WHERE u.id = p_user_id
    GROUP BY u.tier;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own executions" ON executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own executions" ON executions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default workflow templates
INSERT INTO workflow_templates (name, category, description, workflow_json, tags) VALUES
('Document Analytics Starter', 'analytics', 'Basic document analysis with statistics', '{}', ARRAY['document', 'analytics', 'starter']),
('Daily Task Reminder', 'scheduling', 'Send daily task reminders via email', '{}', ARRAY['scheduling', 'email', 'daily']),
('API Data Sync', 'integration', 'Sync data between two APIs', '{}', ARRAY['api', 'sync', 'integration']),
('Newsletter Campaign', 'marketing', 'Send newsletter to subscribers', '{}', ARRAY['email', 'marketing', 'newsletter']),
('CSV to JSON Converter', 'transformation', 'Convert CSV files to JSON format', '{}', ARRAY['csv', 'json', 'transform'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;