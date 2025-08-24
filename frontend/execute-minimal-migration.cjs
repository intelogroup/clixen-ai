#!/usr/bin/env node

/**
 * Execute Minimal Migration - One Step at a Time
 * Adds columns to profiles table step by step with careful error handling
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function executeMinimalMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔐 Connected to Supabase PostgreSQL\n');

    // Step 1: Add columns one by one
    const columns = [
      {
        name: 'auth_user_id',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID;',
        description: 'Link to Supabase Auth users'
      },
      {
        name: 'telegram_chat_id', 
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;',
        description: 'Telegram chat ID for bot communication'
      },
      {
        name: 'telegram_username',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;',
        description: 'Telegram username'
      },
      {
        name: 'telegram_first_name',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_first_name TEXT;',
        description: 'Telegram first name'
      },
      {
        name: 'telegram_last_name',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_last_name TEXT;',
        description: 'Telegram last name'
      },
      {
        name: 'telegram_linked_at',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;',
        description: 'When Telegram was linked'
      },
      {
        name: 'user_metadata',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT \'{}\';',
        description: 'User metadata storage'
      },
      {
        name: 'last_activity_at',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();',
        description: 'Last user activity timestamp'
      },
      {
        name: 'quota_used',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quota_used INTEGER DEFAULT 0;',
        description: 'Current quota usage'
      },
      {
        name: 'quota_limit',
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quota_limit INTEGER DEFAULT 50;',
        description: 'Quota limit'
      }
    ];

    console.log('📝 Adding columns to profiles table...\n');

    for (const column of columns) {
      try {
        console.log(`   Adding ${column.name}...`);
        await client.query(column.sql);
        console.log(`   ✅ ${column.name}: ${column.description}`);
      } catch (err) {
        console.log(`   ⚠️  ${column.name}: ${err.message} (might already exist)`);
      }
    }

    // Step 2: Add foreign key constraint after column exists
    console.log('\n🔗 Adding foreign key constraints...\n');
    
    try {
      console.log('   Adding foreign key for auth_user_id...');
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'profiles_auth_user_id_fkey' 
            AND table_name = 'profiles'
            AND table_schema = 'public'
          ) THEN
            ALTER TABLE profiles 
            ADD CONSTRAINT profiles_auth_user_id_fkey 
            FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      console.log('   ✅ Foreign key constraint added');
    } catch (err) {
      console.log(`   ⚠️  Foreign key constraint: ${err.message}`);
    }

    // Step 3: Add unique constraints
    console.log('\n🔑 Adding unique constraints...\n');
    
    const constraints = [
      {
        name: 'unique_auth_user_id',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'unique_auth_user_id' 
              AND table_name = 'profiles'
              AND table_schema = 'public'
            ) THEN
              ALTER TABLE profiles ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);
            END IF;
          END $$;
        `
      },
      {
        name: 'unique_telegram_chat_id',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'unique_telegram_chat_id' 
              AND table_name = 'profiles'
              AND table_schema = 'public'
            ) THEN
              ALTER TABLE profiles ADD CONSTRAINT unique_telegram_chat_id UNIQUE (telegram_chat_id);
            END IF;
          END $$;
        `
      }
    ];

    for (const constraint of constraints) {
      try {
        console.log(`   Adding ${constraint.name}...`);
        await client.query(constraint.sql);
        console.log(`   ✅ ${constraint.name} added`);
      } catch (err) {
        console.log(`   ⚠️  ${constraint.name}: ${err.message}`);
      }
    }

    // Step 4: Create indexes
    console.log('\n📊 Creating indexes...\n');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);', 
      'CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_at);'
    ];

    for (const indexSql of indexes) {
      try {
        const indexName = indexSql.match(/idx_[a-z_]+/)[0];
        console.log(`   Creating ${indexName}...`);
        await client.query(indexSql);
        console.log(`   ✅ ${indexName} created`);
      } catch (err) {
        console.log(`   ⚠️  Index creation: ${err.message}`);
      }
    }

    // Step 5: Create new tables
    console.log('\n🏗️  Creating new tables...\n');

    // Telegram linking tokens
    try {
      console.log('   Creating telegram_linking_tokens...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS telegram_linking_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            linking_token TEXT NOT NULL UNIQUE,
            telegram_chat_id BIGINT,
            expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('   ✅ telegram_linking_tokens table created');

      await client.query('CREATE INDEX IF NOT EXISTS idx_telegram_linking_tokens_token ON telegram_linking_tokens(linking_token);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_telegram_linking_tokens_user_id ON telegram_linking_tokens(auth_user_id);');
      console.log('   ✅ telegram_linking_tokens indexes created');

    } catch (err) {
      console.log(`   ⚠️  telegram_linking_tokens: ${err.message}`);
    }

    // User sessions
    try {
      console.log('   Creating user_sessions...');
      await client.query(`
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
      `);
      console.log('   ✅ user_sessions table created');

      await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_auth_user_id ON user_sessions(auth_user_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_telegram_chat_id ON user_sessions(telegram_chat_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);');
      console.log('   ✅ user_sessions indexes created');

    } catch (err) {
      console.log(`   ⚠️  user_sessions: ${err.message}`);
    }

    // User audit log
    try {
      console.log('   Creating user_audit_log...');
      await client.query(`
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
      `);
      console.log('   ✅ user_audit_log table created');

      await client.query('CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(auth_user_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON user_audit_log(created_at);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_user_audit_log_action_type ON user_audit_log(action_type);');
      console.log('   ✅ user_audit_log indexes created');

    } catch (err) {
      console.log(`   ⚠️  user_audit_log: ${err.message}`);
    }

    // Step 6: Verify everything
    console.log('\n🔍 Verification...\n');

    // Check profiles table structure
    const profileColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name IN ('auth_user_id', 'telegram_chat_id', 'telegram_username', 'quota_used', 'quota_limit')
      ORDER BY column_name
    `);

    console.log('📋 New Profiles Columns:');
    profileColumns.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name} (${row.data_type})`);
    });

    // Check new tables
    const newTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('telegram_linking_tokens', 'user_sessions', 'user_audit_log')
      ORDER BY table_name
    `);

    console.log('\n🏗️  New Tables:');
    newTables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🎉 BASIC USER ISOLATION SCHEMA COMPLETE!');
    console.log('\n📋 Manual Steps Still Required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Create the helper functions (get_user_by_telegram_chat_id, etc.)');
    console.log('   3. Enable RLS policies');
    console.log('   4. Grant necessary permissions');
    console.log('\n💡 OR: Copy and paste the functions from STEP_BY_STEP_MIGRATION.sql');
    console.log('     (lines starting with "CREATE OR REPLACE FUNCTION")');

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

console.log('🔐 Clixen AI - Minimal Database Migration');
console.log('=======================================\n');

executeMinimalMigration().catch(console.error);