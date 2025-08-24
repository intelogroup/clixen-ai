#!/usr/bin/env node

/**
 * AI Backend Testing Suite
 * Comprehensive testing for the AI backend server functionality
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TEST_CHAT_ID = process.env.TEST_CHAT_ID || '123456789'; // Replace with your Telegram chat ID

/**
 * Test Suite Runner
 */
class AIBackendTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = await testFn();
      
      if (result.success) {
        console.log(`✅ PASS: ${name}`);
        this.results.passed++;
      } else {
        console.log(`❌ FAIL: ${name} - ${result.error}`);
        this.results.failed++;
      }
      
      this.results.tests.push({ name, success: result.success, error: result.error });
      console.log('');
      
    } catch (error) {
      console.log(`💥 ERROR: ${name} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, success: false, error: error.message });
      console.log('');
    }
  }

  printSummary() {
    console.log('='.repeat(60));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    console.log('');
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Backend is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Check configuration and retry.');
    }
  }
}

/**
 * Test Functions
 */

// Test 1: Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    
    if (response.status === 200 && response.data.status === 'healthy') {
      return { success: true };
    } else {
      return { success: false, error: `Unhealthy status: ${response.data.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 2: API Status  
async function testAPIStatus() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/status`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'operational') {
      return { success: true };
    } else {
      return { success: false, error: `API status: ${response.data.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 3: Telegram Webhook Simulation
async function testTelegramWebhook() {
  try {
    const testMessage = {
      update_id: 12345,
      message: {
        message_id: 1,
        from: {
          id: parseInt(TEST_CHAT_ID),
          username: 'testuser',
          first_name: 'Test'
        },
        chat: {
          id: parseInt(TEST_CHAT_ID),
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Hello, this is a test message'
      }
    };

    const response = await axios.post(
      `${BACKEND_URL}/webhook/telegram`,
      testMessage,
      { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.status === 200 && response.data.ok) {
      return { success: true };
    } else {
      return { success: false, error: `Webhook response: ${JSON.stringify(response.data)}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 4: AI Intent Classification Test
async function testAIIntentClassification() {
  try {
    const testMessages = [
      'Can you summarize this document for me?',
      'What\'s the weather like today?',
      'Translate this text to Spanish',
      'Hello, how are you?'
    ];

    for (const message of testMessages) {
      const testUpdate = {
        update_id: Math.floor(Math.random() * 10000),
        message: {
          message_id: Math.floor(Math.random() * 1000),
          from: {
            id: parseInt(TEST_CHAT_ID),
            username: 'testuser'
          },
          chat: {
            id: parseInt(TEST_CHAT_ID),
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: message
        }
      };

      const response = await axios.post(
        `${BACKEND_URL}/webhook/telegram`,
        testUpdate,
        { timeout: 30000 }
      );

      if (response.status !== 200) {
        return { success: false, error: `Failed for message: ${message}` };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  try {
    // Test with invalid message format
    const invalidMessage = {
      update_id: 12345,
      message: {
        // Missing required fields
        message_id: 1,
        date: Math.floor(Date.now() / 1000)
      }
    };

    const response = await axios.post(
      `${BACKEND_URL}/webhook/telegram`,
      invalidMessage,
      { timeout: 10000 }
    );

    // Should handle gracefully
    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `Unexpected error handling: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 6: Concurrent Request Handling
async function testConcurrentRequests() {
  try {
    const requests = [];
    const numRequests = 5;

    for (let i = 0; i < numRequests; i++) {
      const testMessage = {
        update_id: 20000 + i,
        message: {
          message_id: i,
          from: {
            id: parseInt(TEST_CHAT_ID) + i,
            username: `testuser${i}`
          },
          chat: {
            id: parseInt(TEST_CHAT_ID) + i,
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: `Concurrent test message ${i}`
        }
      };

      requests.push(
        axios.post(`${BACKEND_URL}/webhook/telegram`, testMessage, { timeout: 30000 })
      );
    }

    const responses = await Promise.all(requests);
    
    // Check all succeeded
    const allSuccessful = responses.every(resp => resp.status === 200);
    
    if (allSuccessful) {
      return { success: true };
    } else {
      return { success: false, error: 'Some concurrent requests failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Load Testing Simulation
 */
async function performLoadTest() {
  console.log('🚀 LOAD TESTING');
  console.log('===============');
  
  const startTime = Date.now();
  const requests = [];
  const numRequests = 20;
  
  console.log(`📈 Sending ${numRequests} concurrent requests...`);
  
  for (let i = 0; i < numRequests; i++) {
    const testMessage = {
      update_id: 30000 + i,
      message: {
        message_id: i,
        from: {
          id: parseInt(TEST_CHAT_ID),
          username: 'loadtester'
        },
        chat: {
          id: parseInt(TEST_CHAT_ID),
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: `Load test message ${i} - testing system capacity`
      }
    };

    requests.push(
      axios.post(`${BACKEND_URL}/webhook/telegram`, testMessage, { timeout: 45000 })
        .then(response => ({ success: true, status: response.status }))
        .catch(error => ({ success: false, error: error.message }))
    );
  }

  const results = await Promise.all(requests);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📊 Average per request: ${(totalTime / numRequests).toFixed(2)}ms`);
  console.log(`✅ Successful: ${successful}/${numRequests}`);
  console.log(`❌ Failed: ${failed}/${numRequests}`);
  console.log(`🎯 Success rate: ${((successful / numRequests) * 100).toFixed(1)}%`);
  
  if (successful >= numRequests * 0.9) {
    console.log('🎉 Load test PASSED! System handles concurrent load well.');
  } else {
    console.log('⚠️  Load test shows performance issues under load.');
  }
  console.log('');
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🧪 CLIXEN AI BACKEND TEST SUITE');
  console.log('================================');
  console.log(`🎯 Testing backend at: ${BACKEND_URL}`);
  console.log('');

  const tester = new AIBackendTester();

  // Core functionality tests
  await tester.runTest('Health Check Endpoint', testHealthCheck);
  await tester.runTest('API Status Endpoint', testAPIStatus);
  await tester.runTest('Telegram Webhook Processing', testTelegramWebhook);
  await tester.runTest('AI Intent Classification', testAIIntentClassification);
  await tester.runTest('Error Handling', testErrorHandling);
  await tester.runTest('Concurrent Request Handling', testConcurrentRequests);

  // Load testing
  await performLoadTest();

  // Print summary
  tester.printSummary();

  return tester.results;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite error:', error);
      process.exit(1);
    });
}

export default runAllTests;