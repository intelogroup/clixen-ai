#!/usr/bin/env node

/**
 * Check actual Supabase schema and available columns
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 CHECKING SUPABASE PROFILES SCHEMA');
  console.log('====================================\n');
  
  try {
    // Try basic select to see what columns are available
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error querying profiles:', error.message);
      
      // Try minimal columns
      const { data: minData, error: minError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1);
      
      if (minError) {
        console.log('❌ Cannot query basic columns:', minError.message);
        return;
      }
      
      console.log('✅ Basic columns (id, email) exist');
      console.log('Sample data:', minData);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('\n📊 Available columns:');
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        columns.forEach(col => {
          const value = data[0][col];
          const type = value === null ? 'null' : typeof value;
          console.log(`   - ${col}: ${type}`);
        });
        
        console.log('\n📋 Sample record:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('   No records found in profiles table');
      }
    }
    
    // Check specific columns we need
    console.log('\n🔍 Checking required columns:');
    
    const columnsToCheck = [
      'telegram_chat_id',
      'tier',
      'trial_active',
      'trial_expires_at',
      'trial_started_at',
      'stripe_customer_id'
    ];
    
    for (const column of columnsToCheck) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${column}: NOT FOUND`);
        } else {
          console.log(`   ✅ ${column}: EXISTS`);
        }
      } catch (err) {
        console.log(`   ❌ ${column}: ERROR`);
      }
    }
    
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

async function generateCorrectMigration() {
  console.log('\n📄 CORRECT MIGRATION SQL');
  console.log('========================\n');
  
  const migrationSQL = `-- Complete Supabase Migration for Clixen AI
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/efashzkgbougijqcbead/sql)

-- 1. Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active ON profiles(trial_active);

-- 3. Add comments for documentation
COMMENT ON COLUMN profiles.telegram_chat_id IS 'Telegram chat ID for bot integration';
COMMENT ON COLUMN profiles.tier IS 'Subscription tier: free, trial, starter, pro';
COMMENT ON COLUMN profiles.trial_active IS 'Whether user is in trial period';
COMMENT ON COLUMN profiles.trial_expires_at IS 'When the trial period ends';

-- 4. Create test users
INSERT INTO profiles (
  id,
  email,
  telegram_chat_id,
  tier,
  trial_active,
  trial_started_at,
  trial_expires_at,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'telegram-test@clixen.app',
  '123456789',
  'trial',
  true,
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'demo@clixen.app',
  '987654321',
  'starter',
  false,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '10 days',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  telegram_chat_id = EXCLUDED.telegram_chat_id,
  tier = EXCLUDED.tier,
  trial_active = EXCLUDED.trial_active,
  updated_at = NOW();

-- 5. Verify the migration
SELECT 
  email,
  telegram_chat_id,
  tier,
  trial_active,
  trial_expires_at
FROM profiles
WHERE telegram_chat_id IS NOT NULL;`;

  console.log(migrationSQL);
  
  console.log('\n📋 STEPS TO APPLY:');
  console.log('1. Copy the SQL above');
  console.log('2. Go to: https://supabase.com/dashboard/project/efashzkgbougijqcbead/sql');
  console.log('3. Click "New Query"');
  console.log('4. Paste the SQL');
  console.log('5. Click "Run"');
  console.log('6. Verify in Table Editor');
}

async function main() {
  await checkSchema();
  await generateCorrectMigration();
  
  console.log('\n✅ After running the migration, your AI Backend will:');
  console.log('   - Authenticate users via Telegram ID');
  console.log('   - Check trial/subscription status');
  console.log('   - Route messages to appropriate n8n workflows');
  console.log('   - Provide real-time responses (2-3 seconds)');
}

main().catch(console.error);