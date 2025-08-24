#!/usr/bin/env node

/**
 * Test API v1 Endpoint as Suggested
 * Test different base URLs to find the correct Sliplane configuration
 */

const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDA3ODQ4fQ.txQD98euIP1VvqlIQfWDVHYl3UVPBOGJ_XEEU0_3H2Y';

// Test different base URL configurations
const TEST_CONFIGURATIONS = [
  {
    name: 'Current Configuration',
    baseUrl: 'https://n8nio-n8n-7xzf6n.sliplane.app',
    apiPath: '/api/v1',
    webhookPath: '/webhook'
  },
  {
    name: 'API v1 Base URL (User Suggestion)', 
    baseUrl: 'https://n8nio-n8n-7xzf6n.sliplane.app/api/v1',
    apiPath: '',
    webhookPath: '/webhook'
  },
  {
    name: 'Alternative Webhook Path',
    baseUrl: 'https://n8nio-n8n-7xzf6n.sliplane.app',
    apiPath: '/api/v1',
    webhookPath: '/api/v1/webhook'
  },
  {
    name: 'Direct API v1 Webhook',
    baseUrl: 'https://n8nio-n8n-7xzf6n.sliplane.app/api/v1',
    apiPath: '',
    webhookPath: '/webhook'
  }
];

async function makeRequest(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ 
            url,
            status: res.statusCode, 
            data: parsed, 
            raw: data.substring(0, 500)
          });
        } catch (e) {
          resolve({ 
            url,
            status: res.statusCode, 
            data: null, 
            raw: data.substring(0, 500)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ 
        url,
        status: 0, 
        error: error.message 
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testWebhookEndpoint(baseUrl, webhookPath, path, testData) {
  const webhookUrl = `${baseUrl}${webhookPath}/${path}`;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: new URL(webhookUrl).hostname,
      port: 443,
      path: new URL(webhookUrl).pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          url: webhookUrl,
          statusCode: res.statusCode,
          data: responseData.substring(0, 200)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url: webhookUrl,
        statusCode: 0,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testApiV1Configurations() {
  console.log('🔍 TESTING API V1 ENDPOINT CONFIGURATIONS');
  console.log('=========================================');
  console.log('Testing different base URL patterns for Sliplane n8n instance\n');

  const results = [];

  for (let i = 0; i < TEST_CONFIGURATIONS.length; i++) {
    const config = TEST_CONFIGURATIONS[i];
    
    console.log(`${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}/${TEST_CONFIGURATIONS.length}: ${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`API Path: ${config.apiPath || '(none)'}`);
    console.log(`Webhook Path: ${config.webhookPath}`);
    
    const testResult = {
      configuration: config.name,
      baseUrl: config.baseUrl,
      apiPath: config.apiPath,
      webhookPath: config.webhookPath,
      tests: {}
    };
    
    // Test 1: API Health Check
    console.log('\n🏥 Testing API Health...');
    const healthUrl = `${config.baseUrl}${config.apiPath}/workflows`;
    console.log(`   URL: ${healthUrl}`);
    
    const healthResponse = await makeRequest(config.baseUrl, `${config.apiPath}/workflows`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.status === 200) {
      console.log('   ✅ API is accessible');
      const workflows = healthResponse.data?.data || [];
      console.log(`   📊 Workflows found: ${workflows.length}`);
      testResult.tests.apiHealth = { status: 'success', workflowCount: workflows.length };
    } else {
      console.log('   ❌ API not accessible');
      testResult.tests.apiHealth = { status: 'failed', error: healthResponse.raw };
    }
    
    // Test 2: Webhook Endpoint Test (if we found active workflows)
    if (testResult.tests.apiHealth.status === 'success') {
      console.log('\n🔗 Testing Webhook Endpoints...');
      
      // Test with our known webhook path
      const webhookTest = await testWebhookEndpoint(
        config.baseUrl, 
        config.webhookPath, 
        'clean-ai-pipeline',
        {
          content: "API V1 TEST: Testing webhook with different base URL configuration.",
          type: "test",
          source: "api-v1-test"
        }
      );
      
      console.log(`   URL: ${webhookTest.url}`);
      console.log(`   Status: ${webhookTest.statusCode}`);
      
      if (webhookTest.statusCode === 200) {
        console.log('   🎉 WEBHOOK WORKING!');
        console.log(`   Response: ${webhookTest.data}`);
        testResult.tests.webhook = { status: 'success', response: webhookTest.data };
      } else if (webhookTest.statusCode === 404) {
        console.log('   ❌ Webhook not found (404)');
        testResult.tests.webhook = { status: 'not_found' };
      } else if (webhookTest.statusCode === 0) {
        console.log('   ❌ Connection error');
        testResult.tests.webhook = { status: 'connection_error', error: webhookTest.error };
      } else {
        console.log(`   ⚠️  Unexpected status: ${webhookTest.statusCode}`);
        testResult.tests.webhook = { status: 'unexpected', statusCode: webhookTest.statusCode };
      }
    } else {
      testResult.tests.webhook = { status: 'skipped', reason: 'API not accessible' };
    }
    
    // Test 3: Alternative webhook paths
    if (testResult.tests.apiHealth.status === 'success' && testResult.tests.webhook.status !== 'success') {
      console.log('\n🔄 Testing Alternative Webhook Paths...');
      
      const altPaths = ['/webhook-test', '/production/webhook', '/webhooks'];
      
      for (const altPath of altPaths) {
        const altTest = await testWebhookEndpoint(
          config.baseUrl,
          altPath,
          'clean-ai-pipeline',
          { content: "Alternative path test", type: "test" }
        );
        
        console.log(`   Testing ${altPath}: ${altTest.statusCode}`);
        
        if (altTest.statusCode === 200) {
          console.log(`   🎉 FOUND WORKING PATH: ${altPath}`);
          testResult.tests.alternativePath = { 
            status: 'success', 
            path: altPath,
            url: altTest.url
          };
          break;
        }
      }
    }
    
    results.push(testResult);
    console.log('');
  }
  
  // Summary Report
  console.log('=' + '='.repeat(70));
  console.log('📊 API V1 CONFIGURATION TEST SUMMARY');
  console.log('=' + '='.repeat(70));
  
  console.log('\n🎯 Configuration Test Results:');
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.configuration}`);
    console.log(`   Base URL: ${result.baseUrl}`);
    console.log(`   API Health: ${result.tests.apiHealth?.status || 'unknown'}`);
    console.log(`   Webhook: ${result.tests.webhook?.status || 'unknown'}`);
    
    if (result.tests.webhook?.status === 'success') {
      console.log(`   🎉 WORKING WEBHOOK FOUND!`);
      console.log(`   ✅ This configuration works for webhooks`);
    }
    
    if (result.tests.alternativePath?.status === 'success') {
      console.log(`   🔍 Alternative path found: ${result.tests.alternativePath.path}`);
    }
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  const workingConfigs = results.filter(r => r.tests.webhook?.status === 'success');
  
  if (workingConfigs.length > 0) {
    console.log('✅ WEBHOOK SOLUTION FOUND:');
    workingConfigs.forEach(config => {
      console.log(`   Use: ${config.baseUrl} with webhook path: ${config.webhookPath}`);
      console.log(`   Update your WEBHOOK_URL environment variable accordingly`);
    });
  } else {
    console.log('❌ No working webhook configurations found');
    console.log('✅ RECOMMENDED APPROACH:');
    console.log('   1. Continue using cron-based workflows (already deployed)');
    console.log('   2. They work reliably without webhook dependencies');
    console.log('   3. Use direct API calls to n8n for real-time processing');
  }
  
  const workingApis = results.filter(r => r.tests.apiHealth?.status === 'success');
  
  if (workingApis.length > 0) {
    console.log('\n📡 WORKING API CONFIGURATIONS:');
    workingApis.forEach(config => {
      console.log(`   ✅ ${config.baseUrl}${config.apiPath} - ${config.tests.apiHealth.workflowCount} workflows`);
    });
  }
  
  return {
    success: true,
    totalConfigs: results.length,
    workingWebhooks: workingConfigs.length,
    workingApis: workingApis.length,
    results: results
  };
}

if (require.main === module) {
  testApiV1Configurations()
    .then(result => {
      if (result.workingWebhooks > 0) {
        console.log(`\n🎊 SUCCESS! Found ${result.workingWebhooks} working webhook configuration(s)!`);
      } else {
        console.log('\n📋 No webhook configs working - cron-based approach is recommended');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}