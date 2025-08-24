#!/usr/bin/env node

/**
 * Create testuser3@email.com with basic profile
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSimpleProfile() {
  console.log('🚀 Creating simple profile for testuser3@email.com...\n');
  
  try {
    // First get the auth user ID for this email
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Could not list users:', usersError.message);
      return;
    }
    
    const authUser = users.users.find(u => u.email === 'testuser3@email.com');
    if (!authUser) {
      console.log('❌ Auth user not found for testuser3@email.com');
      return;
    }
    
    console.log('✅ Found auth user:', authUser.id);
    
    // Create profile with auth_user_id
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        auth_user_id: authUser.id,
        email: 'testuser3@email.com',
        tier: 'free'
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Profile creation failed:', error.message);
      return;
    }
    
    console.log('✅ Profile created successfully!');
    console.log('   Profile ID:', data.id);
    console.log('   Email:', data.email);
    console.log('   Tier:', data.tier);
    
    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser3@email.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.log('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Authentication successful!');
      console.log('   User ID:', authData.user.id);
      await supabase.auth.signOut();
    }
    
    console.log('\n🎉 testuser3@email.com is ready for frontend testing!');
    console.log('   📧 Email: testuser3@email.com');
    console.log('   🔐 Password: TestPassword123!');
    console.log('   🌐 Frontend: http://localhost:3010');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createSimpleProfile();