# N8N Connection Patterns Analysis

## Phase 2: Connection Pattern Study

### Analyzed Patterns from Existing Workflows:

#### 1. **Webhook → Validation → Processing → Database → Response**
**Source**: `credit-usage-tracker.json`

**Pattern Flow**:
```
Webhook Trigger → Validate Data → Get Database Record → IF Check → Calculate Logic → Update Database → Log Transaction → Response
```

**Connection Structure**:
- Linear flow with conditional branching
- Error handling routes to specific error responses
- Multiple parallel operations after validation
- All paths eventually lead to webhook response

#### 2. **Webhook → Download → Switch → Process → AI → Save → Response**
**Source**: `document-analytics.json`

**Pattern Flow**:
```
Webhook → Validate Input → HTTP Download → File Type Switch → Extract Content → AI Analysis → Generate Visualizations → Save to DB → Response
```

**Key Features**:
- HTTP Request node for file downloads with timeout
- Switch node for file type routing
- Complex data transformation in Code nodes
- Supabase integration for persistence

#### 3. **Research Agent HTTP Pattern**
**Source**: `research-analyst-agent.json`

**HTTP Request Configuration**:
```json
{
  "method": "POST",
  "url": "https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items",
  "sendBody": true,
  "specifyBodyType": "json",
  "jsonBody": "={\n  \"queries\": \"{{ $json.search_terms.join(' OR ') }}\",\n  \"resultsPerPage\": 15\n}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "Bearer {{ $env.APIFY_API_TOKEN }}"
      }
    ]
  }
}
```

### Connection Best Practices Identified:

#### 1. **Error Handling Patterns**:
- Always include error branches from critical nodes
- Use specific error response nodes for different failure types
- Include error logging before response
- Provide helpful error messages with action URLs

#### 2. **Validation Patterns**:
- Input validation at the start of workflow
- User authentication/authorization checks
- Data sanitization and format validation
- Credit/quota checking before expensive operations

#### 3. **Response Patterns**:
- Consistent JSON response format
- Include success/error status
- Provide actionable feedback
- Include processing metadata (timestamps, credits used)

#### 4. **Database Integration Patterns**:
- Use batch operations where possible
- Separate read and write operations
- Include transaction logging
- Handle connection failures gracefully

### Competitor Monitor Workflow Architecture:

#### **Node Layout Design**:
```
Position Grid (x, y):
- Webhook Trigger: (250, 400)
- Auth Validation: (450, 400)
- URL Sanitization: (650, 400)
- Credit Check: (850, 400)
- Web Scraping: (1050, 400)
- Data Parsing: (1250, 400)
- Price Comparison: (1450, 400)
- Usage Logging: (1650, 300)
- Response Format: (1850, 400)
- Webhook Response: (2050, 400)

Error Branches:
- Auth Error: (450, 600) → (650, 600) [Response]
- Credit Error: (850, 600) → (1050, 600) [Response] 
- Scraping Error: (1050, 600) → (1250, 600) [Retry] → (1450, 600) [Fallback Response]
```

#### **Connection Map**:
```
Main Flow:
Webhook → Auth → URL → Credit → Scrape → Parse → Compare → [Log, Format] → Response

Error Flows:
Auth [FAIL] → Auth Error Handler → Error Response
Credit [FAIL] → Credit Error Handler → Error Response  
Scrape [FAIL] → Retry Logic → [Success: Continue] OR [Fail: Fallback Response]
Log [FAIL] → Continue to Response (non-blocking)
```

### Data Flow Requirements:

#### **Input Processing**:
1. Extract `Authorization` header for API key
2. Validate required fields: `target_url`, `selector` (optional)
3. Sanitize URL to prevent SSRF attacks
4. Check user credits and rate limits

#### **Web Scraping Flow**:
1. Configure HTTP headers (User-Agent, Accept)
2. Set reasonable timeout (30 seconds)
3. Handle redirects (max 3)
4. Parse response based on content-type
5. Apply CSS selector or regex for price extraction

#### **Data Processing**:
1. Parse price from scraped content
2. Compare with previous values (from database)
3. Calculate change percentage
4. Generate insights/alerts if significant change

#### **Response & Logging**:
1. Log workflow execution to database
2. Update user usage metrics
3. Format response with all relevant data
4. Return JSON response to caller

### Security Considerations:

#### **Input Sanitization**:
- Validate URL format and protocol (https only)
- Prevent SSRF by blocking private IP ranges
- Limit URL length and query parameters
- Sanitize CSS selectors to prevent XSS

#### **Rate Limiting**:
- Per-user rate limiting (configurable by tier)
- Per-target URL rate limiting (prevent abuse)
- Global rate limiting for service protection

#### **Authentication Security**:
- API key validation against database
- User session verification
- Credit verification before processing
- Audit logging for security events

### Performance Optimizations:

#### **Caching Strategy**:
- Cache scraped results for 5-15 minutes
- Cache user authentication for session duration
- Cache rate limit counters in Redis/memory

#### **Timeout Management**:
- 5 seconds for database operations
- 30 seconds for web scraping
- 60 seconds total workflow timeout
- Graceful degradation on timeouts

#### **Resource Limits**:
- Max response size: 10MB
- Max processing time: 60 seconds
- Max concurrent executions per user: 3
- Memory limit per execution: 256MB