const https = require('https');
const fs = require('fs');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

console.log('🚀 Deploying User Onboarding Workflow to Sliplane...');

// Read the workflow file
const workflowPath = '../workflows/user-onboarding-workflow.json';
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow file not found');
  process.exit(1);
}

const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Prepare deployment payload
const deployData = {
  name: 'B2C User Onboarding Workflow',
  nodes: workflowData.nodes,
  connections: workflowData.connections || {},
  settings: workflowData.settings || {},
  staticData: workflowData.staticData || {},
  active: true,
  tags: ['b2c-platform', 'production', 'user-onboarding']
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
      console.log('✅ User Onboarding Workflow deployed successfully!');
      console.log('Workflow ID:', response.data.id);
      console.log('Webhook URL: https://n8nio-n8n-7xzf6n.sliplane.app/webhook/api/user/signup');
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