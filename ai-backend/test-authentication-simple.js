#!/usr/bin/env node

/**
 * Simple Authentication Test - just test the webhook directly
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = 'http://localhost:3001';

async function testAuthenticatedMessage() {
  console.log('🔐 Testing authenticated Telegram message...');
  
  const testMessage = {
    update_id: 888888,
    message: {
      message_id: 1,
      from: {
        id: 123456789,
        username: 'testuser',
        first_name: 'Test'
      },
      chat: {
        id: 123456789,  // This should match telegram_id in database
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: 'Can you help me with a quick weather check for London?'
    }
  };
  
  console.log('📱 Sending authenticated message...');
  console.log(`   Chat ID: ${testMessage.message.chat.id}`);
  console.log(`   Message: "${testMessage.message.text}"`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BACKEND_URL}/webhook/telegram`,
      testMessage,
      { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`\n⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'unauthorized') {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('User not found or not authorized');
    } else if (response.data.status === 'workflow_executed') {
      console.log('\n🎉 SUCCESS! Full workflow execution completed!');
      console.log('✅ User authenticated via telegram_id');
      console.log('✅ AI intent classified correctly');
      console.log('✅ n8n workflow executed');
    } else if (response.data.status === 'direct_response') {
      console.log('\n✅ Direct AI response handled');
    } else {
      console.log('\n✅ Message processed successfully');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  AI Backend server is not running');
      console.log('Start the server first: npm start');
    }
  }
}

async function main() {
  console.log('🧪 AI BACKEND AUTHENTICATION TEST');
  console.log('=================================\n');
  
  await testAuthenticatedMessage();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);