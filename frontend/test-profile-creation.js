#!/usr/bin/env node

/**
 * Test Profile Creation with New Schema
 * 
 * This script tests if the new profile creation logic works correctly
 * with the updated database schema (auth_user_id, quota_*, etc.)
 */

const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 Testing Profile Creation with New Schema...\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌')
  process.exit(1)
}

// Create service role client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testProfileCreation() {
  try {
    console.log('1. Testing database schema...')
    
    // Check if profiles table has the new columns
    const { data: columns, error: schemaError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name IN ('auth_user_id', 'quota_used', 'quota_limit', 'full_name')
          ORDER BY column_name;
        `
      })

    if (schemaError) {
      // Try direct query instead
      console.log('   📊 Checking table structure directly...')
      const { data: tableInfo, error: tableError } = await supabase
        .from('profiles')
        .select('auth_user_id, quota_used, quota_limit, full_name')
        .limit(1)
      
      if (tableError) {
        console.log('   ❌ Schema check failed:', tableError.message)
        console.log('   🔍 Let\'s check what columns exist...')
        
        // Try to get any profile to see the structure
        const { data: sampleProfile } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        if (sampleProfile && sampleProfile[0]) {
          console.log('   📋 Available columns:', Object.keys(sampleProfile[0]))
        }
      } else {
        console.log('   ✅ New schema columns are available')
      }
    } else {
      console.log('   ✅ Schema query successful')
      console.log('   📋 Available columns:', columns?.map(c => c.column_name))
    }

    console.log('\n2. Testing profile creation with new schema...')
    
    // Create test profile data
    const testAuthUserId = '12345678-1234-1234-1234-123456789abc' // Mock UUID
    const profileData = {
      auth_user_id: testAuthUserId,
      email: 'test-schema@example.com',
      full_name: 'Test User Schema',
      tier: 'free',
      trial_active: true,
      trial_started_at: new Date().toISOString(),
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quota_limit: 50,
      quota_used: 0,
      last_activity_at: new Date().toISOString(),
      user_metadata: {}
    }

    console.log('   📝 Profile data to insert:', JSON.stringify(profileData, null, 4))

    // Try to insert the profile
    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (insertError) {
      console.log('\n   ❌ Profile insertion failed:')
      console.log('      Error code:', insertError.code)
      console.log('      Error message:', insertError.message)
      console.log('      Error details:', insertError.details)
      console.log('      Error hint:', insertError.hint)
      
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\n   🔍 This suggests the database schema is different than expected.')
        console.log('      The migration may not have been applied yet.')
      }
    } else {
      console.log('\n   ✅ Profile creation successful!')
      console.log('      Created profile ID:', insertedProfile.id)
      console.log('      Auth user ID:', insertedProfile.auth_user_id)
      
      // Clean up test data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', insertedProfile.id)
      
      console.log('   🧹 Cleaned up test profile')
    }

    console.log('\n3. Testing profile lookup by auth_user_id...')
    
    // Test the lookup query that's used in the auth callback
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, auth_user_id')
      .eq('auth_user_id', testAuthUserId)
      .single()

    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('   ✅ Profile lookup correctly returns "not found" for non-existent user')
    } else if (fetchError) {
      console.log('   ❌ Profile lookup failed:', fetchError.message)
    } else {
      console.log('   ℹ️  Profile lookup found existing profile:', existingProfile.id)
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

// Run the test
testProfileCreation()
  .then(() => {
    console.log('\n🎉 Profile creation test completed!')
    console.log('\nIf the test shows schema issues, you may need to:')
    console.log('1. Run the database migration: frontend/STEP_BY_STEP_MIGRATION.sql')
    console.log('2. Or check if the database still uses the legacy schema')
  })
  .catch(error => {
    console.error('\n💥 Test crashed:', error.message)
    process.exit(1)
  })
