-- Add missing tables required by the deployed workflows

-- =====================================================
-- ERROR LOGS TABLE (Referenced by Global Error Handler)
-- =====================================================

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(255),
    workflow_name VARCHAR(255),
    node_name VARCHAR(255),
    node_type VARCHAR(255),
    error_type VARCHAR(100),
    error_message TEXT,
    error_stack TEXT,
    error_code VARCHAR(100),
    severity VARCHAR(50) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    execution_id VARCHAR(255),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_workflow_id ON error_logs(workflow_id);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- =====================================================
-- EXECUTION METRICS TABLE (Referenced by Execution Logger)
-- =====================================================

CREATE TABLE IF NOT EXISTS execution_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(255),
    workflow_name VARCHAR(255),
    execution_id VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('pending', 'running', 'success', 'error', 'canceled')),
    mode VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    error_node VARCHAR(255),
    retry_count INTEGER DEFAULT 0,
    node_count INTEGER,
    total_items INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_execution_metrics_workflow_id ON execution_metrics(workflow_id);
CREATE INDEX idx_execution_metrics_status ON execution_metrics(status);
CREATE INDEX idx_execution_metrics_created_at ON execution_metrics(created_at DESC);
CREATE INDEX idx_execution_metrics_start_time ON execution_metrics(start_time DESC);