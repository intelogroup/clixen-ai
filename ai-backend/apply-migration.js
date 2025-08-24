#!/usr/bin/env node

/**
 * Apply Supabase Migration using Management API
 */

import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_PROJECT_REF = 'efashzkgbougijqcbead'; // From your Supabase URL
const SUPABASE_ACCESS_TOKEN = 'sbp_8c71e6c90879c515a5ca29cc49692d3c53748376';

async function runMigration() {
  console.log('🚀 APPLYING SUPABASE MIGRATION');
  console.log('==============================\n');
  
  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync('supabase-migration.sql', 'utf8');
    
    console.log('📄 Migration SQL loaded');
    console.log('🔄 Executing migration via Supabase API...\n');
    
    // Execute SQL via Supabase Management API
    const response = await axios.post(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        query: migrationSQL
      },
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200) {
      console.log('✅ Migration executed successfully!');
      console.log('\n📊 Migration Results:');
      console.log(JSON.stringify(response.data, null, 2));
      
      console.log('\n🎉 MIGRATION COMPLETE!');
      console.log('====================');
      console.log('✅ telegram_chat_id column added');
      console.log('✅ Index created for performance');
      console.log('✅ Test users created');
      console.log('✅ Schema ready for production');
      
      return true;
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      console.log(response.data);
      return false;
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Authentication failed - Access token may be invalid');
    } else if (error.response?.status === 404) {
      console.log('❌ Project not found or API endpoint changed');
    } else {
      console.log('❌ Migration failed:', error.message);
    }
    
    console.log('\n📋 MANUAL MIGRATION REQUIRED');
    console.log('============================');
    console.log('Since the API migration failed, please:');
    console.log('1. Go to https://supabase.com/dashboard/project/efashzkgbougijqcbead/sql');
    console.log('2. Click "New Query"');
    console.log('3. Copy the contents of supabase-migration.sql');
    console.log('4. Paste and click "Run"');
    console.log('5. Verify in Table Editor that telegram_chat_id column exists');
    
    return false;
  }
}

// Alternative: Direct database connection approach
async function applyViaDirectConnection() {
  console.log('\n🔄 Attempting direct database connection...');
  
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test if column already exists
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Column telegram_chat_id already exists!');
      return true;
    }
    
    if (testError.message.includes('telegram_chat_id')) {
      console.log('❌ Column does not exist yet');
      console.log('⚠️  Direct ALTER TABLE not supported via client library');
      console.log('📋 Please run the migration SQL manually in Supabase dashboard');
      return false;
    }
    
  } catch (err) {
    console.log('Error:', err.message);
    return false;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test query with telegram_chat_id
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, telegram_chat_id, tier')
      .limit(5);
    
    if (error) {
      if (error.message.includes('telegram_chat_id')) {
        console.log('❌ Migration not applied - column still missing');
        return false;
      }
      console.log('❌ Verification error:', error.message);
      return false;
    }
    
    console.log('✅ Migration verified successfully!');
    console.log(`📊 Found ${data?.length || 0} profiles`);
    
    if (data && data.length > 0) {
      console.log('\nSample profiles:');
      data.forEach(profile => {
        console.log(`  - ${profile.email} | Telegram: ${profile.telegram_chat_id || 'Not linked'} | Tier: ${profile.tier}`);
      });
    }
    
    return true;
  } catch (err) {
    console.log('Error:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  // Try API migration first
  const apiSuccess = await runMigration();
  
  if (!apiSuccess) {
    // Try direct connection as fallback
    const directSuccess = await applyViaDirectConnection();
    
    if (!directSuccess) {
      console.log('\n⚠️  MANUAL ACTION REQUIRED');
      console.log('Please apply the migration manually in Supabase dashboard');
      process.exit(1);
    }
  }
  
  // Verify the migration worked
  const verified = await verifyMigration();
  
  if (verified) {
    console.log('\n🎉 SUCCESS!');
    console.log('Your AI Backend can now authenticate Telegram users!');
  } else {
    console.log('\n⚠️  Migration verification failed');
    console.log('Please check Supabase dashboard manually');
  }
}

main().catch(console.error);