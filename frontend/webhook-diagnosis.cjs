#!/usr/bin/env node

/**
 * Webhook Diagnosis Tool
 * Comprehensive analysis of webhook registration issues
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

async function diagnoseWebhooks() {
  console.log('🔍 WEBHOOK DIAGNOSIS TOOL');
  console.log('========================');
  console.log('Analyzing webhook registration issues in n8n\n');

  try {
    // Get all workflows
    console.log('📊 Fetching all workflows...');
    const workflowsResponse = await n8nRequest('/workflows');
    
    if (workflowsResponse.status !== 200) {
      throw new Error(`Cannot fetch workflows: ${workflowsResponse.status}`);
    }
    
    const workflows = workflowsResponse.data.data || [];
    console.log(`Found ${workflows.length} workflows\n`);
    
    // Find webhook workflows
    const webhookWorkflows = [];
    
    for (const workflow of workflows) {
      if (workflow.active && workflow.nodes) {
        const hasWebhook = workflow.nodes.some(node => 
          node.type === 'n8n-nodes-base.webhook'
        );
        
        if (hasWebhook) {
          webhookWorkflows.push(workflow);
        }
      }
    }
    
    console.log(`🔗 Found ${webhookWorkflows.length} webhook workflows:`);
    
    for (let i = 0; i < webhookWorkflows.length; i++) {
      const wf = webhookWorkflows[i];
      console.log(`${i + 1}. ${wf.name} (${wf.id})`);
      console.log(`   Active: ${wf.active ? '✅' : '❌'}`);
      console.log(`   Created: ${wf.createdAt}`);
      console.log(`   Updated: ${wf.updatedAt}`);
      
      // Find webhook nodes
      const webhookNodes = wf.nodes.filter(node => node.type === 'n8n-nodes-base.webhook');
      
      webhookNodes.forEach((node, idx) => {
        console.log(`   Webhook ${idx + 1}: ${node.name}`);
        console.log(`     Path: ${node.parameters?.path || 'undefined'}`);
        console.log(`     Type Version: ${node.typeVersion}`);
        console.log(`     Response Mode: ${node.parameters?.responseMode || 'default'}`);
      });
      
      console.log('');
    }
    
    // Test webhook endpoints
    console.log('🧪 TESTING WEBHOOK ENDPOINTS');
    console.log('============================');
    
    const testPaths = [
      'test-ai-processor',
      'clean-ai-pipeline', 
      'webhook-test',
      'test'
    ];
    
    for (const path of testPaths) {
      console.log(`\nTesting: /webhook/${path}`);
      
      try {
        const testData = { content: 'Webhook diagnosis test', type: 'test' };
        const webhookUrl = `${N8N_BASE_URL}/webhook/${path}`;
        
        const result = await testWebhookEndpoint(webhookUrl, testData);
        
        console.log(`  Status: ${result.statusCode}`);
        
        if (result.statusCode === 200) {
          console.log(`  🎉 SUCCESS - Webhook is working!`);
          console.log(`  Response: ${result.data.substring(0, 100)}...`);
        } else if (result.statusCode === 404) {
          console.log(`  ❌ Not Found - Webhook not registered`);
        } else {
          console.log(`  ⚠️  Status: ${result.statusCode}`);
          console.log(`  Response: ${result.data.substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`  💥 Error: ${error.message}`);
      }
    }
    
    // Check executions
    console.log('\n📈 CHECKING RECENT EXECUTIONS');
    console.log('=============================');
    
    const executionsResponse = await n8nRequest('/executions?limit=20');
    
    if (executionsResponse.status === 200) {
      const executions = executionsResponse.data.data || [];
      console.log(`Found ${executions.length} recent executions`);
      
      const webhookExecutions = executions.filter(exec => 
        exec.mode === 'webhook' || exec.workflowData?.name?.includes('Webhook')
      );
      
      console.log(`Webhook executions: ${webhookExecutions.length}`);
      
      webhookExecutions.slice(0, 5).forEach((exec, i) => {
        console.log(`${i + 1}. ${exec.workflowData?.name || 'Unknown'}`);
        console.log(`   Status: ${exec.finished ? '✅' : '🔄'} ${exec.status || 'unknown'}`);
        console.log(`   Mode: ${exec.mode}`);
        console.log(`   Started: ${exec.startedAt}`);
        console.log('');
      });
    }
    
    // Environment diagnosis
    console.log('🔧 ENVIRONMENT DIAGNOSIS');
    console.log('========================');
    
    console.log('Expected environment variables for webhook functionality:');
    console.log('✓ WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/');
    console.log('✓ N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app');
    console.log('✓ N8N_PROTOCOL=https');
    console.log('✓ N8N_TRUST_PROXY_HEADERS=true (CRITICAL for Sliplane)');
    
    console.log('\nWebhook registration process:');
    console.log('1. Workflow with webhook node gets activated');
    console.log('2. n8n registers webhook URL internally');
    console.log('3. External requests to /webhook/{path} should route to workflow');
    console.log('4. Response returned via respondToWebhook node');
    
    // Final recommendations
    console.log('\n💡 TROUBLESHOOTING RECOMMENDATIONS');
    console.log('==================================');
    
    if (webhookWorkflows.length === 0) {
      console.log('❌ No webhook workflows found - create webhook workflow first');
    } else if (!webhookWorkflows.some(wf => wf.active)) {
      console.log('❌ Webhook workflows exist but not active - activate them');
    } else {
      console.log('✅ Active webhook workflows found');
      console.log('\nPossible issues:');
      console.log('1. 🔧 Trust proxy headers not configured (add N8N_TRUST_PROXY_HEADERS=true)');
      console.log('2. 🔗 Webhook URL environment variable incorrect');
      console.log('3. 🌐 Sliplane reverse proxy configuration');
      console.log('4. ⏱️  Webhook registration delay (wait after activation)');
      console.log('5. 🔄 Container restart needed after env var changes');
      
      console.log('\nRecommended next steps:');
      console.log('1. Verify N8N_TRUST_PROXY_HEADERS=true is set');
      console.log('2. Restart n8n container completely');
      console.log('3. Wait 60 seconds after restart');
      console.log('4. Test webhook endpoints again');
      console.log('5. Check logs for webhook registration messages');
    }
    
    return {
      success: true,
      totalWorkflows: workflows.length,
      webhookWorkflows: webhookWorkflows.length,
      activeWebhookWorkflows: webhookWorkflows.filter(wf => wf.active).length
    };
    
  } catch (error) {
    console.error('\n💥 Diagnosis failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWebhookEndpoint(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
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
  diagnoseWebhooks()
    .then(result => {
      console.log(`\n📋 DIAGNOSIS COMPLETE`);
      if (result.success) {
        console.log(`✅ Found ${result.activeWebhookWorkflows}/${result.webhookWorkflows} active webhook workflows`);
        if (result.activeWebhookWorkflows > 0) {
          console.log('🔧 Focus on environment configuration and container restart');
        } else {
          console.log('⚡ Focus on activating webhook workflows first');
        }
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}