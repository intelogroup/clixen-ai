#!/usr/bin/env node

/**
 * Fix Sliplane Webhook Configuration
 * Apply the environment variable fixes and test webhook functionality
 */

const https = require('https');

const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDA3ODQ4fQ.txQD98euIP1VvqlIQfWDVHYl3UVPBOGJ_XEEU0_3H2Y';

async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function fixSliplaneWebhook() {
  console.log('🔧 FIXING SLIPLANE WEBHOOK CONFIGURATION');
  console.log('========================================');
  console.log(`🌐 Instance: ${N8N_BASE_URL}\n`);

  try {
    // Step 1: Check current workflow status
    console.log('📋 Checking current workflows...');
    const listResponse = await n8nRequest('/workflows');
    
    if (listResponse.status !== 200) {
      throw new Error(`Failed to list workflows: ${listResponse.status}`);
    }

    const workflows = listResponse.data.data || [];
    console.log(`Found ${workflows.length} workflows`);
    
    const webhookWorkflows = workflows.filter(wf => 
      wf.nodes?.some(n => n.type === 'n8n-nodes-base.webhook')
    );
    
    console.log(`🎯 Webhook workflows: ${webhookWorkflows.length}`);
    
    // Step 2: Display Sliplane configuration requirements
    console.log('\n🔍 SLIPLANE CONFIGURATION REQUIREMENTS:');
    console.log('=====================================');
    console.log('You need to set these environment variables in your Sliplane service:');
    console.log('');
    console.log('WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/');
    console.log('N8N_PROTOCOL=https');
    console.log('N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app');
    console.log('N8N_PORT=443');
    console.log('N8N_SECURE_COOKIE=true');
    console.log('');
    console.log('📝 Steps to apply:');
    console.log('1. Go to your Sliplane dashboard');
    console.log('2. Navigate to your n8n service settings');
    console.log('3. Add the environment variables above');
    console.log('4. Restart your service');
    console.log('5. Run this script again to test');
    
    // Step 3: Force reactivation of all webhook workflows
    if (webhookWorkflows.length > 0) {
      console.log('\n🔄 FORCING WEBHOOK REACTIVATION');
      console.log('================================');
      
      for (const workflow of webhookWorkflows) {
        console.log(`\n🔧 Processing: ${workflow.name}`);
        console.log(`   ID: ${workflow.id}`);
        console.log(`   Current Status: ${workflow.active ? '✅ Active' : '❌ Inactive'}`);
        
        // Get webhook paths
        const webhookNodes = workflow.nodes?.filter(n => n.type === 'n8n-nodes-base.webhook') || [];
        const webhookPaths = webhookNodes.map(n => n.parameters?.path).filter(p => p);
        console.log(`   Webhook Paths: ${webhookPaths.join(', ')}`);
        
        // Force deactivation
        console.log('   🔴 Deactivating...');
        await n8nRequest(`/workflows/${workflow.id}/deactivate`, { method: 'POST' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Force reactivation
        console.log('   🟢 Reactivating...');
        const activateResponse = await n8nRequest(`/workflows/${workflow.id}/activate`, { method: 'POST' });
        
        if (activateResponse.status === 200) {
          console.log('   ✅ Reactivated successfully');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Test each webhook path
          for (const path of webhookPaths) {
            console.log(`\n   🧪 Testing webhook: /${path}`);
            
            const testResult = await testWebhook(path, {
              content: "SLIPLANE TEST: Testing webhook after configuration fix.",
              type: "test",
              source: "sliplane-fix"
            });
            
            console.log(`      Status: ${testResult.statusCode}`);
            
            if (testResult.statusCode === 200) {
              console.log('      🎉 SUCCESS! Webhook is now working!');
              try {
                const responseData = JSON.parse(testResult.data);
                console.log(`      📊 Response: ${JSON.stringify(responseData).substring(0, 100)}...`);
              } catch (e) {
                console.log(`      📄 Response: ${testResult.data.substring(0, 100)}...`);
              }
            } else if (testResult.statusCode === 404) {
              console.log('      ❌ Still 404 - Environment variables may not be set');
              console.log('      ⚠️  Please configure WEBHOOK_URL in Sliplane and restart');
            } else {
              console.log(`      ⚠️  Unexpected status: ${testResult.statusCode}`);
            }
          }
        } else {
          console.log(`   ❌ Reactivation failed: ${activateResponse.status}`);
        }
      }
    }
    
    // Step 4: Provide final recommendations
    console.log('\n🎯 NEXT STEPS BASED ON RESULTS:');
    console.log('===============================');
    
    console.log('\nIf webhooks are still failing:');
    console.log('1. ✅ Environment variables are not set in Sliplane');
    console.log('2. 🔄 Set WEBHOOK_URL and restart your Sliplane service');
    console.log('3. 🧪 Run this script again after restart');
    
    console.log('\nIf webhooks continue to fail after env var fix:');
    console.log('1. 🕒 Switch to cron/polling approach (more reliable on Sliplane)');
    console.log('2. 📱 Use Telegram polling instead of webhooks');
    console.log('3. 🔄 Use scheduled triggers in n8n workflows');
    
    console.log('\nRecommended architecture for Sliplane:');
    console.log('- Telegram Bot: Use polling (getUpdates) instead of webhooks');
    console.log('- n8n Workflows: Use Schedule Trigger + HTTP Request');
    console.log('- Frontend: Direct API calls to n8n instead of webhook triggers');
    
    return { success: true };

  } catch (error) {
    console.error('\n💥 Fix process failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWebhook(path, testData) {
  const webhookUrl = `${N8N_BASE_URL}/webhook/${path}`;
  
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
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
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

if (require.main === module) {
  fixSliplaneWebhook()
    .then(result => {
      if (result.success) {
        console.log('\n🎊 SLIPLANE WEBHOOK FIX PROCESS COMPLETED!');
        console.log('Follow the environment variable instructions above.');
      } else {
        console.log(`\n💔 Fix process failed: ${result.error}`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}