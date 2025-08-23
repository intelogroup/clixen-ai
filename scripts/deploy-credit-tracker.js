const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

console.log('🚀 Deploying Credit Usage Tracker...');

const deployData = {
  name: 'B2C Credit Usage Tracker',
  nodes: [
    {
      "parameters": {
        "httpMethod": "POST", 
        "path": "credits/consume",
        "responseMode": "onReceived",
        "options": {
          "rawBody": true,
          "allowedOrigins": "*"
        }
      },
      "id": "webhook-credits",
      "name": "Credit Consumption Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Validate credit consumption request\nconst request = $input.first().json;\n\n// Validation\nif (!request.user_id) {\n  throw new Error('Missing required field: user_id');\n}\n\nif (!request.credits_to_consume || request.credits_to_consume < 1) {\n  throw new Error('Invalid credits_to_consume value');\n}\n\nif (request.credits_to_consume > 1000) {\n  throw new Error('Maximum 1000 credits per operation');\n}\n\n// Prepare consumption data\nconst consumption = {\n  user_id: request.user_id,\n  credits_to_consume: parseInt(request.credits_to_consume),\n  service_type: request.service_type || 'general',\n  operation_id: request.operation_id || null,\n  metadata: request.metadata || {},\n  timestamp: new Date().toISOString()\n};\n\nconsole.log(`Processing credit consumption: ${consumption.credits_to_consume} credits for user ${consumption.user_id}`);\nreturn consumption;"
      },
      "id": "validate-consumption",
      "name": "Validate Consumption",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Check if user has sufficient credits (simulation)\nconst consumption = $input.first().json;\n\n// In a real implementation, this would query Supabase\n// For now, simulate credit checking\nconst simulatedUserCredits = 98; // This would come from database\n\nif (simulatedUserCredits < consumption.credits_to_consume) {\n  throw new Error(`Insufficient credits. Available: ${simulatedUserCredits}, Required: ${consumption.credits_to_consume}`);\n}\n\n// Calculate new balance\nconst newBalance = simulatedUserCredits - consumption.credits_to_consume;\n\nreturn {\n  ...consumption,\n  previous_balance: simulatedUserCredits,\n  new_balance: newBalance,\n  consumption_approved: true\n};"
      },
      "id": "check-balance",
      "name": "Check Credit Balance",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Log credit transaction\nconst transaction = $input.first().json;\n\nreturn {\n  user_id: transaction.user_id,\n  transaction_type: 'consumption',\n  credits_amount: transaction.credits_to_consume,\n  service_type: transaction.service_type,\n  operation_id: transaction.operation_id,\n  previous_balance: transaction.previous_balance,\n  new_balance: transaction.new_balance,\n  metadata: {\n    ...transaction.metadata,\n    processed_at: transaction.timestamp,\n    processing_node: 'credit-tracker'\n  },\n  created_at: new Date().toISOString()\n};"
      },
      "id": "log-transaction",
      "name": "Log Transaction",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Create usage metrics entry\nconst transaction = $input.first().json;\n\nreturn {\n  user_id: transaction.user_id,\n  service_type: transaction.service_type,\n  credits_used: transaction.credits_amount,\n  execution_id: transaction.operation_id,\n  timestamp: transaction.created_at,\n  metadata: {\n    transaction_id: `tx_${Date.now()}`,\n    processing_time: new Date().toISOString()\n  }\n};"
      },
      "id": "create-metrics",
      "name": "Create Usage Metrics",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 500]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Prepare success response\nconst transaction = $input.first().json;\n\n// Check if low balance warning needed\nconst lowBalanceWarning = transaction.new_balance < 20;\nconst criticalBalance = transaction.new_balance < 5;\n\nconst response = {\n  success: true,\n  transaction_id: `tx_${Date.now()}`,\n  user_id: transaction.user_id,\n  credits_consumed: transaction.credits_amount,\n  remaining_balance: transaction.new_balance,\n  service_type: transaction.service_type,\n  timestamp: transaction.created_at\n};\n\nif (criticalBalance) {\n  response.warning = {\n    type: 'critical_balance',\n    message: 'Critical: Only 5 credits remaining. Please upgrade your plan.',\n    action_required: true,\n    upgrade_url: 'https://your-domain.vercel.app/upgrade'\n  };\n} else if (lowBalanceWarning) {\n  response.warning = {\n    type: 'low_balance', \n    message: 'Low balance: Consider upgrading your plan soon.',\n    action_required: false,\n    upgrade_url: 'https://your-domain.vercel.app/upgrade'\n  };\n}\n\nreturn response;"
      },
      "id": "prepare-success",
      "name": "Prepare Success Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "id": "success-response",
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Handle consumption errors\nconst error = $input.first().json.error || $input.first().json;\n\nreturn {\n  success: false,\n  error: {\n    type: 'credit_consumption_error',\n    message: error.message || 'Credit consumption failed',\n    code: 'CONSUMPTION_FAILED',\n    timestamp: new Date().toISOString()\n  },\n  retry: false,\n  support_email: 'support@b2cautomation.com'\n};"
      },
      "id": "handle-error",
      "name": "Handle Error",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 500]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "responseCode": 400,
        "options": {}
      },
      "id": "error-response",
      "name": "Error Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 650]
    }
  ],
  connections: {
    "Credit Consumption Webhook": {
      "main": [[{
        "node": "Validate Consumption",
        "type": "main",
        "index": 0
      }]]
    },
    "Validate Consumption": {
      "main": [[{
        "node": "Check Credit Balance",
        "type": "main",
        "index": 0
      }]]
    },
    "Check Credit Balance": {
      "main": [[{
        "node": "Log Transaction",
        "type": "main",
        "index": 0
      }, {
        "node": "Create Usage Metrics",
        "type": "main",
        "index": 0
      }]]
    },
    "Log Transaction": {
      "main": [[{
        "node": "Prepare Success Response",
        "type": "main",
        "index": 0
      }]]
    },
    "Prepare Success Response": {
      "main": [[{
        "node": "Success Response",
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
      console.log('✅ Credit Usage Tracker deployed successfully!');
      console.log('Workflow ID:', workflowId);
      
      // Activate workflow
      const activateOptions = {
        hostname: 'n8nio-n8n-7xzf6n.sliplane.app',
        port: 443,
        path: `/api/v1/workflows/${workflowId}/activate`,
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      };
      
      const activateReq = https.request(activateOptions, (activateRes) => {
        if (activateRes.statusCode === 200) {
          console.log('✅ Credit Usage Tracker activated!');
          console.log('Endpoint: https://n8nio-n8n-7xzf6n.sliplane.app/webhook/credits/consume');
        }
        activateRes.on('data', () => {});
        activateRes.on('end', () => {});
      });
      
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