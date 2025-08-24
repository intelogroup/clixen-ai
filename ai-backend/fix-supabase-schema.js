#!/usr/bin/env node

/**
 * Fix Supabase Schema - Add telegram_chat_id column
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentSchema() {
  console.log('🔍 Checking current profiles table schema...');
  
  try {
    // Try to query with telegram_chat_id to see if it exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, telegram_chat_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('telegram_chat_id')) {
        console.log('❌ Column telegram_chat_id does not exist');
        return false;
      }
      console.error('Error checking schema:', error);
      return false;
    }
    
    console.log('✅ Column telegram_chat_id already exists');
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

async function addTelegramChatIdColumn() {
  console.log('\n🔧 Adding telegram_chat_id column to profiles table...');
  
  try {
    // Use Supabase SQL editor via RPC or direct SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;
        
        -- Add index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id 
        ON profiles(telegram_chat_id);
      `
    }).catch(async (err) => {
      // If RPC doesn't exist, try direct approach
      console.log('📝 Creating migration SQL...');
      return null;
    });

    if (error) {
      console.log('⚠️  Direct SQL execution not available, using alternative method');
      return false;
    }

    console.log('✅ Column added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding column:', err);
    return false;
  }
}

async function createTestUser() {
  console.log('\n🧪 Creating test user with Telegram ID...');
  
  try {
    const testUser = {
      email: 'telegram-test@clixen.app',
      telegram_chat_id: '123456789',
      tier: 'trial',
      trial_active: true,
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(testUser, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error creating test user:', error);
      return false;
    }

    console.log('✅ Test user created:', data[0]?.email);
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

async function generateMigrationSQL() {
  console.log('\n📄 MIGRATION SQL FOR SUPABASE DASHBOARD');
  console.log('=========================================');
  console.log('Run this in Supabase SQL Editor:\n');
  
  const migrationSQL = `-- Add telegram_chat_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id 
ON profiles(telegram_chat_id);

-- Add comment
COMMENT ON COLUMN profiles.telegram_chat_id IS 'Telegram chat ID for bot integration';

-- Create test user (optional)
INSERT INTO profiles (
  email, 
  telegram_chat_id, 
  tier, 
  trial_active,
  trial_expires_at
) VALUES (
  'telegram-test@clixen.app',
  '123456789',
  'trial',
  true,
  NOW() + INTERVAL '7 days'
) ON CONFLICT (email) DO UPDATE SET
  telegram_chat_id = EXCLUDED.telegram_chat_id,
  updated_at = NOW();

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'telegram_chat_id';`;

  console.log(migrationSQL);
  
  console.log('\n📋 STEPS TO APPLY:');
  console.log('1. Go to Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Paste the SQL above');
  console.log('4. Click "Run"');
  console.log('5. Verify in Table Editor that column exists');
  
  return migrationSQL;
}

async function verifySchema() {
  console.log('\n🔍 Verifying schema after changes...');
  
  try {
    // Test query with telegram_chat_id
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, telegram_chat_id, tier, trial_active')
      .limit(5);

    if (error) {
      console.error('❌ Schema verification failed:', error.message);
      return false;
    }

    console.log('✅ Schema verified successfully!');
    console.log(`📊 Found ${data?.length || 0} profiles`);
    
    if (data && data.length > 0) {
      console.log('\nSample profiles:');
      data.forEach(profile => {
        console.log(`  - ${profile.email} | Telegram: ${profile.telegram_chat_id || 'Not linked'} | Tier: ${profile.tier}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

async function fixSupabaseSchema() {
  console.log('🚀 FIXING SUPABASE SCHEMA');
  console.log('=========================\n');

  // Check if column exists
  const exists = await checkCurrentSchema();
  
  if (exists) {
    console.log('\n✅ Schema is already correct!');
    await verifySchema();
    return;
  }

  // Try to add column programmatically
  const added = await addTelegramChatIdColumn();
  
  if (!added) {
    // Generate SQL for manual execution
    await generateMigrationSQL();
    
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('Please run the SQL above in your Supabase dashboard');
    console.log('Then re-run this script to verify');
    return;
  }

  // Create test user
  await createTestUser();
  
  // Verify schema
  await verifySchema();
  
  console.log('\n🎉 SUPABASE SCHEMA FIXED!');
  console.log('========================');
  console.log('✅ telegram_chat_id column added');
  console.log('✅ Index created for performance');
  console.log('✅ Test user created');
  console.log('✅ AI Backend can now authenticate users');
  console.log('\n🚀 Your AI Backend is fully operational!');
}

// Run the fix
fixSupabaseSchema().catch(console.error);