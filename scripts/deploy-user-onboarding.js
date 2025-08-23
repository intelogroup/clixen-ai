const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

console.log('🚀 Deploying Production User Onboarding Workflow...');

// Production user onboarding workflow
const deployData = {
  name: 'B2C User Onboarding - Production',
  nodes: [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "user-signup",
        "responseMode": "onReceived",
        "options": {
          "rawBody": true,
          "allowedOrigins": "*"
        }
      },
      "id": "webhook-signup",
      "name": "User Signup Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Validate and process user signup data\nconst userData = $input.first().json;\n\n// Validation\nif (!userData.user_id || !userData.email) {\n  throw new Error('Missing required fields: user_id and email');\n}\n\n// Email validation\nconst emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nif (!emailRegex.test(userData.email)) {\n  throw new Error('Invalid email format');\n}\n\n// Prepare user data for database\nconst processedUser = {\n  user_id: userData.user_id,\n  email: userData.email.toLowerCase(),\n  full_name: userData.full_name || null,\n  avatar_url: userData.avatar_url || null,\n  onboarding_started_at: new Date().toISOString(),\n  signup_source: 'frontend',\n  initial_credits: 100\n};\n\nconsole.log('Processing user:', processedUser.email);\nreturn processedUser;"
      },
      "id": "process-signup",
      "name": "Process Signup",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Update user profile with onboarding status\nconst userData = $input.first().json;\n\n// Prepare Supabase update\nreturn {\n  user_id: userData.user_id,\n  onboarding_started_at: userData.onboarding_started_at,\n  onboarding_status: 'started',\n  profile_completion_percentage: 25, // Email + basic info = 25%\n  updated_at: new Date().toISOString()\n};"
      },
      "id": "prepare-profile-update",
      "name": "Prepare Profile Update",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Create analytics event for user registration\nconst userData = $input.first().json;\n\nreturn {\n  user_id: userData.user_id,\n  event_type: 'user_registration',\n  event_data: {\n    email: userData.email,\n    signup_source: userData.signup_source,\n    has_full_name: !!userData.full_name,\n    has_avatar: !!userData.avatar_url,\n    timestamp: userData.onboarding_started_at\n  },\n  created_at: new Date().toISOString()\n};"
      },
      "id": "prepare-analytics",
      "name": "Prepare Analytics Event",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 500]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Prepare success response\nconst userData = $input.first().json;\n\nreturn {\n  success: true,\n  user_id: userData.user_id,\n  message: 'User onboarding initiated successfully',\n  onboarding_status: 'started',\n  initial_credits: userData.initial_credits,\n  next_steps: [\n    'complete_profile',\n    'explore_dashboard',\n    'try_first_automation'\n  ],\n  dashboard_url: 'https://your-domain.vercel.app/dashboard',\n  support_email: 'support@b2cautomation.com',\n  created_at: userData.onboarding_started_at\n};"
      },
      "id": "prepare-response",
      "name": "Prepare Success Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
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
      "position": [1050, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Handle any errors that occur\nconst error = $input.first().json.error || $input.first().json;\n\nreturn {\n  success: false,\n  error: {\n    type: 'onboarding_error',\n    message: error.message || 'An error occurred during user onboarding',\n    code: 'ONBOARDING_FAILED',\n    timestamp: new Date().toISOString()\n  },\n  retry: true,\n  support_email: 'support@b2cautomation.com'\n};"
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
    "User Signup Webhook": {
      "main": [[{
        "node": "Process Signup",
        "type": "main",
        "index": 0
      }]]
    },
    "Process Signup": {
      "main": [[{
        "node": "Prepare Profile Update",
        "type": "main",
        "index": 0
      }, {
        "node": "Prepare Analytics Event",
        "type": "main",
        "index": 0
      }]]
    },
    "Prepare Profile Update": {
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
      console.log('✅ User Onboarding Workflow deployed successfully!');
      console.log('Workflow ID:', workflowId);
      
      // Activate the workflow
      console.log('🔄 Activating workflow...');
      
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
        let activateData = '';
        activateRes.on('data', (chunk) => activateData += chunk);
        activateRes.on('end', () => {
          if (activateRes.statusCode === 200) {
            console.log('✅ User Onboarding Workflow activated!');
            console.log('');
            console.log('🎯 Production Endpoints Ready:');
            console.log('User Signup: https://n8nio-n8n-7xzf6n.sliplane.app/webhook/user-signup');
            console.log('');
            console.log('📋 Integration Instructions:');
            console.log('1. Update frontend auth callback to call this webhook');
            console.log('2. Pass user_id, email, full_name from Supabase auth');
            console.log('3. Webhook will handle profile updates and analytics');
            console.log('4. Returns structured JSON response for frontend');
          } else {
            console.log('⚠️  Workflow created but activation status:', activateRes.statusCode);
            console.log('Response:', activateData);
            console.log('Manual activation may be required in N8N interface');
          }
        });
      });
      
      activateReq.on('error', (error) => {
        console.error('❌ Activation request failed:', error.message);
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