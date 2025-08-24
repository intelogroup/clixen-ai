#!/usr/bin/env node

/**
 * Execute User Isolation Migration via Direct PostgreSQL Connection
 * Uses pg library to connect directly to Supabase PostgreSQL and run the migration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function executeMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    console.log('🔐 Connecting to Supabase PostgreSQL database...');
    console.log(`   Host: ${DATABASE_URL.split('@')[1].split('/')[0]}`);
    
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read the migration SQL file
    const sqlFile = path.join(__dirname, 'MANUAL_MIGRATION.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Migration file not found: ${sqlFile}`);
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('📝 Loaded migration SQL file');
    console.log(`   Size: ${sqlContent.length} characters\n`);

    console.log('🚀 Executing User Isolation Schema Migration...\n');
    
    // Execute the entire SQL file as one transaction
    await client.query('BEGIN');
    
    try {
      // Execute the migration SQL
      const result = await client.query(sqlContent);
      
      await client.query('COMMIT');
      
      console.log('✅ Migration executed successfully!\n');
      
      // Verify the migration by checking if tables exist
      console.log('🔍 Verifying schema creation...\n');
      
      const tables = [
        'telegram_linking_tokens',
        'user_sessions', 
        'user_audit_log'
      ];

      for (const table of tables) {
        try {
          const tableCheck = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          `, [table]);
          
          if (tableCheck.rows[0].count > 0) {
            console.log(`   ✅ Table '${table}': Created successfully`);
          } else {
            console.log(`   ❌ Table '${table}': Not found`);
          }
        } catch (err) {
          console.log(`   ❌ Table '${table}': Verification failed - ${err.message}`);
        }
      }

      // Check profiles table updates
      try {
        const profilesCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name IN ('auth_user_id', 'telegram_chat_id', 'quota_used', 'quota_limit')
        `);
        
        console.log(`   ✅ Profiles table: Added ${profilesCheck.rows.length}/4 new columns`);
        profilesCheck.rows.forEach(row => {
          console.log(`      - ${row.column_name}`);
        });
      } catch (err) {
        console.log(`   ❌ Profiles table check failed: ${err.message}`);
      }

      // Check functions
      console.log('\n🔧 Verifying functions...\n');
      
      const functions = [
        'get_user_by_telegram_chat_id',
        'create_telegram_linking_token', 
        'link_telegram_account',
        'increment_user_quota'
      ];

      for (const func of functions) {
        try {
          const funcCheck = await client.query(`
            SELECT COUNT(*) as count
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = $1
          `, [func]);
          
          if (funcCheck.rows[0].count > 0) {
            console.log(`   ✅ Function '${func}': Created successfully`);
          } else {
            console.log(`   ❌ Function '${func}': Not found`);
          }
        } catch (err) {
          console.log(`   ❌ Function '${func}': Verification failed`);
        }
      }

      // Test a function
      console.log('\n🧪 Testing functions...\n');
      
      try {
        // Test the get_user_by_telegram_chat_id function
        const testResult = await client.query(`
          SELECT * FROM get_user_by_telegram_chat_id(123456789) LIMIT 1
        `);
        console.log('   ✅ Function test: get_user_by_telegram_chat_id works');
      } catch (err) {
        console.log(`   ⚠️  Function test failed (expected if no users): ${err.message}`);
      }

      // Show final verification results
      console.log('\n📊 Final Migration Status:\n');
      
      try {
        const verificationQuery = await client.query(`
          SELECT 
              'telegram_linking_tokens' as table_name,
              COUNT(*) as row_count
          FROM telegram_linking_tokens
          UNION ALL
          SELECT 
              'user_sessions' as table_name,
              COUNT(*) as row_count  
          FROM user_sessions
          UNION ALL
          SELECT 
              'user_audit_log' as table_name,
              COUNT(*) as row_count
          FROM user_audit_log
          UNION ALL
          SELECT 
              'profiles_with_auth_id' as table_name,
              COUNT(*) as row_count
          FROM profiles 
          WHERE auth_user_id IS NOT NULL
        `);

        console.log('   📋 Table Status:');
        verificationQuery.rows.forEach(row => {
          console.log(`      ${row.table_name}: ${row.row_count} rows`);
        });

        console.log('\n🎉 USER ISOLATION ARCHITECTURE DEPLOYMENT COMPLETE!\n');
        console.log('✨ Next Steps:');
        console.log('   1. Deploy authenticated n8n workflows');
        console.log('   2. Replace Telegram webhook handler');
        console.log('   3. Add Telegram linking to dashboard');
        console.log('   4. Test end-to-end user isolation\n');

      } catch (err) {
        console.log('   ⚠️  Final verification queries failed (some tables may not exist yet)');
      }

    } catch (executeError) {
      await client.query('ROLLBACK');
      throw executeError;
    }

  } catch (error) {
    console.error('\n💥 Migration failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Code:', error.code);
    }
    
    if (error.detail) {
      console.error('Detail:', error.detail);
    }

    console.error('\nPlease check:');
    console.error('1. Database connection credentials');
    console.error('2. Network connectivity to Supabase');
    console.error('3. Database permissions');
    console.error('4. SQL syntax in migration file');
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
console.log('🔐 Clixen AI - User Isolation Database Migration');
console.log('================================================\n');

executeMigration().catch(console.error);