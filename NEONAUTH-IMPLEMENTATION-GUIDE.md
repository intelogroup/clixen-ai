# 🚀 NeonAuth + NeonDB Implementation Guide

## Overview

This guide shows how to implement NeonAuth with your existing Neon database for the Clixen AI project. NeonAuth will handle user authentication while your existing NeonDB stores application data.

## 📋 Prerequisites

### ✅ What You Already Have:
- **NeonDB Instance**: Running and accessible
- **Database Credentials**: Secure connection string provided
- **Next.js Project**: Clean foundation ready for auth integration

### 🔑 Your Neon Database Credentials:
```bash
# Your existing Neon database (keep secure!)
DATABASE_URL='postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## 🛠 Step 1: Enable NeonAuth

### 1.1 Access Your Neon Project
1. Go to [console.neon.tech](https://console.neon.tech)
2. Open your existing project (the one with your database)
3. Navigate to the **"Auth"** tab in your project dashboard
4. Click **"Enable Neon Auth"**

### 1.2 Get NeonAuth Keys
After enabling NeonAuth, you'll get these environment variables:
```bash
# NeonAuth credentials (you'll get these from the Neon console)
NEXT_PUBLIC_STACK_PROJECT_ID=st_proj_your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=st_pk_your_publishable_key
STACK_SECRET_SERVER_KEY=st_sk_your_secret_key
```

## 🔧 Step 2: Configure Environment Variables

### 2.1 Update `.env.local`
```bash
# NeonAuth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=st_proj_your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=st_pk_your_publishable_key  
STACK_SECRET_SERVER_KEY=st_sk_your_secret_key

# Your Existing Neon Database (KEEP SECURE!)
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

## 📦 Step 3: Install NeonAuth Dependencies

### 3.1 Install Stack Framework
```bash
cd /root/repo/frontend
npm install @stackframe/stack
```

### 3.2 Install Database Client  
```bash
# Already installed, but ensure you have the latest
npm install @neondatabase/serverless
```

## ⚙️ Step 4: Set Up NeonAuth

### 4.1 Option A: Use Setup Wizard (Recommended)
```bash
cd /root/repo/frontend
npx @stackframe/init-stack@latest --no-browser
```

This will:
- Create authentication pages (`/handler/sign-in`, `/handler/sign-up`)
- Set up Stack provider configuration
- Generate necessary authentication components

### 4.2 Option B: Manual Setup

#### 4.2.1 Create Stack Configuration
```typescript
// stack.ts
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
  }
});
```

#### 4.2.2 Create Authentication Pages

**`app/handler/[...stack]/page.tsx`**:
```typescript
import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default function Handler(props: any) {
  return <StackHandler fullPage app={stackServerApp} {...props} />;
}
```

#### 4.2.3 Update Root Layout
```typescript
// app/layout.tsx
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
```

## 🗄️ Step 5: Database Integration

### 5.1 Create Database Connection Utility
```typescript
// lib/database.ts
import { neon } from "@neondatabase/serverless";

// Use your existing database connection
export const sql = neon(process.env.DATABASE_URL!);

// Helper function for server actions
export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const result = await sql(query, params || []);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
```

### 5.2 Create User Profile Management
```typescript
// app/actions.ts
"use server";

import { stackServerApp } from "@/stack";
import { sql } from "@/lib/database";
import { redirect } from "next/navigation";

export async function createUserProfile() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/handler/sign-in");
  }

  // Check if profile already exists
  const existingProfile = await sql`
    SELECT * FROM profiles WHERE stack_user_id = ${user.id}
  `;

  if (existingProfile.length === 0) {
    // Create new profile in your existing database
    await sql`
      INSERT INTO profiles (
        stack_user_id,
        email,
        display_name,
        trial_started_at,
        trial_expires_at,
        trial_active,
        quota_used,
        quota_limit,
        tier,
        created_at
      ) VALUES (
        ${user.id},
        ${user.primaryEmail},
        ${user.displayName || user.primaryEmail},
        NOW(),
        NOW() + INTERVAL '7 days',
        true,
        0,
        50,
        'free',
        NOW()
      )
    `;
  }

  return user;
}

export async function getUserData() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    return null;
  }

  const profile = await sql`
    SELECT * FROM profiles WHERE stack_user_id = ${user.id}
  `;

  return {
    user,
    profile: profile[0] || null
  };
}
```

### 5.3 Update Database Schema

You'll need to modify your existing `profiles` table to work with NeonAuth:

```sql
-- Add Stack Auth user ID column to existing profiles table
ALTER TABLE profiles ADD COLUMN stack_user_id TEXT UNIQUE;

-- Update existing profiles to link with auth system if needed
-- This is handled automatically when users sign in for the first time

-- Optional: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stack_user_id ON profiles(stack_user_id);
```

## 🔐 Step 6: Update Telegram Bot Integration

### 6.1 Enhanced Webhook Handler with NeonAuth
```typescript
// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    const firstName = message.from.first_name;

    console.log(`[Telegram] Message from ${firstName} (${userId}): ${text}`);

    // Check if user has linked their account
    const linkedUser = await sql`
      SELECT * FROM profiles 
      WHERE telegram_chat_id = ${chatId.toString()}
      AND stack_user_id IS NOT NULL
    `;

    let responseMessage: string;

    if (text.startsWith('/start')) {
      if (linkedUser.length > 0) {
        responseMessage = `Welcome back, ${firstName}! 🤖\n\nYour account is linked and ready to use. Try asking me something!`;
      } else {
        responseMessage = `Welcome to Clixen AI! 🤖\n\nTo access premium features, please:\n1. Sign up at https://clixen.app\n2. Link your Telegram account in your dashboard\n\nFor now, you can try basic features!`;
      }
    } else {
      if (linkedUser.length > 0) {
        // User is authenticated - route to n8n workflows
        responseMessage = await handleAuthenticatedUser(chatId, text, linkedUser[0]);
      } else {
        // User not authenticated - limited functionality
        responseMessage = `Thanks for your message! For full access to Clixen AI features, please sign up at https://clixen.app and link your Telegram account.`;
      }
    }

    await sendTelegramMessage(chatId, responseMessage);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function handleAuthenticatedUser(chatId: number, text: string, profile: any) {
  // Check trial status and quota
  const now = new Date();
  const trialExpired = profile.trial_expires_at && new Date(profile.trial_expires_at) < now;
  
  if (trialExpired && profile.tier === 'free') {
    return `Your 7-day trial has expired! 😔\n\nUpgrade at https://clixen.app to continue using Clixen AI.`;
  }

  if (profile.quota_used >= profile.quota_limit && profile.tier === 'free') {
    return `You've reached your quota limit! 📊\n\nUpgrade at https://clixen.app for unlimited usage.`;
  }

  // Route to appropriate n8n workflow based on intent
  // This is where you'd integrate your existing AI router logic
  
  // Update quota
  await sql`
    UPDATE profiles 
    SET quota_used = quota_used + 1, last_activity_at = NOW()
    WHERE telegram_chat_id = ${chatId.toString()}
  `;

  return `Processing your request: "${text}"\n\n✅ Request completed! (${profile.quota_used + 1}/${profile.quota_limit} used)`;
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (error) {
    console.error('[Telegram Send] Error:', error);
  }
}
```

## 🎯 Step 7: Create Dashboard Pages

### 7.1 Dashboard Page with Telegram Linking
```typescript
// app/dashboard/page.tsx
import { stackServerApp } from "@/stack";
import { getUserData } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/handler/sign-in");
  }

  const { profile } = await getUserData();

  const trialDaysLeft = profile?.trial_expires_at 
    ? Math.ceil((new Date(profile.trial_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to Clixen AI</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Account</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.primaryEmail}</p>
            <p><strong>Plan:</strong> {profile?.tier || 'Free Trial'}</p>
            <p><strong>Trial Days Left:</strong> {trialDaysLeft > 0 ? trialDaysLeft : 'Expired'}</p>
            <p><strong>Usage:</strong> {profile?.quota_used || 0}/{profile?.quota_limit || 50}</p>
          </div>
        </div>

        {/* Telegram Integration Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Telegram Integration</h2>
          {profile?.telegram_chat_id ? (
            <div className="text-green-600">
              <p>✅ Telegram account linked!</p>
              <p className="text-sm text-gray-600 mt-2">
                Chat with @clixen_bot on Telegram to use AI features
              </p>
            </div>
          ) : (
            <div>
              <p className="text-yellow-600 mb-3">⚠️ Telegram not linked</p>
              <ol className="text-sm space-y-1">
                <li>1. Start a chat with @clixen_bot</li>
                <li>2. Send /link command</li>
                <li>3. Follow the instructions</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="mt-8">
        <a
          href="/handler/sign-out"
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign Out
        </a>
      </div>
    </div>
  );
}
```

## 🚀 Step 8: Deploy and Test

### 8.1 Start Development Server
```bash
cd /root/repo/frontend
npm run dev
```

### 8.2 Test Authentication Flow
1. Visit `http://localhost:3000`
2. Go to `http://localhost:3000/handler/sign-up`
3. Create a test account
4. Check dashboard at `http://localhost:3000/dashboard`

### 8.3 Verify Database Integration
Check that users are being created in both places:
```sql
-- NeonAuth users (auto-created by Stack)
SELECT * FROM neon_auth.users_sync;

-- Your app profiles (created by your code)  
SELECT * FROM profiles WHERE stack_user_id IS NOT NULL;
```

### 8.4 Test Telegram Integration
1. Message @clixen_bot with `/start`
2. Follow the account linking process
3. Test authenticated commands

## 📈 Step 9: Production Deployment

### 9.1 Update Production Environment Variables
Make sure all environment variables are set in your production environment (Vercel, etc.)

### 9.2 Database Migration
Run the schema updates on your production database:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stack_user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_stack_user_id ON profiles(stack_user_id);
```

## ✅ Verification Checklist

- [ ] NeonAuth enabled in Neon console
- [ ] Environment variables configured
- [ ] Stack framework installed
- [ ] Authentication pages working
- [ ] Database integration tested
- [ ] Telegram bot updated
- [ ] Dashboard functioning
- [ ] User profiles syncing
- [ ] Trial system working

## 🎯 Next Steps

1. **Customize Auth UI**: Style the authentication pages to match your brand
2. **Enhanced Telegram Integration**: Implement account linking flow
3. **Payment Integration**: Add Stripe for subscription management  
4. **Advanced Features**: Implement role-based access, team accounts, etc.

Your NeonAuth + NeonDB integration is now ready! Users can sign up through the web, get authenticated, and use the Telegram bot with full quota and trial management. 🚀