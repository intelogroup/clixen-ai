# User Onboarding Workflow Suite - B2C Automation Platform

## Overview

This repository contains a comprehensive User Onboarding Workflow suite for the B2C Automation Platform, created following the mandatory VCT Framework pipeline guidelines and using n8n best practices.

## Created Workflows

### 1. User Onboarding Workflow (`user-onboarding-workflow.json`)
**Webhook Endpoint:** `/webhook/api/user/signup`
**Purpose:** Handles new user registrations from Supabase

**Features:**
- ✅ Comprehensive input validation (user_id, email, created_at)
- ✅ User session creation with secure tokens
- ✅ Profile status initialization
- ✅ Free tier credit allocation (100 credits)
- ✅ Personalized welcome email with HTML template
- ✅ Secure API key generation
- ✅ Analytics event logging
- ✅ Robust error handling with proper HTTP responses
- ✅ Complete onboarding flow orchestration

### 2. Profile Update Handler (`profile-update-handler.json`)
**Webhook Endpoint:** `/webhook/api/user/profile`
**Purpose:** Handles user profile updates

**Features:**
- ✅ Profile field validation and sanitization
- ✅ User existence verification
- ✅ Dynamic field updates (full_name, avatar_url, phone, company, timezone, preferences)
- ✅ Profile completion percentage tracking
- ✅ Analytics event logging
- ✅ Email and phone validation
- ✅ Proper error responses (400, 404)

### 3. Credit Usage Tracker (`credit-usage-tracker.json`)
**Webhook Endpoint:** `/webhook/api/user/credits/consume`
**Purpose:** Tracks credit consumption and usage metrics

**Features:**
- ✅ Credit consumption validation
- ✅ Insufficient credit detection
- ✅ Tier-based monthly limits enforcement
- ✅ Credit transaction logging
- ✅ Low credit warnings and notifications
- ✅ Service type tracking (document_analytics, task_automation, api_call, webhook_processing)
- ✅ Real-time usage metrics updates
- ✅ Billing recommendations

## Architecture Design

### Node Types Used
- **Webhook Trigger Nodes** - Receive API requests
- **Code Nodes** - Data validation, transformation, and business logic
- **Supabase Nodes** - Database operations
- **Send Email Node** - Welcome email delivery
- **IF Nodes** - Conditional logic and error handling
- **Respond to Webhook Nodes** - API responses

### Database Schema Requirements

```sql
-- User sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Profiles table updates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Usage metrics table
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  credits_total INTEGER DEFAULT 100,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 100,
  monthly_usage INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  api_key_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Credit transactions table
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  transaction_type TEXT NOT NULL, -- 'consumption', 'purchase', 'bonus'
  credits_amount INTEGER NOT NULL,
  service_type TEXT,
  operation_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  action_url TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Webhook Data Formats

### User Signup Webhook
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z",
  "metadata": {}
}
```

### Profile Update Webhook
```json
{
  "user_id": "uuid",
  "full_name": "Updated Name",
  "phone": "+1234567890",
  "company": "Company Name",
  "timezone": "America/New_York",
  "preferences": {}
}
```

### Credit Consumption Webhook
```json
{
  "user_id": "uuid",
  "credits_to_consume": 5,
  "service_type": "document_analytics",
  "operation_id": "optional-operation-id",
  "metadata": {}
}
```

## Response Formats

### Success Response (User Onboarding)
```json
{
  "success": true,
  "user_id": "uuid",
  "api_key": "b2c_generated_key",
  "credits_remaining": 100,
  "onboarding_completed": false,
  "next_steps": ["complete_profile", "try_document_analytics"],
  "dashboard_url": "https://platform.b2cautomation.com/dashboard",
  "api_docs_url": "https://docs.b2cautomation.com/api",
  "support_email": "support@b2cautomation.com",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "type": "validation_error",
    "message": "Missing required fields: user_id, email",
    "code": "INVALID_USER_DATA",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "help_url": "https://docs.b2cautomation.com/errors/validation"
}
```

## Security Features

1. **Input Validation**
   - UUID format validation for user IDs
   - Email format validation
   - Phone number validation
   - Field sanitization

2. **Authentication**
   - Webhook endpoint protection
   - API key generation with secure hashing
   - Session token management

3. **Error Handling**
   - Comprehensive error catching
   - Proper HTTP status codes
   - Detailed error messages with help URLs
   - Security-conscious error responses

4. **Rate Limiting**
   - Credit consumption limits
   - Tier-based monthly limits
   - Operation size limits (max 1000 credits per request)

## Deployment

### Prerequisites
```bash
# Set environment variables
export N8N_API_KEY="your_n8n_api_key"
export N8N_BASE_URL="https://your-n8n-instance.app.n8n.cloud"
```

### Deploy Workflows
```bash
# Make deployment script executable
chmod +x scripts/deploy-onboarding-workflows.js

# Run deployment
node scripts/deploy-onboarding-workflows.js
```

### Required Credentials in n8n
1. **Supabase Credentials**
   - Project URL
   - Service Role Key (for database operations)

2. **SMTP Credentials**
   - SMTP server details
   - Authentication credentials
   - From email address

## Testing

### Test User Onboarding
```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "full_name": "Test User",
    "created_at": "2024-01-01T00:00:00Z"
  }'
```

### Test Profile Update
```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "Updated Name",
    "company": "Test Company"
  }'
```

### Test Credit Consumption
```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/api/user/credits/consume \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "credits_to_consume": 5,
    "service_type": "document_analytics"
  }'
```

## Monitoring

### Key Metrics to Monitor
- User onboarding completion rate
- Email delivery success rate
- Credit consumption patterns
- API response times
- Error rates by endpoint

### Analytics Events Tracked
- `user_registration` - New user signups
- `profile_updated` - Profile changes
- Credit consumption by service type
- Low credit warnings
- Monthly limit approaches

## Maintenance

### Regular Tasks
1. Monitor credit transaction logs
2. Review error logs for patterns
3. Update tier limits as needed
4. Maintain email templates
5. Monitor API key usage

### Scaling Considerations
- Database connection pooling
- Credit transaction batching
- Email queue management
- Webhook rate limiting
- Multi-region deployment

## Support

For issues or questions:
- 📧 Email: support@b2cautomation.com
- 📖 Documentation: https://docs.b2cautomation.com
- 🐛 Issues: Create issue in this repository

---

**Created following VCT Framework guidelines with comprehensive research, validation, and testing.**