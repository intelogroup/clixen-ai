#!/usr/bin/env node

/**
 * AI Backend Setup Validation
 * Validates the backend configuration without starting the full server
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

dotenv.config();

console.log('🔍 VALIDATING AI BACKEND SETUP');
console.log('==============================');

// Check environment variables
const requiredEnvVars = [
  'PORT',
  'TELEGRAM_BOT_TOKEN', 
  'N8N_BASE_URL',
  'N8N_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('📋 Environment Variables:');
let envValid = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('KEY') || varName.includes('TOKEN') ? '[CONFIGURED]' : value}`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    envValid = false;
  }
});

if (!envValid) {
  console.log('\n⚠️  Some environment variables are missing. Check your .env file.');
  process.exit(1);
}

console.log('\n🧪 Testing Service Connections:');

// Test n8n connection
async function testN8n() {
  try {
    const response = await axios.get(`${process.env.N8N_BASE_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log(`✅ n8n: Connected (${response.data.data?.length || 0} workflows)`);
      return true;
    } else {
      console.log(`❌ n8n: Connection failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ n8n: ${error.message}`);
    return false;
  }
}

// Test Supabase connection
async function testSupabase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (!error) {
      console.log('✅ Supabase: Connected');
      return true;
    } else {
      console.log(`❌ Supabase: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Supabase: ${error.message}`);
    return false;
  }
}

// Test Telegram Bot API
async function testTelegram() {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`, {
      timeout: 5000
    });
    
    if (response.data.ok) {
      console.log(`✅ Telegram: Bot "${response.data.result.username}" verified`);
      return true;
    } else {
      console.log(`❌ Telegram: ${response.data.description}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Telegram: ${error.message}`);
    return false;
  }
}

// Run all tests
async function validateSetup() {
  const n8nOk = await testN8n();
  const supabaseOk = await testSupabase();
  const telegramOk = await testTelegram();
  
  const allOk = n8nOk && supabaseOk && telegramOk;
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  if (allOk) {
    console.log('🎉 ALL SYSTEMS READY!');
    console.log('✅ Environment: Configured correctly');
    console.log('✅ n8n: Connected and operational');
    console.log('✅ Supabase: Connected and accessible');
    console.log('✅ Telegram: Bot verified and ready');
    console.log('\n🚀 Ready to deploy AI backend server!');
    console.log('\n📋 Next Steps:');
    console.log('1. Add your OpenAI API key to .env');
    console.log('2. Deploy to Sliplane with these environment variables');
    console.log('3. Run: node deploy.js to configure webhook');
    console.log('4. Test with: npm test');
    return true;
  } else {
    console.log('⚠️  SETUP INCOMPLETE');
    console.log('Some connections failed. Check configuration and retry.');
    return false;
  }
}

validateSetup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Validation error:', error);
    process.exit(1);
  });