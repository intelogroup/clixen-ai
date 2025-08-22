#!/usr/bin/env node

/**
 * Create Main Orchestrator Workflow
 * Central routing hub for all automation services
 */

const fs = require('fs').promises;

const ORCHESTRATOR_CONFIG = {
    name: "Main Orchestrator - B2C Platform",
    description: "Central routing and session management for all automation services",
    
    services: {
        document_analytics: {
            webhook: "document-analytics",
            timeout: 30000,
            async: true
        },
        task_scheduling: {
            webhook: "task-scheduler",
            timeout: 5000,
            async: false
        },
        api_automation: {
            webhook: "api-automation",
            timeout: 20000,
            async: true
        },
        marketing_automation: {
            webhook: "marketing-automation",
            timeout: 10000,
            async: true
        },
        data_transformation: {
            webhook: "data-transformation",
            timeout: 15000,
            async: true
        }
    },
    
    rateLimits: {
        free: {
            requests_per_day: 100,
            concurrent_jobs: 3
        },
        pro: {
            requests_per_day: 1000,
            concurrent_jobs: 10
        },
        enterprise: {
            requests_per_day: -1, // unlimited
            concurrent_jobs: 50
        }
    }
};

/**
 * Create the Main Orchestrator workflow
 */
async function createMainOrchestrator() {
    const workflow = {
        name: ORCHESTRATOR_CONFIG.name,
        nodes: [
            {
                parameters: {
                    path: "/api/orchestrate",
                    method: "POST",
                    responseMode: "responseNode",
                    options: {
                        responseHeaders: {
                            entries: [
                                {
                                    name: "X-Request-ID",
                                    value: "={{ $execution.id }}"
                                }
                            ]
                        }
                    }
                },
                id: "webhook-main",
                name: "Main Entry Point",
                type: "n8n-nodes-base.webhook",
                typeVersion: 1.1,
                position: [250, 300],
                webhookId: "main-orchestrator"
            },
            {
                parameters: {
                    jsCode: `// Validate authentication and rate limits
const input = $input.first().json;
const headers = $input.first().headers;

// Extract user info (simplified - in production use JWT)
const userId = input.user_id || headers['x-user-id'] || 'anonymous';
const apiKey = headers['x-api-key'] || input.api_key;

// Validate required fields
if (!input.service) {
    throw new Error('Missing required field: service');
}

if (!input.data) {
    throw new Error('Missing required field: data');
}

// Check if service exists
const validServices = ${JSON.stringify(Object.keys(ORCHESTRATOR_CONFIG.services))};
if (!validServices.includes(input.service)) {
    throw new Error(\`Invalid service: \${input.service}. Valid services: \${validServices.join(', ')}\`);
}

// TODO: Check rate limits from database
const userTier = apiKey ? 'pro' : 'free';
const rateLimit = ${JSON.stringify(ORCHESTRATOR_CONFIG.rateLimits)};
const userLimits = rateLimit[userTier];

// Create execution context
const context = {
    execution_id: $execution.id,
    user_id: userId,
    user_tier: userTier,
    service: input.service,
    timestamp: new Date().toISOString(),
    rate_limits: userLimits,
    request_data: input.data,
    metadata: input.metadata || {}
};

return context;`
                },
                id: "validate-auth",
                name: "Validate & Auth",
                type: "n8n-nodes-base.code",
                typeVersion: 2,
                position: [450, 300]
            },
            {
                parameters: {
                    operation: "get",
                    schema: "public",
                    table: "sessions",
                    returnAll: false,
                    limit: 1,
                    filterType: "manual",
                    filters: {
                        conditions: [
                            {
                                field: "user_id",
                                type: "string",
                                operation: "equals",
                                value: "={{ $json.user_id }}"
                            }
                        ]
                    },
                    additionalFields: {}
                },
                id: "get-session",
                name: "Get User Session",
                type: "n8n-nodes-base.supabase",
                typeVersion: 1,
                position: [650, 200],
                credentials: {
                    supabaseApi: {
                        id: "supabase-credentials",
                        name: "Supabase"
                    }
                },
                continueOnFail: true
            },
            {
                parameters: {
                    jsCode: `// Manage user session
const context = $input.first().json;
const sessionData = $('Get User Session').first().json;

let session;
if (sessionData && !sessionData.error) {
    // Update existing session
    session = {
        ...sessionData,
        last_activity: new Date().toISOString(),
        request_count: (sessionData.request_count || 0) + 1
    };
} else {
    // Create new session
    session = {
        id: \`session_\${Date.now()}\`,
        user_id: context.user_id,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        request_count: 1,
        context: {}
    };
}

// Add session to context
context.session = session;

// Check concurrent jobs
if (session.active_jobs >= context.rate_limits.concurrent_jobs) {
    throw new Error(\`Concurrent job limit reached. Maximum: \${context.rate_limits.concurrent_jobs}\`);
}

return context;`
                },
                id: "session-manager",
                name: "Session Manager",
                type: "n8n-nodes-base.code",
                typeVersion: 2,
                position: [850, 300]
            },
            {
                parameters: {
                    mode: "expression",
                    value: "={{ $json.service }}",
                    options: {}
                },
                id: "service-router",
                name: "Route to Service",
                type: "n8n-nodes-base.switch",
                typeVersion: 3,
                position: [1050, 300]
            },
            {
                parameters: {
                    method: "POST",
                    url: "={{ 'https://clixen.app.n8n.cloud/webhook/' + $json.service }}",
                    sendBody: true,
                    bodyParameters: {
                        parameters: [
                            {
                                name: "execution_id",
                                value: "={{ $json.execution_id }}"
                            },
                            {
                                name: "user_id",
                                value: "={{ $json.user_id }}"
                            },
                            {
                                name: "data",
                                value: "={{ $json.request_data }}"
                            },
                            {
                                name: "session",
                                value: "={{ $json.session }}"
                            }
                        ]
                    },
                    options: {
                        timeout: 30000
                    }
                },
                id: "execute-service",
                name: "Execute Service",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.1,
                position: [1250, 300]
            },
            {
                parameters: {
                    operation: "insert",
                    schema: "public",
                    table: "executions",
                    columns: "user_id,workflow_type,status,input_data,started_at",
                    additionalFields: {}
                },
                id: "log-execution",
                name: "Log Execution",
                type: "n8n-nodes-base.supabase",
                typeVersion: 1,
                position: [1250, 450],
                credentials: {
                    supabaseApi: {
                        id: "supabase-credentials",
                        name: "Supabase"
                    }
                }
            },
            {
                parameters: {
                    jsCode: `// Prepare response
const context = $input.first().json;
const serviceResult = $('Execute Service').first().json;

const response = {
    success: true,
    execution_id: context.execution_id,
    service: context.service,
    status: serviceResult.status || 'completed',
    result: serviceResult,
    processing_time_ms: Date.now() - new Date(context.timestamp).getTime(),
    timestamp: new Date().toISOString()
};

// Handle async jobs
if (${JSON.stringify(ORCHESTRATOR_CONFIG.services)}[context.service].async) {
    response.message = 'Job queued for processing. Use execution_id to check status.';
    response.status = 'processing';
}

return response;`
                },
                id: "prepare-response",
                name: "Prepare Response",
                type: "n8n-nodes-base.code",
                typeVersion: 2,
                position: [1450, 300]
            },
            {
                parameters: {
                    respondWith: "json",
                    responseBody: {
                        json: "={{ $json }}",
                    },
                    options: {
                        responseCode: 200
                    }
                },
                id: "respond",
                name: "Send Response",
                type: "n8n-nodes-base.respondToWebhook",
                typeVersion: 1,
                position: [1650, 300]
            },
            {
                parameters: {
                    jsCode: `// Error handler
const error = $input.first().error;
const context = $input.all()[0].json;

// Log error
console.error('Orchestrator Error:', error);

// Prepare error response
const errorResponse = {
    success: false,
    error: {
        code: error.code || 'ORCHESTRATOR_ERROR',
        message: error.message || 'An error occurred',
        details: error.details || {}
    },
    execution_id: context?.execution_id || $execution.id,
    timestamp: new Date().toISOString()
};

// Log to database (if possible)
// TODO: Add error logging to Supabase

return errorResponse;`
                },
                id: "error-handler",
                name: "Error Handler",
                type: "n8n-nodes-base.code",
                typeVersion: 2,
                position: [1450, 500]
            }
        ],
        connections: {
            "Main Entry Point": {
                "main": [[{ "node": "Validate & Auth", "type": "main", "index": 0 }]]
            },
            "Validate & Auth": {
                "main": [[
                    { "node": "Get User Session", "type": "main", "index": 0 },
                    { "node": "Session Manager", "type": "main", "index": 0 }
                ]]
            },
            "Get User Session": {
                "main": [[{ "node": "Session Manager", "type": "main", "index": 0 }]]
            },
            "Session Manager": {
                "main": [[{ "node": "Route to Service", "type": "main", "index": 0 }]]
            },
            "Route to Service": {
                "main": [
                    [{ "node": "Execute Service", "type": "main", "index": 0 }],
                    [{ "node": "Execute Service", "type": "main", "index": 0 }],
                    [{ "node": "Execute Service", "type": "main", "index": 0 }],
                    [{ "node": "Execute Service", "type": "main", "index": 0 }],
                    [{ "node": "Execute Service", "type": "main", "index": 0 }]
                ]
            },
            "Execute Service": {
                "main": [[
                    { "node": "Log Execution", "type": "main", "index": 0 },
                    { "node": "Prepare Response", "type": "main", "index": 0 }
                ]]
            },
            "Prepare Response": {
                "main": [[{ "node": "Send Response", "type": "main", "index": 0 }]]
            },
            "Error Handler": {
                "main": [[{ "node": "Send Response", "type": "main", "index": 0 }]]
            }
        },
        settings: {
            executionOrder: "v1",
            saveManualExecutions: true,
            callerPolicy: "workflowsFromSameOwner",
            errorWorkflow: "global-error-handler"
        },
        staticData: null,
        tags: [
            {
                name: "orchestrator",
                createdAt: "2024-01-01T00:00:00.000Z"
            },
            {
                name: "core",
                createdAt: "2024-01-01T00:00:00.000Z"
            }
        ]
    };
    
    await fs.writeFile(
        './workflows/main-orchestrator.json',
        JSON.stringify(workflow, null, 2)
    );
    
    console.log('✅ Main Orchestrator workflow created');
    return workflow;
}

/**
 * Create API documentation
 */
async function createAPIDocs() {
    const apiDocs = `# Main Orchestrator API Documentation

## Endpoint
POST /api/orchestrate

## Headers
- Content-Type: application/json
- X-API-Key: {your-api-key} (optional, for pro features)
- X-User-ID: {user-id} (required if no api key)

## Request Body
\`\`\`json
{
    "service": "document_analytics|task_scheduling|api_automation|marketing_automation|data_transformation",
    "data": {
        // Service-specific data
    },
    "metadata": {
        // Optional metadata
    }
}
\`\`\`

## Services

### Document Analytics
\`\`\`json
{
    "service": "document_analytics",
    "data": {
        "file_url": "https://example.com/document.pdf",
        "file_type": "pdf",
        "analysis_options": {
            "statistics": true,
            "insights": true,
            "visualizations": true
        },
        "output_format": "pdf",
        "delivery_email": "user@example.com"
    }
}
\`\`\`

### Task Scheduling
\`\`\`json
{
    "service": "task_scheduling",
    "data": {
        "task_description": "Send quarterly report",
        "schedule_time": "2024-03-31T09:00:00Z",
        "recurrence": "quarterly",
        "notification_channels": ["email", "sms"]
    }
}
\`\`\`

### API Automation
\`\`\`json
{
    "service": "api_automation",
    "data": {
        "source_service": "google_sheets",
        "target_service": "slack",
        "action": "sync_on_update",
        "mapping": {
            "sheet_column_a": "slack_message"
        }
    }
}
\`\`\`

## Response

### Success Response
\`\`\`json
{
    "success": true,
    "execution_id": "exec_123456789",
    "service": "document_analytics",
    "status": "processing|completed",
    "result": {
        // Service-specific results
    },
    "processing_time_ms": 1234,
    "timestamp": "2024-01-01T12:00:00Z"
}
\`\`\`

### Error Response
\`\`\`json
{
    "success": false,
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Daily request limit reached",
        "details": {
            "limit": 100,
            "used": 100
        }
    },
    "execution_id": "exec_123456789",
    "timestamp": "2024-01-01T12:00:00Z"
}
\`\`\`

## Rate Limits

| Tier | Requests/Day | Concurrent Jobs | Max File Size |
|------|-------------|-----------------|---------------|
| Free | 100 | 3 | 10MB |
| Pro | 1000 | 10 | 100MB |
| Enterprise | Unlimited | 50 | 500MB |

## Status Codes

- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid API key)
- 429: Rate Limit Exceeded
- 500: Internal Server Error
- 503: Service Unavailable
`;
    
    await fs.writeFile('./docs/API_DOCUMENTATION.md', apiDocs);
    console.log('📚 API documentation created');
}

/**
 * Main execution
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MAIN ORCHESTRATOR CREATOR');
    console.log('='.repeat(60));
    
    console.log('\n📋 Features:');
    console.log('• Central routing for all services');
    console.log('• User authentication & session management');
    console.log('• Rate limiting by tier');
    console.log('• Async job handling');
    console.log('• Error handling & logging');
    
    // Create workflow
    await createMainOrchestrator();
    
    // Create API docs
    await createAPIDocs();
    
    console.log('\n✅ Main Orchestrator setup complete!');
    console.log('\n📚 Files created:');
    console.log('• workflows/main-orchestrator.json');
    console.log('• docs/API_DOCUMENTATION.md');
    
    console.log('\n🔗 Integration Points:');
    console.log('• Entry: POST /api/orchestrate');
    console.log('• Routes to: 5 service workflows');
    console.log('• Database: Supabase for sessions & logs');
    console.log('• Auth: API key based tier system');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createMainOrchestrator, ORCHESTRATOR_CONFIG };