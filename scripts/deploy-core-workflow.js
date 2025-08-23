const https = require('https');
const fs = require('fs');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

console.log('🚀 Deploying Customer Support Workflow to Sliplane...');

// Read the workflow file
const workflowPath = '../workflows/core/01-customer-support-agent.json';
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow file not found');
  process.exit(1);
}

const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Prepare deployment payload  
const deployData = {
  name: 'B2C Customer Support Agent',
  nodes: workflowData.nodes,
  connections: workflowData.connections || {},
  tags: ['b2c-platform', 'customer-support', 'ai-agent']
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
      const workflowId = response.data.id;
      console.log('✅ Customer Support Agent deployed successfully!');
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
            console.log('Webhook URL: https://n8nio-n8n-7xzf6n.sliplane.app/webhook/customer-support');
            console.log('');
            console.log('🎯 This workflow provides:');
            console.log('- AI-powered customer support responses');
            console.log('- Integration with knowledge base');
            console.log('- Web search capabilities for latest information');
            console.log('- Structured JSON responses for frontend integration');
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