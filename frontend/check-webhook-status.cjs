#!/usr/bin/env node

/**
 * Check Webhook Status and Fix Path Issues
 */

const https = require('https');

const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTEzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
  
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

async function testWebhookDirect(path, testData) {
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
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function checkWebhookStatus() {
  console.log('🔍 CHECKING WEBHOOK STATUS & WORKFLOW CONFIGURATION');
  console.log('==================================================\n');

  try {
    // Step 1: List all workflows
    console.log('📋 Fetching all workflows...');
    const listResponse = await n8nRequest('/workflows');
    
    if (listResponse.status === 200) {
      const workflows = listResponse.data.data || [];
      console.log(`Found ${workflows.length} workflows:\n`);
      
      workflows.forEach((wf, i) => {
        console.log(`${i + 1}. ${wf.name} (${wf.id})`);
        console.log(`   Active: ${wf.active ? '✅' : '❌'}`);
        console.log(`   Created: ${wf.createdAt}`);
        console.log(`   Nodes: ${wf.nodes?.length || 0}`);
        
        // Check for webhook nodes
        const webhookNodes = wf.nodes?.filter(n => n.type === 'n8n-nodes-base.webhook') || [];
        if (webhookNodes.length > 0) {
          webhookNodes.forEach(node => {
            console.log(`   🔗 Webhook: /${node.parameters?.path || 'undefined'}`);
          });
        }
        console.log('');
      });

      // Find active workflows with webhooks
      const activeWebhookWorkflows = workflows.filter(wf => 
        wf.active && wf.nodes?.some(n => n.type === 'n8n-nodes-base.webhook')
      );

      console.log(`\n🎯 Found ${activeWebhookWorkflows.length} active webhook workflows`);

      if (activeWebhookWorkflows.length > 0) {
        for (const workflow of activeWebhookWorkflows) {
          console.log(`\n📊 Testing workflow: ${workflow.name}`);
          
          const webhookNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
          
          for (const webhookNode of webhookNodes) {
            const webhookPath = webhookNode.parameters?.path;
            
            if (webhookPath) {
              console.log(`\n🧪 Testing webhook path: /${webhookPath}`);
              
              try {
                const testResponse = await testWebhookDirect(webhookPath, {
                  content: "Simple test document for webhook verification",
                  type: "test",
                  source: "webhook-checker"
                });
                
                console.log(`   Status: ${testResponse.statusCode}`);
                console.log(`   Response Length: ${testResponse.data?.length || 0} bytes`);
                
                if (testResponse.statusCode === 200) {
                  console.log('   ✅ Webhook is responding correctly!');
                  
                  try {
                    const responseJson = JSON.parse(testResponse.data);
                    console.log('   📊 Response Data Available:');
                    if (responseJson.documentId) console.log(`     - Document ID: ${responseJson.documentId}`);
                    if (responseJson.classification) console.log(`     - Classification: ${responseJson.classification.category}`);
                    if (responseJson.status) console.log(`     - Status: ${responseJson.status}`);
                  } catch (e) {
                    console.log('   📄 Response received (not JSON)');
                  }
                  
                  // Test with more complex data
                  console.log('\n🔬 Testing with complex document...');
                  const complexTest = await testWebhookDirect(webhookPath, {
                    content: "INVOICE #2025-TEST\nFrom: Test Company\nTo: Client Corp\nAmount: $1,500.00\nDue: 2025-09-01",
                    type: "invoice",
                    source: "test-suite",
                    priority: "medium"
                  });
                  
                  console.log(`   Complex Test Status: ${complexTest.statusCode}`);
                  if (complexTest.statusCode === 200) {
                    try {
                      const complexJson = JSON.parse(complexTest.data);
                      console.log('   🎯 Complex Analysis Results:');
                      if (complexJson.classification?.category) {
                        console.log(`     - Detected Type: ${complexJson.classification.category}`);
                      }
                      if (complexJson.classification?.confidence) {
                        console.log(`     - Confidence: ${(complexJson.classification.confidence * 100).toFixed(1)}%`);
                      }
                      if (complexJson.metadata?.processingTime) {
                        console.log(`     - Processing Time: ${complexJson.metadata.processingTime}ms`);
                      }
                    } catch (e) {
                      console.log('     ✅ Complex processing completed');
                    }
                  }
                  
                } else if (testResponse.statusCode === 404) {
                  console.log('   ❌ Webhook path not found (404)');
                  console.log(`   🔗 Expected URL: ${N8N_BASE_URL}/webhook/${webhookPath}`);
                } else {
                  console.log(`   ⚠️  Unexpected status: ${testResponse.statusCode}`);
                  if (testResponse.data) {
                    console.log(`   Response preview: ${testResponse.data.substring(0, 100)}`);
                  }
                }
              } catch (error) {
                console.log(`   💥 Test failed: ${error.message}`);
              }
            } else {
              console.log('   ⚠️  No webhook path configured');
            }
          }
        }
      } else {
        console.log('\n❌ No active webhook workflows found');
        console.log('\n🔧 Checking if workflows need activation...');
        
        const inactiveWebhookWorkflows = workflows.filter(wf => 
          !wf.active && wf.nodes?.some(n => n.type === 'n8n-nodes-base.webhook')
        );
        
        if (inactiveWebhookWorkflows.length > 0) {
          console.log(`Found ${inactiveWebhookWorkflows.length} inactive webhook workflows`);
          
          for (const workflow of inactiveWebhookWorkflows) {
            console.log(`\n⚡ Attempting to activate: ${workflow.name}`);
            
            try {
              const activateResponse = await n8nRequest(`/workflows/${workflow.id}/activate`, {
                method: 'POST'
              });
              
              if (activateResponse.status === 200) {
                console.log('   ✅ Workflow activated successfully!');
                
                const webhookNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
                webhookNodes.forEach(node => {
                  const path = node.parameters?.path;
                  if (path) {
                    console.log(`   🔗 Webhook now available: ${N8N_BASE_URL}/webhook/${path}`);
                  }
                });
              } else {
                console.log(`   ❌ Activation failed: ${activateResponse.status}`);
                if (activateResponse.raw) {
                  console.log(`   Details: ${activateResponse.raw}`);
                }
              }
            } catch (error) {
              console.log(`   💥 Activation error: ${error.message}`);
            }
          }
        }
      }

    } else {
      console.log(`❌ Failed to list workflows: ${listResponse.status}`);
      if (listResponse.raw) {
        console.log(`Details: ${listResponse.raw}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 WEBHOOK STATUS CHECK COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 Check failed:', error.message);
  }
}

if (require.main === module) {
  checkWebhookStatus().catch(console.error);
}