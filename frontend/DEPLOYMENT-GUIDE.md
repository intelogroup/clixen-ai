# 🚀 Clixen AI Deployment Guide

## Overview
This guide covers deploying the complete Clixen AI application with NeonAuth + NeonDB integration.

## Prerequisites Completed ✅
- [x] Landing page created
- [x] Stack authentication configured  
- [x] Sign-in/Sign-up pages ready
- [x] User dashboard built
- [x] Database schema prepared

## 🗄️ Step 1: Database Setup

### 1.1 Run Database Migration
Execute the following SQL against your Neon database:

```bash
# Connect to your Neon database
psql 'postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Then run:
\i setup-profiles-table.sql
```

Or copy and execute the contents of `setup-profiles-table.sql` in your Neon SQL editor.

## 🔑 Step 2: Environment Variables

### 2.1 Required Environment Variables
Update your `.env.local` file:

```bash
# NeonAuth Configuration (Get these from Neon Console > Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=st_proj_your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=st_pk_your_publishable_key
STACK_SECRET_SERVER_KEY=st_sk_your_secret_key

# Your Neon Database (KEEP SECURE!)
DATABASE_URL='postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Telegram Bot (existing)
TELEGRAM_BOT_TOKEN=8473221915:AAGWGBWO-qDVysnEN6uvESq-l7WGXBP214I
TELEGRAM_BOT_USERNAME=clixen_bot

# n8n Configuration (existing)
N8N_API_KEY=your_secure_api_key
N8N_WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app

# OpenAI (existing)
OPENAI_API_KEY=sk-...

# App Configuration
NEXT_PUBLIC_APP_URL=https://clixen.app
```

### 2.2 Get NeonAuth Keys
1. Go to [console.neon.tech](https://console.neon.tech)
2. Open your existing project
3. Navigate to **"Auth"** tab
4. Click **"Enable Neon Auth"** if not already enabled
5. Copy the environment variables provided

## 📦 Step 3: Install Dependencies

```bash
cd /root/repo/frontend
npm install @stackframe/stack @neondatabase/serverless
npm install
```

## 🧪 Step 4: Test Locally

### 4.1 Start Development Server
```bash
npm run dev
```

### 4.2 Test Authentication Flow
1. Visit `http://localhost:3000`
2. Click "Get Started" or "Sign In"
3. Create a test account
4. Verify you can access the dashboard
5. Check that user profile is created in database

### 4.3 Verify Database Integration
```sql
-- Check that users are being created
SELECT * FROM profiles WHERE stack_user_id IS NOT NULL;

-- Check NeonAuth users table
SELECT * FROM neon_auth.users_sync;
```

## 🚀 Step 5: Production Deployment

### 5.1 Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 5.2 Set Production Environment Variables
In Vercel dashboard or CLI, set all environment variables from Step 2.1

### 5.3 Update Telegram Webhook
Update your Telegram bot webhook to point to production URL:
```bash
curl -X POST "https://api.telegram.org/bot8473221915:AAGWGBWO-qDVysnEN6uvESq-l7WGXBP214I/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.vercel.app/api/telegram/webhook"}'
```

## ✅ Step 6: Verification Checklist

### Authentication
- [ ] Landing page loads correctly
- [ ] Sign-up flow works
- [ ] Sign-in flow works  
- [ ] Dashboard loads after authentication
- [ ] Sign-out works

### Database Integration
- [ ] User profiles created on signup
- [ ] Trial status shows correctly
- [ ] Usage quota tracking works
- [ ] Database queries execute without errors

### Telegram Integration
- [ ] Bot responds to messages
- [ ] Webhook receives updates
- [ ] User authentication status checked
- [ ] Quota limits enforced

## 🎯 Step 7: Next Steps

### 7.1 Enhanced Features
- [ ] Implement Stripe payment integration
- [ ] Add Telegram account linking flow
- [ ] Enhance dashboard with analytics
- [ ] Add admin panel for user management

### 7.2 Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor database performance
- [ ] Track user sign-up conversion
- [ ] Monitor Telegram bot usage

## 📱 User Flow

1. **Landing Page** → User sees features and pricing
2. **Sign Up** → User creates account (7-day trial starts)
3. **Dashboard** → User sees account status and usage
4. **Telegram** → User messages @clixen_bot to use features
5. **Automation** → Bot checks auth status and quota, then executes workflows

## 🔧 Troubleshooting

### Common Issues

**Build Errors:**
- Ensure all environment variables are set
- Check that `@stackframe/stack` is properly installed

**Database Connection Issues:**
- Verify DATABASE_URL is correct
- Ensure Neon database is accessible

**Authentication Issues:**
- Verify NeonAuth is enabled in console
- Check that Stack environment variables are correct

**Telegram Bot Issues:**
- Verify webhook URL is accessible
- Check that bot token is valid

## 🎉 Success!

Your Clixen AI application is now deployed with:
- ✅ Beautiful landing page
- ✅ Complete authentication system
- ✅ User dashboard with trial tracking  
- ✅ Telegram bot integration
- ✅ Database with user profiles
- ✅ Quota management system

Users can now sign up, get a 7-day free trial, and use your Telegram bot for AI-powered automation! 🚀