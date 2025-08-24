/**
 * Setup Missing N8N Webhooks
 * Creates the webhook endpoints that are showing as "not registered" in the logs
 */

const https = require('https');

const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = process.env.N8N_API_KEY || 'your_api_key_here';

// Basic webhook workflow template
const createWebhookWorkflow = (webhookName, description) => ({
  name: webhookName,
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: webhookName,
        responseMode: 'onReceived',
        options: {}
      },
      id: 'webhook-trigger',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [300, 300],
      webhookId: webhookName
    },
    {
      parameters: {
        values: {
          string: [
            {
              name: 'status',
              value: 'success'
            },
            {
              name: 'message',
              value: `${description} processed successfully`
            },
            {
              name: 'timestamp',
              value: '{{ $now }}'
            }
          ]
        }
      },
      id: 'set-response',
      name: 'Set Response',
      type: 'n8n-nodes-base.set',
      typeVersion: 1,
      position: [520, 300]
    }
  ],
  connections: {
    'Webhook': {
      main: [
        [
          {
            node: 'Set Response',
            type: 'main',
            index: 0
          }
        ]
      ]
    }
  },
  settings: {
    timezone: 'America/New_York'
  }
});

const webhooks = [
  {
    name: 'test-ai-processor',
    description: 'AI Processing Test Webhook'
  },
  {
    name: 'clean-ai-pipeline',
    description: 'Clean AI Pipeline Webhook'
  },
  {
    name: 'webhook-test',
    description: 'General Webhook Test'
  },
  {
    name: 'test',
    description: 'Basic Test Webhook'
  }
];

async function createWorkflow(webhook) {
  const workflow = createWebhookWorkflow(webhook.name, webhook.description);
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(workflow);
    
    const options = {
      hostname: 'n8nio-n8n-7xzf6n.sliplane.app',
      port: 443,
      path: '/api/v1/workflows',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-N8N-API-KEY': N8N_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Created webhook: ${webhook.name}`);
          resolve(JSON.parse(body));
        } else {
          console.error(`❌ Failed to create ${webhook.name}:`, res.statusCode, body);
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Request error for ${webhook.name}:`, err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

async function setupAllWebhooks() {
  console.log('🚀 Setting up missing n8n webhooks...\n');
  
  for (const webhook of webhooks) {
    try {
      await createWorkflow(webhook);
      console.log(`   URL: ${N8N_BASE_URL}/webhook/${webhook.name}\n`);
    } catch (error) {
      console.error(`Failed to create ${webhook.name}:`, error.message);
    }
  }
  
  console.log('✨ Webhook setup complete!');
  console.log('\n📋 Created webhook endpoints:');
  webhooks.forEach(webhook => {
    console.log(`   • POST ${N8N_BASE_URL}/webhook/${webhook.name}`);
  });
}

// Run the setup
if (require.main === module) {
  setupAllWebhooks().catch(console.error);
}

module.exports = { createWebhookWorkflow, setupAllWebhooks };