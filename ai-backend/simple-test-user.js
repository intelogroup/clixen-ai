#!/usr/bin/env node

/**
 * Simple test: Update existing user to have telegram_id
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateExistingUser() {
  console.log('🔧 Updating existing user to have telegram_id...');
  
  try {
    // Just update the telegram_id for existing user
    const { data, error } = await supabase
      .from('profiles')
      .update({
        telegram_id: '123456789'
      })
      .eq('email', 'testuser2@email.com')
      .select();
    
    if (error) {
      console.log('❌ Error updating user:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ User updated successfully!');
      console.log('📧 Email:', data[0].email);
      console.log('📱 Telegram ID:', data[0].telegram_id);
      console.log('🎯 Tier:', data[0].tier);
      console.log('💰 Credits:', data[0].credits_remaining);
    } else {
      console.log('⚠️  No user found with email testuser2@email.com');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

async function main() {
  await updateExistingUser();
  
  console.log('\n🎯 Ready to test authentication!');
  console.log('Run: node test-with-telegram-user.js');
}

main().catch(console.error);