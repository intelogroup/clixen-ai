# N8N Node Research for Competitor Monitor Workflow

## Phase 1: Multi-Layer Research - Node Analysis

### Required Nodes Identified:

#### 1. **Webhook Node** (`n8n-nodes-base.webhook`)
**Purpose**: Trigger workflow via HTTP requests

**Key Parameters**:
- `httpMethod`: POST (for receiving data)
- `path`: "/competitor-monitor" (custom endpoint)
- `responseMode`: "onReceived" (immediate response)
- `responseData`: "allEntries" (return processed data)
- `options.rawBody`: true (for JSON payload)
- `options.allowedOrigins`: "*" (CORS support)

**Authentication**: Handled via custom validation node
**Error Handling**: Built-in HTTP status codes

#### 2. **Code Node** (`n8n-nodes-base.code`)
**Purpose**: Custom JavaScript logic for auth, data processing, and formatting

**Key Features**:
- `mode`: "runOnceForEachItem" 
- `jsCode`: Custom JavaScript execution
- Access to `$input`, `$json`, `$node()` functions
- Error handling with try/catch
- Data transformation capabilities

**Use Cases in Workflow**:
- Authentication validation
- URL sanitization
- Price comparison logic
- Response formatting
- Error handling

#### 3. **HTTP Request Node** (`n8n-nodes-base.httpRequest`)
**Purpose**: Web scraping and external API calls

**Key Parameters**:
- `method`: "GET" (for scraping)
- `url`: Dynamic URL from input
- `sendHeaders`: true
- `headerParameters`: User-Agent, Accept headers
- `timeout`: 30000ms (30 seconds)
- `ignoreHttpStatusErrors`: true (handle errors manually)

**Advanced Options**:
- `responseFormat`: "json" or "string"
- `fullResponse`: false (just body)
- `followRedirect`: true
- `maxRedirects`: 3

#### 4. **Supabase Node** (`n8n-nodes-base.supabase`)
**Purpose**: Database operations for usage logging

**Operations Available**:
- `select`: Query data
- `insert`: Create records
- `update`: Modify records
- `delete`: Remove records

**Key Parameters**:
- `operation`: "insert" (for logging)
- `schema`: "public"
- `table`: "workflow_executions" or "usage_metrics"
- `columns`: Specify fields to insert
- `credentials`: Supabase API credentials

#### 5. **IF Node** (`n8n-nodes-base.if`)
**Purpose**: Conditional logic and error routing

**Parameters**:
- `conditions`: Array of condition objects
- `combinator`: "and" or "or"
- `leftValue`: Input value
- `rightValue`: Comparison value
- `operator`: Comparison type

**Use Cases**:
- Authentication validation
- Price change detection
- Error condition checking

#### 6. **Respond to Webhook Node** (`n8n-nodes-base.respondToWebhook`)
**Purpose**: Return formatted response to webhook caller

**Parameters**:
- `respondWith`: "json"
- `responseBody`: Dynamic JSON response
- `responseCode`: HTTP status (200, 400, 401, etc.)
- `options.responseHeaders`: Custom headers

### Node Connection Patterns:

#### Success Flow:
```
Webhook → Auth Validation → URL Sanitization → Web Scraping → Data Comparison → Usage Logging → Response Formatting → Webhook Response
```

#### Error Flows:
```
Auth Validation [FAIL] → Error Response → Webhook Response
Web Scraping [FAIL] → Retry Logic → Fallback Response → Webhook Response
Usage Logging [FAIL] → Continue → Response (with warning)
```

### Authentication Strategy:
1. **API Key Validation**: Check `Authorization` header
2. **User Lookup**: Verify user exists in Supabase
3. **Credit Check**: Ensure sufficient credits
4. **Rate Limiting**: Check request frequency

### Error Handling Patterns:
- **401 Unauthorized**: Invalid or missing API key
- **402 Payment Required**: Insufficient credits
- **429 Too Many Requests**: Rate limit exceeded
- **400 Bad Request**: Invalid URL or parameters
- **500 Internal Server Error**: Scraping or processing failure

### Data Models:

#### Input Schema:
```json
{
  "target_url": "https://competitor.com/product",
  "selector": ".price",
  "comparison_value": 99.99,
  "user_id": "uuid",
  "api_key": "string"
}
```

#### Output Schema:
```json
{
  "success": true,
  "current_price": 89.99,
  "previous_price": 99.99,
  "price_change": -10.00,
  "percentage_change": -10.01,
  "scraped_at": "2025-08-23T10:00:00Z",
  "credits_consumed": 2,
  "credits_remaining": 98
}
```

### Retry and Reliability:
- **Retry Logic**: 3 attempts for web scraping with exponential backoff
- **Timeout Handling**: 30-second timeout per HTTP request
- **Fallback Strategy**: Return cached data if scraping fails
- **Circuit Breaker**: Disable scraping for consistently failing URLs