#!/usr/bin/env node

/**
 * Simple Direct Webhook Test
 * Test the deployed webhook without API authentication
 */

const https = require('https');

// Known webhook endpoint from successful deployment
const WEBHOOK_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app/webhook/ai-pipeline-fixed';

async function testWebhookEndpoint(testData, testName) {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const postData = JSON.stringify(testData);
    
    console.log(`\n🧪 ${testName}`);
    console.log(`📤 URL: ${WEBHOOK_URL}`);
    console.log(`📊 Payload: ${postData.length} bytes`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-webhook-test',
        'Accept': 'application/json'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`📥 Status: ${res.statusCode}`);
      console.log(`📥 Headers: ${JSON.stringify(res.headers, null, 2)}`);

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`📥 Response: ${responseData.length} bytes received`);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS - Webhook processed successfully!');
          
          try {
            const jsonResponse = JSON.parse(responseData);
            console.log('📊 Parsed JSON Response:');
            console.log(JSON.stringify(jsonResponse, null, 2));
          } catch (e) {
            console.log('📄 Raw Response:');
            console.log(responseData.substring(0, 500));
          }
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            data: responseData
          });
        } else {
          console.log(`❌ HTTP ${res.statusCode} - Check workflow configuration`);
          console.log(`📄 Response: ${responseData}`);
          
          resolve({
            success: false,
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`💥 Request failed: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏱️  Request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function runSimpleWebhookTest() {
  console.log('🚀 SIMPLE WEBHOOK TEST - ADVANCED AI WORKFLOW');
  console.log('==============================================');

  const testCases = [
    {
      name: 'Quick Contract Test',
      data: {
        content: "Contract Agreement between Company A and Company B. Term: 12 months. Value: $50,000.",
        type: "contract"
      }
    },
    {
      name: 'Quick Invoice Test',
      data: {
        content: "INVOICE #001. From: Vendor Inc. To: Client Corp. Amount: $2,500. Due: 30 days.",
        type: "invoice"
      }
    },
    {
      name: 'Quick Report Test',
      data: {
        content: "Monthly Report: Revenue $100K, Growth 15%, New customers 50.",
        type: "report"
      }
    }
  ];

  console.log(`\n📋 Testing ${testCases.length} document types...\n`);

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`TEST ${i + 1}/${testCases.length}: ${testCase.name}`);
      console.log(`${'='.repeat(50)}`);

      const startTime = Date.now();
      const result = await testWebhookEndpoint(testCase.data, testCase.name);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Duration: ${duration}ms`);
      
      results.push({
        test: testCase.name,
        success: result.success,
        statusCode: result.statusCode,
        duration: duration
      });

      // Wait between tests
      if (i < testCases.length - 1) {
        console.log('\n⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.log(`💥 Test failed: ${error.message}`);
      results.push({
        test: testCase.name,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 WEBHOOK TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n🎯 Results:`);
  console.log(`   ✅ Successful: ${successful}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);

  console.log(`\n📋 Details:`);
  results.forEach((result, i) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`   ${i + 1}. ${icon} ${result.test} (${result.statusCode || 'ERR'}) - ${result.duration}ms`);
  });

  if (successful > 0) {
    console.log(`\n🎉 WEBHOOK IS WORKING!`);
    console.log(`🤖 Advanced AI workflow successfully processed ${successful} document(s)`);
    console.log(`🔗 Production endpoint: ${WEBHOOK_URL}`);
    console.log(`\n📋 Usage:`);
    console.log(`   Method: POST`);
    console.log(`   Content-Type: application/json`);
    console.log(`   Body: { "content": "document text", "type": "document_type" }`);
  } else {
    console.log(`\n⚠️  All tests failed - workflow may need reactivation`);
  }

  return {
    totalTests: testCases.length,
    successful: successful,
    failed: failed,
    results: results
  };
}

if (require.main === module) {
  runSimpleWebhookTest()
    .then(summary => {
      console.log(`\n🎊 Testing completed: ${summary.successful}/${summary.totalTests} successful`);
      process.exit(summary.successful > 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}