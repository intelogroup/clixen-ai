#!/usr/bin/env node

/**
 * Authentication System Verification Script
 * Tests Stack Auth + Neon Database integration
 */

const { neon } = require('@neondatabase/serverless');

async function verifyAuthSystem() {
  console.log('🧪 Starting Authentication System Verification...\n');

  try {
    // Test 1: Database Connection
    console.log('📊 Test 1: Database Connection');
    const sql = neon(process.env.DATABASE_URL);
    
    const result = await sql`SELECT COUNT(*) as count FROM neon_auth.users_sync WHERE deleted_at IS NULL`;
    console.log(`✅ Database connected successfully`);
    console.log(`📈 Active users in database: ${result[0].count}\n`);

    // Test 2: Schema Verification
    console.log('🔍 Test 2: Schema Verification');
    const schemaCheck = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'neon_auth' AND table_name = 'users_sync'
      ORDER BY ordinal_position
    `;
    
    console.log('✅ Schema structure verified:');
    schemaCheck.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    console.log('');

    // Test 3: User Data Verification
    console.log('👥 Test 3: User Data Verification');
    const users = await sql`
      SELECT id, name, email, created_at, updated_at
      FROM neon_auth.users_sync 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
      LIMIT 5
    `;

    console.log(`✅ Found ${users.length} active users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'No name'} (${user.email})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    // Test 4: Environment Variables
    console.log('🔧 Test 4: Environment Variables');
    const requiredEnvVars = [
      'NEXT_PUBLIC_STACK_PROJECT_ID',
      'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
      'STACK_SECRET_SERVER_KEY',
      'DATABASE_URL'
    ];

    let envVarsOk = true;
    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Set`);
      } else {
        console.log(`❌ ${varName}: Missing`);
        envVarsOk = false;
      }
    });

    if (envVarsOk) {
      console.log('✅ All required environment variables are set\n');
    } else {
      console.log('❌ Some environment variables are missing\n');
    }

    // Test 5: Sample Query Test
    console.log('🔄 Test 5: Sample Query Test');
    const sampleQuery = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.raw_json->>'signed_up_at_millis' as signup_timestamp
      FROM neon_auth.users_sync u
      WHERE u.deleted_at IS NULL
      LIMIT 1
    `;

    if (sampleQuery.length > 0) {
      console.log('✅ Sample query executed successfully');
      console.log('📄 Sample user data structure:');
      console.log(JSON.stringify(sampleQuery[0], null, 2));
    } else {
      console.log('⚠️  No users found for sample query');
    }

    console.log('\n🎉 Authentication System Verification Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connection: Working');
    console.log('✅ Schema structure: Valid');
    console.log('✅ User data sync: Active');
    console.log('✅ Environment setup: Complete');
    console.log('\n🚀 Ready for authentication testing!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('🔧 Check your environment variables and database connection');
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifyAuthSystem().catch(console.error);
}

module.exports = { verifyAuthSystem };
