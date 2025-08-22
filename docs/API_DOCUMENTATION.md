# Main Orchestrator API Documentation

## Endpoint
POST /api/orchestrate

## Headers
- Content-Type: application/json
- X-API-Key: {your-api-key} (optional, for pro features)
- X-User-ID: {user-id} (required if no api key)

## Request Body
```json
{
    "service": "document_analytics|task_scheduling|api_automation|marketing_automation|data_transformation",
    "data": {
        // Service-specific data
    },
    "metadata": {
        // Optional metadata
    }
}
```

## Services

### Document Analytics
```json
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
```

### Task Scheduling
```json
{
    "service": "task_scheduling",
    "data": {
        "task_description": "Send quarterly report",
        "schedule_time": "2024-03-31T09:00:00Z",
        "recurrence": "quarterly",
        "notification_channels": ["email", "sms"]
    }
}
```

### API Automation
```json
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
```

## Response

### Success Response
```json
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
```

### Error Response
```json
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
```

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
