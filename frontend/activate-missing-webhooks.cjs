/**
 * Activate Missing N8N Webhooks
 * Activates the webhook workflows that were just created
 */

const https = require('https');

const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = process.env.N8N_API_KEY || 'your_api_key_here';

const webhookNames = [
  'test-ai-processor',
  'clean-ai-pipeline', 
  'webhook-test',
  'test'
];

async function getWorkflows() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'n8nio-n8n-7xzf6n.sliplane.app',
      port: 443,
      path: '/api/v1/workflows',
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function activateWorkflow(workflowId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'n8nio-n8n-7xzf6n.sliplane.app',
      port: 443,
      path: `/api/v1/workflows/${workflowId}/activate`,
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function activateAllWebhooks() {
  console.log('🔍 Finding webhook workflows to activate...\n');
  
  try {
    const workflows = await getWorkflows();
    console.log(`Found ${workflows.data.length} total workflows`);
    
    const webhookWorkflows = workflows.data.filter(wf => 
      webhookNames.includes(wf.name)
    );
    
    console.log(`Found ${webhookWorkflows.length} webhook workflows to activate:\n`);
    
    for (const workflow of webhookWorkflows) {
      try {
        console.log(`🔄 Activating: ${workflow.name} (ID: ${workflow.id})`);
        await activateWorkflow(workflow.id);
        console.log(`✅ Activated: ${workflow.name}\n`);
      } catch (error) {
        console.error(`❌ Failed to activate ${workflow.name}:`, error.message);
      }
    }
    
    console.log('✨ Activation complete!');
    console.log('\n📋 Active webhook endpoints:');
    webhookWorkflows.forEach(wf => {
      console.log(`   • POST ${N8N_BASE_URL}/webhook/${wf.name}`);
    });
    
  } catch (error) {
    console.error('Failed to get workflows:', error.message);
  }
}

// Run the activation
if (require.main === module) {
  activateAllWebhooks().catch(console.error);
}

module.exports = { activateAllWebhooks };