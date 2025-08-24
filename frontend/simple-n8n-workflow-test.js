#!/usr/bin/env node

/**
 * Simple n8n Workflow Test
 */

import https from 'https';

const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

console.log('🧪 Simple n8n Workflow Test Starting...');

// Test n8n API connection
async function testConnection() {
  return new Promise((resolve) => {
    const req = https.request(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ n8n API connection successful');
        console.log(`Status: ${res.statusCode}`);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ n8n API connection failed:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

// Create simple test workflow
async function createSimpleWorkflow() {
  console.log('🔨 Creating simple test workflow...');
  
  const simpleWorkflow = {
    name: '[TEST] Simple Manual Trigger',
    nodes: [
      {
        parameters: {},
        id: 'manual-trigger',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          values: {
            string: [
              {
                name: 'message',
                value: 'Hello from n8n workflow test!'
              },
              {
                name: 'timestamp',
                value: '={{ $now }}'
              }
            ]
          },
          options: {}
        },
        id: 'set-data',
        name: 'Set Data',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [460, 300]
      }
    ],
    connections: {
      'Manual Trigger': {
        main: [
          [
            {
              node: 'Set Data',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    },
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true
    }
  };
  
  return new Promise((resolve) => {
    const data = JSON.stringify(simpleWorkflow);
    
    const req = https.request(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          const workflow = JSON.parse(responseData);
          console.log('✅ Workflow created successfully!');
          console.log(`Workflow ID: ${workflow.id}`);
          resolve({ success: true, workflowId: workflow.id });
        } else {
          console.log('❌ Failed to create workflow');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response: ${responseData}`);
          resolve({ success: false, error: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('💥 Error creating workflow:', error.message);
      resolve({ success: false, error: error.message });
    });
    
    req.write(data);
    req.end();
  });
}

// Test manual execution
async function executeWorkflow(workflowId) {
  console.log(`🚀 Executing workflow ${workflowId}...`);
  
  return new Promise((resolve) => {
    const req = https.request(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('✅ Workflow execution started!');
          const result = JSON.parse(data);
          console.log(`Execution ID: ${result.executionId || 'unknown'}`);
          resolve({ success: true, executionId: result.executionId });
        } else {
          console.log('❌ Failed to execute workflow');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response: ${data}`);
          resolve({ success: false, error: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('💥 Error executing workflow:', error.message);
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Main test
async function runTest() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without API connection');
      return;
    }
    
    const createResult = await createSimpleWorkflow();
    if (!createResult.success) {
      console.log('❌ Cannot proceed without workflow creation');
      return;
    }
    
    const executeResult = await executeWorkflow(createResult.workflowId);
    
    console.log('\n📊 Test Results:');
    console.log(`  API Connection: ✅`);
    console.log(`  Workflow Creation: ${createResult.success ? '✅' : '❌'}`);
    console.log(`  Workflow Execution: ${executeResult.success ? '✅' : '❌'}`);
    
    if (createResult.workflowId) {
      console.log(`\n🔗 Workflow URL: ${N8N_BASE_URL}/workflow/${createResult.workflowId}`);
    }
    
    console.log('\n🎉 Simple test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

runTest();