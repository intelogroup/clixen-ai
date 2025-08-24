#!/usr/bin/env node

/**
 * Create test user with telegram_id for testing authentication
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('🧪 Creating test user with telegram_id...');
  
  try {
    // Update existing user to have telegram_id
    const { data, error } = await supabase
      .from('profiles')
      .update({
        telegram_id: '123456789',
        tier: 'trial'
      })
      .eq('email', 'testuser2@email.com')
      .select();
    
    if (error) {
      console.log('❌ Error updating user:', error.message);
      
      // Try creating new user
      const { data: newData, error: newError } = await supabase
        .from('profiles')
        .insert({
          email: 'telegram-test@clixen.app',
          telegram_id: '123456789',
          tier: 'trial',
          credits_remaining: 100
        })
        .select();
      
      if (newError) {
        console.log('❌ Error creating new user:', newError.message);
        return;
      }
      
      console.log('✅ New test user created:', newData[0].email);
      console.log('📧 Email:', newData[0].email);
      console.log('📱 Telegram ID:', newData[0].telegram_id);
      console.log('🎯 Tier:', newData[0].tier);
      return;
    }
    
    console.log('✅ Test user updated:', data[0].email);
    console.log('📧 Email:', data[0].email);
    console.log('📱 Telegram ID:', data[0].telegram_id);
    console.log('🎯 Tier:', data[0].tier);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

async function verifyUser() {
  console.log('\n🔍 Verifying test user exists...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, telegram_id, tier, credits_remaining')
      .eq('telegram_id', '123456789')
      .single();
    
    if (error) {
      console.log('❌ Test user not found:', error.message);
      return false;
    }
    
    console.log('✅ Test user verified:');
    console.log('   ID:', data.id);
    console.log('   Email:', data.email);
    console.log('   Telegram ID:', data.telegram_id);
    console.log('   Tier:', data.tier);
    console.log('   Credits:', data.credits_remaining);
    
    return true;
  } catch (err) {
    console.error('Verification error:', err);
    return false;
  }
}

async function main() {
  await createTestUser();
  const verified = await verifyUser();
  
  if (verified) {
    console.log('\n🎉 Test user ready for authentication testing!');
    console.log('Now run: node test-with-telegram-user.js');
  }
}

main().catch(console.error);