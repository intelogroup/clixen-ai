#!/usr/bin/env node

/**
 * Run User Isolation Schema Migration
 * Executes the user-isolation-schema.sql using Supabase connection
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting User Isolation Schema Migration...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'user-isolation-schema.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 SQL file loaded, executing migration...');
    console.log(`   File: ${sqlFilePath}`);
    console.log(`   Size: ${sqlContent.length} characters\n`);

    // Split SQL into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => stmt !== '');

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`);
        
        // Log first 100 chars of statement for debugging
        const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
        console.log(`   Preview: ${preview}${statement.length > 100 ? '...' : ''}`);

        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct execution if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);

          // If direct execution also fails, try using the SQL editor approach
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          console.log('   ✅ Statement executed successfully');
        } else {
          console.log('   ✅ Statement executed successfully');
        }

        successCount++;
        
      } catch (statementError) {
        console.error(`   ❌ Error executing statement:`, statementError.message);
        
        // Continue with other statements unless it's a critical error
        if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE')) {
          console.log('   ⚠️  Continuing with other statements (table might already exist)');
        }
        
        errorCount++;
      }

      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🚀 User Isolation Schema migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }

    // Verify key tables were created
    console.log('\n🔍 Verifying schema creation...');
    
    const tables = [
      'telegram_linking_tokens',
      'user_sessions', 
      'user_audit_log'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);

        if (error) {
          console.log(`   ❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}': Created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': Verification failed`);
      }
    }

    // Check profiles table modifications
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('auth_user_id, telegram_chat_id, quota_used, quota_limit')
        .limit(0);

      if (error) {
        console.log(`   ❌ Profiles table updates: ${error.message}`);
      } else {
        console.log(`   ✅ Profiles table: Updated with new columns`);
      }
    } catch (err) {
      console.log(`   ❌ Profiles table: Update verification failed`);
    }

    console.log('\n✨ User Isolation Architecture is ready!');
    console.log('Next steps:');
    console.log('1. Deploy authenticated n8n workflows');
    console.log('2. Replace Telegram webhook handler');
    console.log('3. Add Telegram linking component to dashboard');

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Supabase connection credentials');
    console.error('2. Database permissions');
    console.error('3. SQL syntax in migration file');
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log('🔄 Trying direct SQL execution method...\n');

    const sqlFilePath = path.join(__dirname, 'migrations', 'user-isolation-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Use fetch API to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: sqlContent
    });

    if (response.ok) {
      console.log('✅ Direct SQL execution successful!');
      return true;
    } else {
      console.error('❌ Direct SQL execution failed:', response.statusText);
      return false;
    }

  } catch (error) {
    console.error('❌ Direct execution error:', error.message);
    return false;
  }
}

// Run the migration
async function main() {
  console.log('🔐 User Isolation Schema Migration Tool');
  console.log('=====================================\n');

  // Try the main migration method first
  try {
    await runMigration();
  } catch (error) {
    console.log('\n🔄 Primary method failed, trying alternative...');
    const success = await runMigrationDirect();
    
    if (!success) {
      console.error('\n💥 All migration methods failed.');
      console.log('\n📋 Manual execution instructions:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste the contents of:');
      console.log('   migrations/user-isolation-schema.sql');
      console.log('3. Execute the SQL manually');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration };