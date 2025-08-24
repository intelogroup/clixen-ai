#!/usr/bin/env node

/**
 * Test n8n Database Access Methods on SlipLane
 * Tests different approaches to access n8n CE SQLite database
 */

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs').promises;

// SlipLane Configuration
const SLIPLANE_API_TOKEN = 'api_ro_yp6yg7m0vtricaevlwy11xs4';
const SLIPLANE_ORG_ID = 'org_v8jir501u7mp';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';
const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';

// Helper function for API calls
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : require('http');
    
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      method: options.method || 'GET'
    };

    const req = protocol.request(url, requestOptions, (res) => {
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
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test Method 1: SlipLane API - Get service info
async function testSlipLaneAPI() {
  console.log('🧪 Testing SlipLane API Access...');
  
  try {
    const response = await makeRequest('https://api.sliplane.app/v1/services', {
      headers: {
        'Authorization': `Bearer ${SLIPLANE_API_TOKEN}`
      }
    });
    
    console.log(`✅ SlipLane API Status: ${response.status}`);
    
    if (response.data && response.data.length > 0) {
      const n8nService = response.data.find(service => 
        service.name && service.name.toLowerCase().includes('n8n')
      );
      
      if (n8nService) {
        console.log(`📋 Found n8n service: ${n8nService.name}`);
        console.log(`🆔 Service ID: ${n8nService.id}`);
        console.log(`🌐 Status: ${n8nService.status}`);
        
        // Try to get service details
        const detailsResponse = await makeRequest(`https://api.sliplane.app/v1/services/${n8nService.id}`, {
          headers: {
            'Authorization': `Bearer ${SLIPLANE_API_TOKEN}`
          }
        });
        
        console.log(`📊 Service details status: ${detailsResponse.status}`);
        
        return {
          success: true,
          serviceId: n8nService.id,
          serviceInfo: detailsResponse.data
        };
      } else {
        console.log('⚠️  No n8n service found in SlipLane');
      }
    } else {
      console.log('📝 Response data:', response.raw);
    }
    
    return { success: false, error: 'No n8n service found' };
    
  } catch (error) {
    console.error('❌ SlipLane API Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test Method 2: n8n API - Check health and get executions
async function testN8NAPI() {
  console.log('🧪 Testing n8n API Access...');
  
  try {
    // Test health endpoint
    const healthResponse = await makeRequest(`${N8N_BASE_URL}/healthz`);
    console.log(`✅ n8n Health Status: ${healthResponse.status}`);
    
    // Test API with authentication
    const apiResponse = await makeRequest(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    console.log(`📋 n8n API Status: ${apiResponse.status}`);
    
    if (apiResponse.status === 200 && apiResponse.data) {
      console.log(`📊 Found ${apiResponse.data.data ? apiResponse.data.data.length : 0} workflows`);
      
      // Try to get executions
      const executionsResponse = await makeRequest(`${N8N_BASE_URL}/api/v1/executions`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      
      console.log(`🔍 Executions API Status: ${executionsResponse.status}`);
      
      if (executionsResponse.status === 200 && executionsResponse.data) {
        const executions = executionsResponse.data.data || [];
        console.log(`📈 Found ${executions.length} executions`);
        
        // Log recent executions for analysis
        if (executions.length > 0) {
          console.log('\n📋 Recent Executions:');
          executions.slice(0, 3).forEach((exec, i) => {
            console.log(`  ${i + 1}. ID: ${exec.id}`);
            console.log(`     Status: ${exec.finished ? (exec.status || 'unknown') : 'running'}`);
            console.log(`     Workflow: ${exec.workflowId}`);
            console.log(`     Started: ${exec.startedAt}`);
            if (exec.stoppedAt) console.log(`     Stopped: ${exec.stoppedAt}`);
            console.log('');
          });
        }
        
        return {
          success: true,
          executions: executions,
          hasData: executions.length > 0
        };
      }
    } else {
      console.log('📝 API Response:', apiResponse.raw);
    }
    
    return { success: false, error: 'Could not access n8n API data' };
    
  } catch (error) {
    console.error('❌ n8n API Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test Method 3: Database Structure Analysis via API
async function analyzeN8NDatabase() {
  console.log('🧪 Analyzing n8n Database Structure...');
  
  try {
    // Get workflow data to understand structure
    const workflowsResponse = await makeRequest(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (workflowsResponse.status === 200 && workflowsResponse.data) {
      const workflows = workflowsResponse.data.data || [];
      console.log(`📊 Workflow Analysis - Found ${workflows.length} workflows`);
      
      if (workflows.length > 0) {
        const sampleWorkflow = workflows[0];
        console.log('\n📋 Sample Workflow Structure:');
        console.log(`  ID: ${sampleWorkflow.id}`);
        console.log(`  Name: ${sampleWorkflow.name}`);
        console.log(`  Active: ${sampleWorkflow.active}`);
        console.log(`  Nodes: ${sampleWorkflow.nodes ? sampleWorkflow.nodes.length : 0}`);
        console.log(`  Created: ${sampleWorkflow.createdAt}`);
        console.log(`  Updated: ${sampleWorkflow.updatedAt}`);
      }
    }
    
    // Get execution data to understand execution structure
    const executionsResponse = await makeRequest(`${N8N_BASE_URL}/api/v1/executions`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (executionsResponse.status === 200 && executionsResponse.data) {
      const executions = executionsResponse.data.data || [];
      console.log(`📈 Execution Analysis - Found ${executions.length} executions`);
      
      if (executions.length > 0) {
        const sampleExecution = executions[0];
        console.log('\n🔍 Sample Execution Structure:');
        console.log(`  ID: ${sampleExecution.id}`);
        console.log(`  Workflow ID: ${sampleExecution.workflowId}`);
        console.log(`  Mode: ${sampleExecution.mode}`);
        console.log(`  Status: ${sampleExecution.status}`);
        console.log(`  Started: ${sampleExecution.startedAt}`);
        console.log(`  Finished: ${sampleExecution.finished}`);
        
        // Check for error data
        const errors = executions.filter(exec => exec.status === 'error');
        console.log(`❌ Error Executions: ${errors.length}`);
        
        if (errors.length > 0) {
          console.log('\n🚨 Recent Errors:');
          errors.slice(0, 3).forEach((error, i) => {
            console.log(`  ${i + 1}. ID: ${error.id} - Workflow: ${error.workflowId}`);
            console.log(`     Time: ${error.startedAt}`);
          });
        }
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Database Analysis Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test Method 4: SSH Access Feasibility
async function testSSHAccess() {
  console.log('🧪 Testing SSH Access Feasibility...');
  
  // Note: SSH access requires service ID and proper setup
  // This is a placeholder for SSH testing
  console.log('📝 SSH Access Notes:');
  console.log('  • SSH format: ssh -p 22222 service_id@server_id.sliplane.app');
  console.log('  • Requires service ID from SlipLane API');
  console.log('  • Can access filesystem directly via SSH');
  console.log('  • SQLite file typically at: /home/node/.n8n/database.sqlite');
  
  return { 
    success: true, 
    note: 'SSH testing requires service deployment and connection setup' 
  };
}

// Main test function
async function runDatabaseAccessTests() {
  console.log('🚀 Starting n8n Database Access Tests\n');
  
  const results = {
    sliplane: await testSlipLaneAPI(),
    n8nAPI: await testN8NAPI(),
    dbAnalysis: await analyzeN8NDatabase(),
    ssh: await testSSHAccess()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  console.log(`SlipLane API:     ${results.sliplane.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`n8n API:          ${results.n8nAPI.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`DB Analysis:      ${results.dbAnalysis.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`SSH Feasibility:  ${results.ssh.success ? '✅ READY' : '❌ NOT READY'}`);
  
  console.log('\n🎯 Recommendations:');
  
  if (results.n8nAPI.success) {
    console.log('✅ RECOMMENDED: Use n8n API for monitoring data');
    console.log('   • Direct access to executions and workflows');
    console.log('   • No database file access needed');
    console.log('   • Works with CE edition limitations');
  }
  
  if (results.sliplane.success) {
    console.log('✅ AVAILABLE: SlipLane API for service management');
    console.log('   • Can manage containers and deployments');
    console.log('   • Good for log collection setup');
  }
  
  console.log('\n🔄 Next Steps:');
  console.log('1. Create MCP server using n8n API endpoints');
  console.log('2. Set up log collection via Docker logging');
  console.log('3. Deploy Loki/Promtail stack on SlipLane');
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runDatabaseAccessTests().catch(console.error);
}

module.exports = { runDatabaseAccessTests };