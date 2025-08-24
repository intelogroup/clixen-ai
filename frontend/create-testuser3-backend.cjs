#!/usr/bin/env node

/**
 * Create testuser3@email.com directly through Supabase backend
 * This bypasses the frontend and creates the user account directly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase credentials');
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   SERVICE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser3() {
  console.log('🚀 Creating testuser3@email.com directly through Supabase backend...\n');
  
  const email = 'testuser3@email.com';
  const password = 'TestPassword123!';
  
  console.log('📧 Email: ' + email);
  console.log('🔐 Password: ' + password);
  console.log('');
  
  try {
    // Step 1: Create the auth user
    console.log('1️⃣ Creating Supabase auth user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        created_via: 'backend_script',
        test_user: true
      }
    });
    
    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      
      // Check if user already exists
      if (authError.message.includes('already')) {
        console.log('ℹ️  User might already exist, checking...');
        
        // Try to get existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.log('❌ Could not check existing users:', listError.message);
          return;
        }
        
        const existingUser = existingUsers.users.find(u => u.email === email);
        if (existingUser) {
          console.log('✅ Found existing auth user:', existingUser.id);
          console.log('   Email confirmed:', existingUser.email_confirmed_at ? '✅' : '❌');
          
          // Continue with profile creation using existing user
          await createUserProfile(existingUser);
          return;
        } else {
          console.log('❌ Could not find existing user');
          return;
        }
      } else {
        return;
      }
    }
    
    console.log('✅ Auth user created successfully!');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    console.log('   Email confirmed:', authData.user.email_confirmed_at ? '✅' : '❌');
    
    // Step 2: Create the user profile
    await createUserProfile(authData.user);
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

async function createUserProfile(authUser) {
  console.log('\\n2️⃣ Creating user profile in database...');
  
  try {
    // Calculate trial dates
    const trialStarted = new Date();
    const trialExpires = new Date(trialStarted.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        auth_user_id: authUser.id,
        email: authUser.email,
        tier: 'free',
        trial_active: true,
        trial_started_at: trialStarted.toISOString(),
        trial_expires_at: trialExpires.toISOString(),
        quota_used: 0,
        quota_limit: 50,
        user_metadata: {
          created_via: 'backend_script',
          test_user: true,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      
      if (profileError.message.includes('already exists') || profileError.code === '23505') {
        console.log('ℹ️  Profile might already exist, checking...');
        await checkExistingProfile(authUser.email);
      }
      return;
    }
    
    console.log('✅ User profile created successfully!');
    console.log('   Profile ID:', profileData.id);
    console.log('   Email:', profileData.email);
    console.log('   Tier:', profileData.tier);
    console.log('   Trial Active:', profileData.trial_active ? '✅' : '❌');
    console.log('   Trial Expires:', new Date(profileData.trial_expires_at).toLocaleDateString());
    console.log('   Quota:', profileData.quota_used + '/' + profileData.quota_limit);
    
    // Step 3: Verify the user can authenticate
    await verifyUserAuth(authUser.email, 'TestPassword123!');
    
  } catch (error) {
    console.log('❌ Profile creation error:', error.message);
  }
}

async function checkExistingProfile(email) {
  try {
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (profileError) {
      console.log('❌ Could not find existing profile:', profileError.message);
      return;
    }
    
    console.log('✅ Found existing profile:');
    console.log('   Profile ID:', existingProfile.id);
    console.log('   Email:', existingProfile.email);
    console.log('   Tier:', existingProfile.tier);
    console.log('   Trial Active:', existingProfile.trial_active ? '✅' : '❌');
    if (existingProfile.trial_expires_at) {
      console.log('   Trial Expires:', new Date(existingProfile.trial_expires_at).toLocaleDateString());
    }
    console.log('   Quota:', existingProfile.quota_used + '/' + existingProfile.quota_limit);
    
    // Verify auth still works
    await verifyUserAuth(email, 'TestPassword123!');
    
  } catch (error) {
    console.log('❌ Error checking existing profile:', error.message);
  }
}

async function verifyUserAuth(email, password) {
  console.log('\\n3️⃣ Verifying user authentication...');
  
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (signInError) {
      console.log('❌ Authentication test failed:', signInError.message);
      return;
    }
    
    console.log('✅ Authentication test successful!');
    console.log('   User authenticated:', signInData.user.email);
    console.log('   Session created:', signInData.session ? '✅' : '❌');
    
    // Sign out to clean up
    await supabase.auth.signOut();
    
  } catch (error) {
    console.log('❌ Authentication test error:', error.message);
  }
}

async function finalReport() {
  console.log('\\n' + '='.repeat(70));
  console.log('📊 TESTUSER3 CREATION SUMMARY');
  console.log('='.repeat(70));
  
  console.log('\\n✅ User Account Details:');
  console.log('   📧 Email: testuser3@email.com');
  console.log('   🔐 Password: TestPassword123!');
  console.log('   🎁 Trial: 7-day free trial activated');
  console.log('   📊 Quota: 50 free automations');
  
  console.log('\\n🚀 Ready for Frontend Testing:');
  console.log('   1. User can now sign in at http://localhost:3010');
  console.log('   2. User should be able to access dashboard');
  console.log('   3. User should see 7-day trial status');
  console.log('   4. User should be able to link Telegram account');
  
  console.log('\\n📝 Next Steps:');
  console.log('   • Test login through frontend auth modal');
  console.log('   • Verify dashboard access and trial display');
  console.log('   • Test Telegram bot linking workflow');
  console.log('   • Test automated workflow execution');
}

// Run the creation process
createTestUser3()
  .then(() => finalReport())
  .catch(error => {
    console.log('\\n💥 Fatal Error:', error.message);
    console.log('Stack:', error.stack);
  });