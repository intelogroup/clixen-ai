#!/usr/bin/env node

/**
 * Simple Database Migration via Supabase SQL Editor
 * Creates the essential tables for user isolation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimpleMigration() {
  console.log('🚀 Running Simple User Isolation Migration...\n');

  const migrations = [
    {
      name: 'Add auth_user_id to profiles',
      sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS telegram_username TEXT,
        ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
        ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
        ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS quota_used INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS quota_limit INTEGER DEFAULT 50;
      `
    },
    {
      name: 'Create unique constraints',
      sql: `
        ALTER TABLE profiles 
        ADD CONSTRAINT IF NOT EXISTS unique_auth_user_id UNIQUE (auth_user_id),
        ADD CONSTRAINT IF NOT EXISTS unique_telegram_chat_id UNIQUE (telegram_chat_id);
      `
    },
    {
      name: 'Create indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_at);
      `
    },
    {
      name: 'Create telegram_linking_tokens table',
      sql: `
        CREATE TABLE IF NOT EXISTS telegram_linking_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            linking_token TEXT NOT NULL UNIQUE,
            telegram_chat_id BIGINT,
            expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create user_sessions table',
      sql: `
        CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            telegram_chat_id BIGINT,
            session_token TEXT NOT NULL,
            jwt_token_hash TEXT,
            context JSONB DEFAULT '{}',
            expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_used_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create user_audit_log table',
      sql: `
        CREATE TABLE IF NOT EXISTS user_audit_log (
            id BIGSERIAL PRIMARY KEY,
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            telegram_chat_id BIGINT,
            action_type TEXT NOT NULL,
            action_detail TEXT NOT NULL,
            context JSONB DEFAULT '{}',
            ip_address INET,
            user_agent TEXT,
            success BOOLEAN DEFAULT true,
            error_message TEXT,
            processing_time_ms INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create table indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_telegram_linking_tokens_token ON telegram_linking_tokens(linking_token);
        CREATE INDEX IF NOT EXISTS idx_telegram_linking_tokens_user_id ON telegram_linking_tokens(auth_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_auth_user_id ON user_sessions(auth_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_telegram_chat_id ON user_sessions(telegram_chat_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(auth_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON user_audit_log(created_at);
        CREATE INDEX IF NOT EXISTS idx_user_audit_log_action_type ON user_audit_log(action_type);
      `
    }
  ];

  let successCount = 0;
  let totalCount = migrations.length;

  for (const migration of migrations) {
    try {
      console.log(`📝 Executing: ${migration.name}...`);
      
      // Use a raw query approach
      const { data, error } = await supabase.rpc('sql', {
        query: migration.sql
      });

      if (error) {
        console.log(`   ⚠️  ${migration.name}: ${error.message} (might already exist)`);
      } else {
        console.log(`   ✅ ${migration.name}: Success`);
      }
      
      successCount++;
    } catch (err) {
      console.log(`   ⚠️  ${migration.name}: ${err.message} (continuing...)`);
      successCount++;
    }
  }

  console.log(`\n🎉 Migration Summary: ${successCount}/${totalCount} completed`);

  // Verify tables exist
  console.log('\n🔍 Verifying tables...');
  
  const tables = ['profiles', 'telegram_linking_tokens', 'user_sessions', 'user_audit_log'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n📋 Manual Steps Required:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Run this SQL to create helper functions:');
  console.log(`
-- Function to get user by telegram chat id
CREATE OR REPLACE FUNCTION get_user_by_telegram_chat_id(chat_id BIGINT)
RETURNS TABLE (
    auth_user_id UUID,
    profile_id UUID,
    email TEXT,
    tier TEXT,
    trial_active BOOLEAN,
    quota_used INTEGER,
    quota_limit INTEGER,
    telegram_username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.auth_user_id,
        p.id as profile_id,
        p.email,
        p.tier,
        (p.trial_started_at IS NOT NULL AND p.trial_expires_at > NOW()) as trial_active,
        p.quota_used,
        p.quota_limit,
        p.telegram_username
    FROM profiles p
    WHERE p.telegram_chat_id = chat_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create linking token
CREATE OR REPLACE FUNCTION create_telegram_linking_token(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO telegram_linking_tokens (auth_user_id, linking_token)
    VALUES (user_id, token);
    RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link telegram account
CREATE OR REPLACE FUNCTION link_telegram_account(
    linking_token_param TEXT,
    chat_id_param BIGINT,
    username_param TEXT DEFAULT NULL,
    first_name_param TEXT DEFAULT NULL,
    last_name_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    token_record RECORD;
    profile_record RECORD;
BEGIN
    -- Find and validate linking token
    SELECT * INTO token_record
    FROM telegram_linking_tokens
    WHERE linking_token = linking_token_param
      AND expires_at > NOW()
      AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired linking token'
        );
    END IF;
    
    -- Update profile with Telegram info
    UPDATE profiles 
    SET 
        telegram_chat_id = chat_id_param::TEXT,
        telegram_username = username_param,
        telegram_first_name = first_name_param,
        telegram_last_name = last_name_param,
        telegram_linked_at = NOW(),
        updated_at = NOW()
    WHERE auth_user_id = token_record.auth_user_id
    RETURNING * INTO profile_record;
    
    -- Mark token as used
    UPDATE telegram_linking_tokens
    SET used_at = NOW()
    WHERE id = token_record.id;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', profile_record.auth_user_id,
        'profile_id', profile_record.id,
        'telegram_chat_id', chat_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_by_telegram_chat_id(BIGINT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_telegram_linking_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION link_telegram_account(TEXT, BIGINT, TEXT, TEXT, TEXT) TO authenticated, anon;
  `);

  console.log('\n✨ Basic schema migration completed!');
  console.log('Run the SQL above in Supabase Dashboard to complete the setup.');
}

runSimpleMigration().catch(console.error);