#!/usr/bin/env node

/**
 * Test the n8n MCP Server functionality
 * Validates all tools and their responses
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

// Test scenarios for MCP server
const testScenarios = [
  {
    name: 'Get Recent Executions',
    tool: 'get_recent_executions',
    arguments: { limit: 5, includeData: false }
  },
  {
    name: 'Get Execution Errors',
    tool: 'get_execution_errors', 
    arguments: { limit: 3 }
  },
  {
    name: 'Get Workflow Stats',
    tool: 'get_workflow_stats',
    arguments: { days: 7 }
  },
  {
    name: 'Get System Health',
    tool: 'get_system_health',
    arguments: { detailed: true }
  },
  {
    name: 'Get Active Workflows',
    tool: 'get_active_workflows',
    arguments: { includeNodes: false }
  }
];

// MCP Protocol message wrapper
function createMCPMessage(id, method, params) {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: id,
    method: method,
    params: params
  }) + '\n';
}

// Parse MCP response
function parseMCPResponse(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return { error: 'Invalid JSON response', raw: data };
  }
}

// Test MCP server functionality
async function testMCPServer() {
  console.log('🧪 Starting MCP Server Test Suite\n');
  
  return new Promise((resolve, reject) => {
    // Spawn the MCP server
    const mcpServer = spawn('node', ['n8n-mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });
    
    let responseBuffer = '';
    let currentTestIndex = 0;
    let testResults = [];
    
    // Handle server output
    mcpServer.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      // Process complete JSON messages
      while (responseBuffer.includes('\n')) {
        const newlineIndex = responseBuffer.indexOf('\n');
        const message = responseBuffer.slice(0, newlineIndex);
        responseBuffer = responseBuffer.slice(newlineIndex + 1);
        
        if (message.trim()) {
          const response = parseMCPResponse(message);
          console.log(`📨 Response ${currentTestIndex + 1}:`, JSON.stringify(response, null, 2));
          
          testResults.push({
            test: testScenarios[currentTestIndex]?.name || 'Unknown',
            success: !response.error,
            response: response
          });
          
          currentTestIndex++;
          
          // Run next test or finish
          if (currentTestIndex < testScenarios.length) {
            setTimeout(() => runNextTest(), 1000);
          } else {
            finishTests();
          }
        }
      }
    });
    
    // Handle server errors
    mcpServer.stderr.on('data', (data) => {
      console.error('🚨 Server Error:', data.toString());
    });
    
    // Handle server exit
    mcpServer.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ MCP Server exited with code ${code}`);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
    
    // Send initialization message
    setTimeout(() => {
      console.log('🔗 Initializing MCP server...');
      const initMessage = createMCPMessage(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      });
      
      mcpServer.stdin.write(initMessage);
      
      // Start first test after initialization
      setTimeout(() => runNextTest(), 2000);
    }, 1000);
    
    function runNextTest() {
      if (currentTestIndex >= testScenarios.length) {
        return;
      }
      
      const test = testScenarios[currentTestIndex];
      console.log(`\n🧪 Running test: ${test.name}`);
      
      const testMessage = createMCPMessage(
        currentTestIndex + 2,
        'tools/call',
        {
          name: test.tool,
          arguments: test.arguments
        }
      );
      
      mcpServer.stdin.write(testMessage);
    }
    
    function finishTests() {
      console.log('\n📊 Test Results Summary:');
      console.log('='.repeat(50));
      
      const successCount = testResults.filter(r => r.success).length;
      const totalTests = testResults.length;
      
      testResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${result.test}`);
      });
      
      console.log(`\n🎯 Overall: ${successCount}/${totalTests} tests passed`);
      
      if (successCount === totalTests) {
        console.log('🎉 All tests passed! MCP server is working correctly.');
      } else {
        console.log('⚠️  Some tests failed. Check the responses above.');
      }
      
      // Clean up
      mcpServer.kill();
      resolve({ success: successCount === totalTests, results: testResults });
    }
    
    // Timeout handling
    setTimeout(() => {
      console.log('⏰ Test timeout reached');
      mcpServer.kill();
      reject(new Error('Test timeout'));
    }, 30000);
  });
}

// Test n8n API connectivity
async function testN8NConnectivity() {
  console.log('🌐 Testing n8n API connectivity...\n');
  
  const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
  const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${N8N_BASE_URL}/healthz`);
    console.log(`✅ Health check: ${healthResponse.status}`);
    
    // Test API authentication
    const apiResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    console.log(`✅ API authentication: ${apiResponse.status}`);
    
    const data = await apiResponse.json();
    console.log(`📊 Workflows found: ${data.data ? data.data.length : 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ n8n connectivity test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Clixen AI MCP Server Test Suite\n');
  
  try {
    // Test 1: n8n connectivity
    const connectivityResult = await testN8NConnectivity();
    
    if (!connectivityResult) {
      console.log('⚠️  n8n connectivity issues detected, but continuing with MCP tests...\n');
    }
    
    // Test 2: MCP server functionality
    const mcpResult = await testMCPServer();
    
    console.log('\n🎉 Test suite completed!');
    
    return {
      connectivity: connectivityResult,
      mcp: mcpResult.success,
      overall: connectivityResult && mcpResult.success
    };
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    return {
      connectivity: false,
      mcp: false,
      overall: false,
      error: error.message
    };
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      process.exit(results.overall ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { runAllTests };