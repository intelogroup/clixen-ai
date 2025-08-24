#!/usr/bin/env node

/**
 * Fix Webhook Registration Following n8n Documentation Best Practices
 * Proper deactivate/reactivate sequence to ensure webhook registration
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
          resolve({
            status: res.statusCode,
            data: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: null,
            raw: data
          });
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

async function fixWebhookRegistration() {
  console.log('🔧 FIXING WEBHOOK REGISTRATION - Following n8n Best Practices');
  console.log('============================================================\n');

  try {
    // Step 1: Get all workflows
    console.log('📋 Fetching all workflows...');
    const listResponse = await n8nRequest('/workflows');
    
    if (listResponse.status !== 200) {
      throw new Error(`Failed to list workflows: ${listResponse.status}`);
    }

    const workflows = listResponse.data.data || [];
    console.log(`Found ${workflows.length} workflows\n`);

    // Step 2: Find webhook workflows
    const webhookWorkflows = workflows.filter(wf => {
      const hasWebhook = wf.nodes?.some(n => n.type === 'n8n-nodes-base.webhook');
      return hasWebhook;
    });

    console.log(`🎯 Found ${webhookWorkflows.length} webhook workflows:`);
    webhookWorkflows.forEach((wf, i) => {
      console.log(`${i + 1}. ${wf.name} (${wf.id})`);
      console.log(`   Active: ${wf.active ? '✅ YES' : '❌ NO'}`);
      
      const webhookNodes = wf.nodes?.filter(n => n.type === 'n8n-nodes-base.webhook') || [];
      webhookNodes.forEach(node => {
        const path = node.parameters?.path;
        console.log(`   🔗 Webhook Path: /${path || 'undefined'}`);
        console.log(`   📡 Production URL: ${N8N_BASE_URL}/webhook/${path || 'undefined'}`);
      });
      console.log('');
    });

    // Step 3: Fix webhook registration for each workflow
    const results = [];
    
    for (let i = 0; i < webhookWorkflows.length; i++) {
      const workflow = webhookWorkflows[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔧 FIXING WORKFLOW ${i + 1}/${webhookWorkflows.length}: ${workflow.name}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        // Get webhook paths for this workflow
        const webhookNodes = workflow.nodes?.filter(n => n.type === 'n8n-nodes-base.webhook') || [];
        const webhookPaths = webhookNodes.map(n => n.parameters?.path).filter(p => p);
        
        if (webhookPaths.length === 0) {
          console.log('⚠️  No webhook paths found in this workflow');
          results.push({ workflow: workflow.name, status: 'no_webhook_paths' });
          continue;
        }
        
        console.log(`📍 Webhook paths: ${webhookPaths.join(', ')}`);

        // Step 3.1: Deactivate workflow (essential for re-registration)
        console.log('\n🔴 Deactivating workflow...');
        const deactivateResponse = await n8nRequest(`/workflows/${workflow.id}/deactivate`, {
          method: 'POST'
        });
        
        if (deactivateResponse.status === 200) {
          console.log('✅ Deactivated successfully');
        } else {
          console.log(`⚠️  Deactivation returned: ${deactivateResponse.status}`);
          // Continue anyway as it might already be inactive
        }

        // Step 3.2: Wait for deactivation to complete
        console.log('⏳ Waiting 3 seconds for deactivation to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3.3: Reactivate workflow (this should re-register webhooks)
        console.log('\n🟢 Reactivating workflow...');
        const activateResponse = await n8nRequest(`/workflows/${workflow.id}/activate`, {
          method: 'POST'
        });
        
        if (activateResponse.status === 200) {
          console.log('✅ Reactivated successfully');
          
          // Step 3.4: Wait for webhook registration
          console.log('⏳ Waiting 5 seconds for webhook registration...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Step 3.5: Test each webhook path
          const testResults = [];
          
          for (const path of webhookPaths) {
            console.log(`\n🧪 Testing webhook path: /${path}`);
            
            const testResult = await testWebhook(path, {
              content: `TEST: This is a test document for webhook path ${path}`,
              type: "test",
              source: "webhook-registration-fix"
            });
            
            console.log(`   Status: ${testResult.statusCode}`);
            
            if (testResult.statusCode === 200) {
              console.log('   ✅ SUCCESS! Webhook is now working!');
              
              try {
                const responseData = JSON.parse(testResult.data);
                console.log(`   📊 Response: ${JSON.stringify(responseData).substring(0, 100)}...`);
              } catch (e) {
                console.log(`   📄 Response: ${testResult.data.substring(0, 100)}...`);
              }
              
              testResults.push({ path, status: 'working', statusCode: testResult.statusCode });
            } else if (testResult.statusCode === 404) {
              console.log('   ❌ Still returning 404 - webhook not registered');
              testResults.push({ path, status: 'not_registered', statusCode: testResult.statusCode });
            } else {
              console.log(`   ⚠️  Unexpected status: ${testResult.statusCode}`);
              testResults.push({ path, status: 'error', statusCode: testResult.statusCode });
            }
          }
          
          const workingPaths = testResults.filter(r => r.status === 'working').length;
          const totalPaths = testResults.length;
          
          results.push({
            workflow: workflow.name,
            id: workflow.id,
            status: 'reactivated',
            webhookPaths: webhookPaths,
            workingPaths: workingPaths,
            totalPaths: totalPaths,
            testResults: testResults
          });
          
        } else {
          console.log(`❌ Reactivation failed: ${activateResponse.status}`);
          console.log(`Details: ${activateResponse.raw}`);
          
          results.push({
            workflow: workflow.name,
            status: 'reactivation_failed',
            error: activateResponse.raw
          });
        }
        
      } catch (error) {
        console.log(`💥 Error fixing ${workflow.name}: ${error.message}`);
        results.push({
          workflow: workflow.name,
          status: 'error',
          error: error.message
        });
      }
    }

    // Step 4: Summary Report
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 WEBHOOK REGISTRATION FIX SUMMARY');
    console.log(`${'='.repeat(70)}`);
    
    const successful = results.filter(r => r.workingPaths > 0).length;
    const failed = results.filter(r => r.workingPaths === 0 && r.totalPaths > 0).length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`\n🎯 Results:`);
    console.log(`   ✅ Successfully Fixed: ${successful}`);
    console.log(`   ❌ Still Not Working: ${failed}`);
    console.log(`   💥 Errors: ${errors}`);
    
    console.log(`\n📋 Detailed Results:`);
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.workflow}`);
      
      if (result.workingPaths > 0) {
        console.log(`   ✅ Status: ${result.workingPaths}/${result.totalPaths} webhooks working`);
        result.testResults.forEach(test => {
          const icon = test.status === 'working' ? '✅' : '❌';
          console.log(`      ${icon} /${test.path} - ${test.statusCode}`);
        });
        
        // Show working URLs
        const workingPaths = result.testResults.filter(t => t.status === 'working');
        workingPaths.forEach(test => {
          console.log(`      🌐 ${N8N_BASE_URL}/webhook/${test.path} - OPERATIONAL`);
        });
        
      } else if (result.status === 'error') {
        console.log(`   💥 Error: ${result.error}`);
      } else {
        console.log(`   ❌ Status: ${result.status}`);
      }
    });
    
    // Working webhooks summary
    const allWorkingWebhooks = results
      .filter(r => r.testResults)
      .flatMap(r => r.testResults.filter(t => t.status === 'working'));
      
    if (allWorkingWebhooks.length > 0) {
      console.log(`\n🎉 WORKING WEBHOOKS (${allWorkingWebhooks.length} total):`);
      allWorkingWebhooks.forEach(webhook => {
        console.log(`   🔗 ${N8N_BASE_URL}/webhook/${webhook.path}`);
      });
      
      console.log(`\n🚀 Your AI document processing system is now operational!`);
      console.log(`📋 Usage: POST to any working webhook with {"content": "document text"}`);
    } else {
      console.log(`\n⚠️  No working webhooks found. Manual investigation may be required.`);
    }

    return {
      success: true,
      totalWorkflows: webhookWorkflows.length,
      workingWebhooks: allWorkingWebhooks.length,
      results: results
    };

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
        resolve({
          statusCode: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

if (require.main === module) {
  fixWebhookRegistration()
    .then(result => {
      if (result.success && result.workingWebhooks > 0) {
        console.log(`\n🎊 SUCCESS! Fixed ${result.workingWebhooks} webhook(s) out of ${result.totalWorkflows} workflow(s)`);
        process.exit(0);
      } else if (result.success) {
        console.log(`\n⚠️  Process completed but no working webhooks found`);
        process.exit(1);
      } else {
        console.log(`\n💔 Fix process failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}