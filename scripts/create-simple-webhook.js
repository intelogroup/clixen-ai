const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

console.log('🚀 Creating Simple B2C Webhook Test...');

// Create a minimal functional workflow
const deployData = {
  name: 'B2C Simple Webhook Test',
  nodes: [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "b2c-test",
        "responseMode": "onReceived",
        "options": {
          "rawBody": true
        }
      },
      "id": "webhook-test",
      "name": "Webhook Test",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Simple B2C webhook handler\nconst data = $input.first().json;\n\nreturn {\n  success: true,\n  timestamp: new Date().toISOString(),\n  received: data,\n  message: 'B2C Platform webhook working!'\n};"
      },
      "id": "process-webhook",
      "name": "Process Request",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "id": "respond-webhook",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  connections: {
    "Webhook Test": {
      "main": [[{
        "node": "Process Request",
        "type": "main",
        "index": 0
      }]]
    },
    "Process Request": {
      "main": [[{
        "node": "Respond",
        "type": "main", 
        "index": 0
      }]]
    }
  },
  settings: {
    "executionOrder": "v1"
  },
  staticData: {}
};

const postData = JSON.stringify(deployData);

const options = {
  hostname: 'n8nio-n8n-7xzf6n.sliplane.app',
  port: 443,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 201 || res.statusCode === 200) {
      const response = JSON.parse(data);
      const workflowId = response.id;
      console.log('✅ B2C Webhook Test deployed successfully!');
      console.log('Workflow ID:', workflowId);
      
      // Now activate the workflow
      console.log('🔄 Activating workflow...');
      const activateData = JSON.stringify({ active: true });
      
      const activateOptions = {
        hostname: 'n8nio-n8n-7xzf6n.sliplane.app',
        port: 443,
        path: `/api/v1/workflows/${workflowId}`,
        method: 'PATCH',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(activateData)
        }
      };
      
      const activateReq = https.request(activateOptions, (activateRes) => {
        let activateResponseData = '';
        activateRes.on('data', (chunk) => activateResponseData += chunk);
        activateRes.on('end', () => {
          if (activateRes.statusCode === 200) {
            console.log('✅ Workflow activated successfully!');
            console.log('');
            console.log('🎯 Test your B2C webhook:');
            console.log('curl -X POST https://n8nio-n8n-7xzf6n.sliplane.app/webhook/b2c-test \\');
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"message": "Hello B2C Platform"}\' ');
            console.log('');
            console.log('Expected response: JSON with success=true and timestamp');
          } else {
            console.log('❌ Failed to activate workflow:', activateResponseData);
          }
        });
      });
      
      activateReq.on('error', (error) => {
        console.error('❌ Activation request failed:', error.message);
      });
      
      activateReq.write(activateData);
      activateReq.end();
      
    } else {
      console.log('❌ Deployment failed:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();