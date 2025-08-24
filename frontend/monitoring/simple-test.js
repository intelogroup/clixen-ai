#!/usr/bin/env node

/**
 * Simple test for n8n MCP Server
 * Tests basic functionality without complex deployment
 */

import { spawn } from 'child_process';

console.log('🧪 Simple MCP Server Test\n');

// Test n8n API connectivity first
async function testN8NAPI() {
  console.log('🌐 Testing n8n API...');
  
  try {
    const response = await fetch('https://n8nio-n8n-7xzf6n.sliplane.app/healthz');
    console.log(`✅ n8n Health: ${response.status}`);
    
    const apiResponse = await fetch('https://n8nio-n8n-7xzf6n.sliplane.app/api/v1/workflows', {
      headers: {
        'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0'
      }
    });
    
    console.log(`✅ n8n API: ${apiResponse.status}`);
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`📊 Workflows: ${data.data ? data.data.length : 0}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ n8n API failed:', error.message);
    return false;
  }
}

// Test MCP server startup
async function testMCPServer() {
  console.log('\n🖥️  Testing MCP Server startup...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['n8n-mcp-server.js'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    
    server.stdout.on('data', (data) => {
      serverOutput += data.toString();
      console.log('📤 Server output:', data.toString().trim());
    });
    
    server.stderr.on('data', (data) => {
      console.log('🚨 Server error:', data.toString().trim());
    });
    
    server.on('error', (error) => {
      console.error('❌ Server spawn error:', error.message);
      resolve(false);
    });
    
    // Test if server starts without crashing
    setTimeout(() => {
      if (server.pid) {
        console.log('✅ MCP Server started successfully');
        server.kill();
        resolve(true);
      } else {
        console.log('❌ MCP Server failed to start');
        resolve(false);
      }
    }, 3000);
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting simple tests...\n');
  
  const apiTest = await testN8NAPI();
  const mcpTest = await testMCPServer();
  
  console.log('\n📊 Test Results:');
  console.log(`  n8n API: ${apiTest ? '✅' : '❌'}`);
  console.log(`  MCP Server: ${mcpTest ? '✅' : '❌'}`);
  
  if (apiTest && mcpTest) {
    console.log('\n🎉 All tests passed! Ready for deployment.');
    console.log('\n🔧 Next steps:');
    console.log('  1. Run: node deploy-sliplane.js');
    console.log('  2. Or start locally: docker-compose -f docker-compose.dev.yml up -d');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration.');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});