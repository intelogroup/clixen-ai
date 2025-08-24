# Clixen AI - Telegram-First Automation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-blue)](https://stripe.com/)
[![n8n](https://img.shields.io/badge/n8n-Automation-orange)](https://n8n.io/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue)](https://telegram.org/)

> Transform natural language into automated workflows through Telegram - No web chat UI, pure Telegram experience

## 🚀 Overview

Clixen AI is a **Telegram-first** automation platform where users pay for access to a conversational AI bot that executes pre-built n8n workflows. The web dashboard is purely for payments and account management - all automation happens through Telegram.

### Architecture:
```
User → Telegram Bot (@clixen_bot) → AI Router (GPT) → n8n Workflows → Results
                                         ↓
                                    Supabase (Auth & State)
```

### Business Model:
1. **Sign up** on clixen.app → Auto-start 7-day trial
2. **Link Telegram** → Access @clixen_bot
3. **Send commands** → AI routes to n8n workflows
4. **Get results** → Directly in Telegram
5. **Subscribe** → $9 or $49/month for continued access

## 💬 Available Automations

### Core Workflows:
- **Weather Check**: Get current weather for any city
- **Email Scanner**: Scan inbox for invoices/payments and summarize spending
- **PDF Summarizer**: Upload and summarize PDF documents
- **Text Translator**: Translate text between languages
- **Daily Reminders**: Set up recurring reminders

### Bot Commands:
- `/start` - Link account and begin
- `/help` - Show available commands
- `/status` - Check subscription status
- `/feedback` - Send feedback

## 💰 Pricing

| Plan | Price | Tasks/Month | Features |
|------|-------|-------------|----------|
| **Free Trial** | $0 | 50 | 7 days, all features |
| **Starter** | $9/mo | 1,000 | All automations, email support |
| **Pro** | $49/mo | Unlimited | Priority queue, premium support |

## 🛠️ Tech Stack

### Core Components:
- **Frontend**: Next.js 14 (dashboard only - no chat UI)
- **Bot**: Telegram Bot API (@clixen_bot)
- **AI**: OpenAI GPT-3.5/4 for routing
- **Automation**: n8n on SlipLane
- **Database**: Supabase (auth only, no message storage)
- **Payments**: Stripe
- **Domain**: clixen.app

## 📦 Quick Start

### Prerequisites:
- Node.js 18+
- Telegram Bot Token (already created: @clixen_bot)
- Supabase Project
- OpenAI API Key
- n8n Instance (SlipLane)
- Stripe Account

### Installation:

1. **Clone and Install:**
```bash
git clone https://github.com/yourusername/clixen-ai.git
cd clixen-ai/frontend
npm install
```

2. **Configure Environment:**
```bash
cp env.example .env.local
# Edit .env.local with your credentials:

TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_BOT_USERNAME=clixen_bot
N8N_API_KEY=your_n8n_key
N8N_WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app
OPENAI_API_KEY=sk-...
# Plus existing Supabase and Stripe keys
```

3. **Set Up Database:**
```bash
npm run db:migrate
```

4. **Configure Telegram Webhook:**
```bash
node setup-telegram-bot.js
```

5. **Start Development:**
```bash
npm run dev
```

## 🏗️ System Design

### Data Flow:
1. User sends message to @clixen_bot
2. Webhook receives at `/api/telegram/webhook`
3. AI classifies intent (direct response vs automation)
4. If automation → forward to n8n workflow
5. n8n processes and returns result
6. Bot sends response to user

### Key Principles:
- **No message storage** - Privacy first
- **Pre-built workflows** - No custom generation
- **AI mediation** - Natural conversation layer
- **Telegram-only** - No web chat interface

## 📁 Project Structure

```
clixen-ai/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── telegram/webhook/   # Bot webhook handler
│   │   │   ├── stripe/webhook/     # Payment webhooks
│   │   │   └── user/               # User management
│   │   ├── dashboard/              # Account overview
│   │   ├── subscription/           # Pricing page
│   │   └── page.tsx               # Landing page
│   ├── lib/
│   │   ├── ai-router.ts          # Intent classification
│   │   └── supabase.ts           # Database client
│   └── setup-telegram-bot.js     # Bot configuration
└── n8n-workflows/                 # Workflow JSON templates
```

## 🔄 n8n Workflow Setup

### ✅ BREAKTHROUGH: All Webhooks Operational!

**Status**: All webhook endpoints are fully registered and responding on SlipLane n8n instance.

#### Core Automation Endpoints:
1. **Weather**: `/webhook/api/v1/weather`
2. **Email Scanner**: `/webhook/api/v1/email-scan` 
3. **PDF Summary**: `/webhook/api/v1/pdf-summary`
4. **Translator**: `/webhook/api/v1/translate`

#### Test Endpoints (Active):
- ✅ `/webhook/test-ai-processor` 
- ✅ `/webhook/clean-ai-pipeline`
- ✅ `/webhook/webhook-test`
- ✅ `/webhook/test`

**Server Status**: https://n8nio-n8n-7xzf6n.sliplane.app
- 10 active workflows running
- All webhooks registered and responding
- Zero registration errors
- Full automation pipeline operational

### Automated Setup Scripts:
```bash
# Create missing webhooks
node setup-missing-webhooks.cjs

# Activate all webhooks  
node activate-missing-webhooks.cjs
```

Each workflow:
- Accepts POST with JSON payload
- Processes the automation
- Returns `{ message: "result text" }` or `{ message: "Workflow was started" }`

## 🔐 User Isolation & Bidirectional Sync

### ✅ BREAKTHROUGH: Complete User Isolation Architecture Deployed!

**Problem Solved**: Implemented full end-to-end user isolation from frontend → Telegram → AI backend → n8n with complete bidirectional synchronization.

#### Architecture Overview:
```
Frontend (Supabase Auth) ↔ Telegram Bot ↔ PostgreSQL (Isolated Data)
         ↕                      ↕               ↕
    JWT Tokens          Message Handler    Row-Level Security
         ↕                      ↕               ↕
    User Sessions        Audit Logging      User Profiles
```

#### Key Features:
- **JWT-Based Authentication**: Every bot interaction validates user tokens
- **Bidirectional Sync**: All Telegram interactions populate back to Supabase
- **Temporary User Handling**: Unlinked bot users stored in `telegram_temp_users`
- **Account Claiming**: Web dashboard allows claiming of Telegram conversations
- **Complete Audit Trail**: Every user action logged with isolation
- **Row-Level Security**: Database-enforced user isolation

### Database Migration Journey:

After **multiple failed migration attempts**, we successfully deployed the user isolation architecture:

#### ❌ Failed Approaches:
1. **Supabase API Migration** (`run-isolation-migration.cjs`):
   - Failed with 404 errors on Supabase REST API endpoints
   - Complex schema changes not supported via API

2. **Complex Single Migration** (`execute-pg-migration.cjs`):
   - Failed on foreign key constraint conflicts
   - All-or-nothing approach too brittle

#### ✅ Successful Strategy - Step-by-Step Migration:

**Step 1**: Basic Schema Extension (`execute-minimal-migration.cjs`)
```bash
node execute-minimal-migration.cjs
```
- Added columns to existing `profiles` table one by one
- Created new tables: `telegram_linking_tokens`, `user_sessions`, `user_audit_log`
- Added indexes and foreign key constraints safely

**Step 2**: Helper Functions & Security (`create-functions.cjs`)
```bash
node create-functions.cjs
```
- Created 5 essential PostgreSQL functions for user operations
- Enabled Row-Level Security (RLS) on all tables
- Granted proper permissions to authenticated/anonymous roles
- Linked existing profiles to `auth.users` by email matching

**Step 3**: Bidirectional Sync System (`create-bidirectional-sync.cjs`)
```bash
node create-bidirectional-sync.cjs
```
- Created `telegram_temp_users` table for unlinked bot interactions
- Implemented `handle_telegram_interaction()` function for real-time sync
- Added smart user matching and auto-linking algorithms

#### Enhanced Database Schema:

```sql
-- Enhanced profiles table with isolation
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id), -- Link to Supabase Auth
  email TEXT UNIQUE,
  telegram_chat_id TEXT UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  telegram_linked_at TIMESTAMPTZ,
  quota_used INTEGER DEFAULT 0,
  quota_limit INTEGER DEFAULT 50,
  user_metadata JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporary users for unlinked bot interactions
CREATE TABLE telegram_temp_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_chat_id TEXT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  interaction_count INTEGER DEFAULT 1,
  first_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB DEFAULT '{}'
);

-- Secure token-based Telegram linking
CREATE TABLE telegram_linking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  linking_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Complete audit trail
CREATE TABLE user_audit_log (
  id BIGSERIAL PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  telegram_chat_id BIGINT,
  action_type TEXT NOT NULL,
  action_detail TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Essential Helper Functions:

1. **`get_user_by_telegram_chat_id(BIGINT)`**: Retrieves complete user profile
2. **`create_telegram_linking_token(UUID)`**: Generates secure linking tokens
3. **`link_telegram_account(...)`**: Links Telegram to authenticated users
4. **`increment_user_quota(UUID, INTEGER)`**: Manages user quotas safely
5. **`handle_telegram_interaction(...)`**: Bidirectional sync for all bot interactions

### Enhanced Telegram Webhook Handler:

New webhook handler (`app/api/telegram/webhook/route-bidirectional.ts`) ensures:
- Every message populates back to Supabase
- Linked users get full audit logging
- Unlinked users stored in `telegram_temp_users` for claiming
- JWT token validation for all operations
- Comprehensive error handling and logging

### Why This Architecture Matters:

1. **Complete User Isolation**: Every user sees only their own data
2. **Audit Compliance**: Full trail of all user interactions
3. **Account Claiming**: Users can claim their Telegram conversations
4. **Scalable Security**: Row-Level Security enforced at database level
5. **Privacy Focused**: Temporary users can be claimed or automatically purged

### Migration Lessons Learned:

- **Break complex migrations into smaller steps**
- **Test each step independently before proceeding**
- **Use direct PostgreSQL connections over API for schema changes**
- **Handle foreign key constraints carefully**
- **Create indexes after tables are populated**
- **Enable RLS after all tables and functions are created**

## 🧪 Testing

```bash
# Test locally with ngrok
ngrok http 3000
# Update bot webhook to ngrok URL

# Run with beta users
npm run beta
```

### Test Flow:
1. Sign up on clixen.app
2. Message @clixen_bot
3. Try: "What's the weather in London?"
4. Try: "Scan my emails for invoices"

## 🚀 Deployment

### Option 1: Vercel (Recommended)
```bash
vercel --prod
# Update DNS at Hostinger to point to Vercel
```

### Option 2: Hostinger Node.js
```bash
npm run build
# Upload via FTP/Git to Hostinger
```

### Domain Configuration:
- Domain: clixen.app (Hostinger)
- Point to your deployment
- Configure SSL

## 📊 Key Metrics

Track these for success:
- Trial → Paid conversion rate
- Daily active users in Telegram
- Average tasks per user
- Churn rate
- Response time per automation

## 🔒 Security & Privacy

- **No message storage** in database
- **Minimal state** tracking only
- **Secure webhooks** with verification
- **Environment variables** for secrets
- **Rate limiting** per user tier

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Test with Telegram bot
4. Submit pull request

## 📄 License

MIT License - see LICENSE file

## 🆘 Support

- Email: support@clixen.app
- Telegram: @clixen_support
- Documentation: docs.clixen.app

## 🎯 Roadmap

### Phase 1 (Current):
- [x] Telegram bot integration
- [x] 5 core automations
- [x] Subscription system
- [x] 7-day free trial
- [x] **BREAKTHROUGH**: Full n8n webhook system operational
- [x] All webhook endpoints registered and responding
- [x] Automated webhook setup and activation scripts
- [x] **BREAKTHROUGH**: Complete user isolation architecture
- [x] Bidirectional sync between Telegram and Supabase
- [x] JWT-based authentication for all bot interactions
- [x] Temporary user system for account claiming
- [x] Row-Level Security with complete audit trails

### Phase 2:
- [ ] 10 more workflow templates
- [ ] WhatsApp integration
- [ ] Team subscriptions

### Phase 3:
- [ ] Slack integration
- [ ] Custom workflow builder
- [ ] API access

---

**Status**: Ready for beta testing with 50 users

Built with ❤️ by the Clixen AI Team