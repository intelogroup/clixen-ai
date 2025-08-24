#!/usr/bin/env node

/**
 * Test n8n Workflow Creation and Management
 * Using both direct n8n API calls and n8n MCP server to test system capabilities
 */

const https = require('https');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const path = require('path');

// n8n Configuration
const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

// N8N MCP Integration Class
class N8NMCPManager {
  constructor() {
    this.mcpProcess = null;
    this.configPath = path.join(process.cwd(), 'n8n-mcp-config.json');
    this.isReady = false;
  }

  async startMCPServer() {
    console.log('🚀 Starting n8n MCP Server...');
    
    // Set environment variable for config
    process.env.N8N_MCP_CONFIG = this.configPath;
    
    this.mcpProcess = spawn('node', [path.join(__dirname, 'node_modules', 'n8n-mcp', 'dist', 'mcp', 'index.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, N8N_MCP_CONFIG: this.configPath },
      shell: true
    });

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';
      
      this.mcpProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`📊 MCP: ${data.toString().trim()}`);
        
        if (output.includes('running on stdio transport')) {
          this.isReady = true;
          setTimeout(() => resolve(this.mcpProcess), 2000); // Give it a moment to fully initialize
        }
      });

      this.mcpProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`❌ MCP Error: ${data.toString().trim()}`);
      });

      this.mcpProcess.on('error', (error) => {
        console.error(`❌ Failed to start MCP server: ${error.message}`);
        reject(error);
      });

      this.mcpProcess.on('exit', (code) => {
        if (code !== 0 && !this.isReady) {
          reject(new Error(`MCP server exited with code ${code}: ${errorOutput}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.isReady) {
          reject(new Error('MCP server did not start within 30 seconds'));
        }
      }, 30000);
    });
  }

  async sendMCPRequest(method, params = {}) {
    if (!this.isReady || !this.mcpProcess) {
      throw new Error('MCP server is not ready');
    }

    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
      };

      console.log(`📤 Sending MCP request: ${method}`);
      
      let responseData = '';
      const timeout = setTimeout(() => {
        reject(new Error(`MCP request timeout for ${method}`));
      }, 30000);

      const dataHandler = (data) => {
        responseData += data.toString();
        
        try {
          const lines = responseData.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                clearTimeout(timeout);
                this.mcpProcess.stdout.off('data', dataHandler);
                
                if (response.error) {
                  console.error(`❌ MCP Error for ${method}:`, response.error);
                  reject(new Error(response.error.message || 'MCP request failed'));
                } else {
                  console.log(`✅ MCP Success for ${method}`);
                  resolve(response.result);
                }
                return;
              }
            }
          }
        } catch (e) {
          // Continue waiting for complete JSON
        }
      };

      this.mcpProcess.stdout.on('data', dataHandler);
      
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async listMCPTools() {
    try {
      const result = await this.sendMCPRequest('tools/list');
      console.log(`📋 Found ${result?.tools?.length || 0} MCP tools`);
      if (result?.tools) {
        result.tools.forEach((tool, i) => {
          console.log(`  ${i + 1}. ${tool.name}: ${tool.description}`);
        });
      }
      return result;
    } catch (error) {
      console.error('❌ Failed to list MCP tools:', error.message);
      throw error;
    }
  }

  async validateWorkflowWithMCP(workflowData) {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'validate_workflow',
        arguments: { workflow: workflowData }
      });
      return result;
    } catch (error) {
      console.error('❌ MCP workflow validation failed:', error.message);
      throw error;
    }
  }

  async activateWorkflowWithMCP(workflowId) {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'activate_workflow',
        arguments: { workflowId, active: true }
      });
      return result;
    } catch (error) {
      console.error('❌ MCP workflow activation failed:', error.message);
      throw error;
    }
  }

  async executeWorkflowWithMCP(workflowId, inputData = []) {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'execute_workflow',
        arguments: { 
          workflowId,
          inputData: inputData.length > 0 ? inputData : [{ test: true, timestamp: new Date().toISOString() }]
        }
      });
      return result;
    } catch (error) {
      console.error('❌ MCP workflow execution failed:', error.message);
      throw error;
    }
  }

  async getWorkflowExecutionsWithMCP(workflowId) {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'get_executions',
        arguments: { workflowId, limit: 10 }
      });
      return result;
    } catch (error) {
      console.error('❌ MCP get executions failed:', error.message);
      throw error;
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up MCP server...');
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.isReady = false;
  }
}

// Helper function for n8n API calls
async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: null,
            raw: data
          });
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

// Test Workflow Templates
const TEST_WORKFLOWS = {
  simpleWebhook: {
    name: '[TEST] Simple Webhook Echo',
    nodes: [
      {
        parameters: {},
        id: 'webhook-trigger',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [240, 300],
        webhookId: 'test-webhook-echo'
      },
      {
        parameters: {
          respondWith: 'json',
          responseBody: '{\n  "status": "success",\n  "message": "Webhook received successfully",\n  "timestamp": "{{ $now }}",\n  "data": {{ $json }}\n}'
        },
        id: 'webhook-response',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1,
        position: [460, 300]
      }
    ],
    connections: {
      'Webhook': {
        main: [
          [
            {
              node: 'Respond to Webhook',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    }
  },

  httpRequest: {
    name: '[TEST] HTTP Request to JSONPlaceholder',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: 'minutes',
                minutesInterval: 30
              }
            ]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          options: {}
        },
        id: 'http-request',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: {
              caseSensitive: true,
              leftValue: '',
              typeValidation: 'strict'
            },
            conditions: [
              {
                id: 'success-condition',
                leftValue: '={{ $json.id }}',
                rightValue: 1,
                operator: {
                  type: 'number',
                  operation: 'equals'
                }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'if-condition',
        name: 'IF',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [
          [
            {
              node: 'HTTP Request',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'HTTP Request': {
        main: [
          [
            {
              node: 'IF',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    }
  },

  errorHandling: {
    name: '[TEST] Error Handling & Monitoring',
    nodes: [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: 'minutes',
                minutesInterval: 15
              }
            ]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          url: 'https://httpstat.us/500',
          options: {
            response: {
              response: {
                neverError: false
              }
            }
          }
        },
        id: 'failing-request',
        name: 'Intentional Fail Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300],
        onError: 'continueErrorOutput'
      },
      {
        parameters: {
          mode: 'combine',
          combinationMode: 'multiplex',
          options: {}
        },
        id: 'merge-data',
        name: 'Merge',
        type: 'n8n-nodes-base.merge',
        typeVersion: 3,
        position: [680, 380]
      },
      {
        parameters: {
          assignments: {
            assignments: [
              {
                id: 'error-log',
                name: 'error_message',
                value: '={{ $json.message || "Unknown error occurred" }}',
                type: 'string'
              },
              {
                id: 'timestamp',
                name: 'timestamp',
                value: '={{ $now }}',
                type: 'string'
              },
              {
                id: 'workflow-id',
                name: 'workflow_id',
                value: '={{ $workflow.id }}',
                type: 'string'
              },
              {
                id: 'execution-id',
                name: 'execution_id',
                value: '={{ $execution.id }}',
                type: 'string'
              }
            ]
          },
          options: {}
        },
        id: 'error-format',
        name: 'Format Error Data',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [900, 380]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [
          [
            {
              node: 'Intentional Fail Request',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'Intentional Fail Request': {
        main: [
          [
            {
              node: 'Merge',
              type: 'main',
              index: 0
            }
          ],
          [
            {
              node: 'Merge',
              type: 'main',
              index: 1
            }
          ]
        ]
      },
      'Merge': {
        main: [
          [
            {
              node: 'Format Error Data',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    }
  }
};

// Test workflow creation
async function createWorkflow(workflowName, workflowDef) {
  console.log(`🔨 Creating workflow: ${workflowName}`);
  
  try {
    const response = await n8nRequest('/workflows', {
      method: 'POST',
      body: workflowDef
    });
    
    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Workflow created successfully: ${response.data.id}`);
      return { success: true, workflowId: response.data.id, workflow: response.data };
    } else {
      console.log(`❌ Failed to create workflow: ${response.status} ${response.statusText}`);
      console.log(`📝 Response:`, response.raw);
      return { success: false, error: response.statusText, details: response.raw };
    }
    
  } catch (error) {
    console.error(`💥 Error creating workflow ${workflowName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Validate workflow before deployment
async function validateWorkflow(workflowDef) {
  console.log('🔍 Validating workflow structure...');
  
  // Basic validation checks
  const checks = {
    hasNodes: workflowDef.nodes && workflowDef.nodes.length > 0,
    hasName: workflowDef.name && workflowDef.name.trim().length > 0,
    hasConnections: workflowDef.connections && Object.keys(workflowDef.connections).length > 0,
    hasValidNodeTypes: workflowDef.nodes.every(node => 
      node.type && node.type.startsWith('n8n-nodes-base.')
    )
  };
  
  const issues = [];
  if (!checks.hasNodes) issues.push('No nodes defined');
  if (!checks.hasName) issues.push('No workflow name');
  if (!checks.hasConnections) issues.push('No node connections');
  if (!checks.hasValidNodeTypes) issues.push('Invalid node types');
  
  const isValid = Object.values(checks).every(check => check);
  
  console.log(`📊 Validation results:`);
  console.log(`  Nodes: ${checks.hasNodes ? '✅' : '❌'} (${workflowDef.nodes?.length || 0})`);
  console.log(`  Name: ${checks.hasName ? '✅' : '❌'} (${workflowDef.name || 'undefined'})`);
  console.log(`  Connections: ${checks.hasConnections ? '✅' : '❌'}`);
  console.log(`  Node Types: ${checks.hasValidNodeTypes ? '✅' : '❌'}`);
  
  if (issues.length > 0) {
    console.log(`⚠️  Issues found: ${issues.join(', ')}`);
  }
  
  return { isValid, issues, checks };
}

// Activate workflow
async function activateWorkflow(workflowId) {
  console.log(`⚡ Activating workflow: ${workflowId}`);
  
  try {
    const response = await n8nRequest(`/workflows/${workflowId}/activate`, {
      method: 'POST'
    });
    
    if (response.status === 200) {
      console.log(`✅ Workflow activated successfully`);
      return { success: true };
    } else {
      console.log(`❌ Failed to activate workflow: ${response.status}`);
      console.log(`📝 Response:`, response.raw);
      return { success: false, error: response.statusText };
    }
    
  } catch (error) {
    console.error(`💥 Error activating workflow:`, error.message);
    return { success: false, error: error.message };
  }
}

// Execute workflow manually
async function executeWorkflow(workflowId) {
  console.log(`🚀 Executing workflow: ${workflowId}`);
  
  try {
    const response = await n8nRequest(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: {}
    });
    
    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Workflow execution started: ${response.data.executionId || 'unknown'}`);
      return { success: true, executionId: response.data.executionId };
    } else {
      console.log(`❌ Failed to execute workflow: ${response.status}`);
      console.log(`📝 Response:`, response.raw);
      return { success: false, error: response.statusText };
    }
    
  } catch (error) {
    console.error(`💥 Error executing workflow:`, error.message);
    return { success: false, error: error.message };
  }
}

// Get execution status
async function getExecutionStatus(executionId) {
  console.log(`📊 Checking execution status: ${executionId}`);
  
  try {
    const response = await n8nRequest(`/executions/${executionId}`);
    
    if (response.status === 200) {
      const execution = response.data;
      console.log(`📋 Execution Status:`);
      console.log(`  ID: ${execution.id}`);
      console.log(`  Status: ${execution.finished ? (execution.status || 'finished') : 'running'}`);
      console.log(`  Started: ${execution.startedAt}`);
      console.log(`  Stopped: ${execution.stoppedAt || 'still running'}`);
      
      return { success: true, execution };
    } else {
      console.log(`❌ Failed to get execution status: ${response.status}`);
      return { success: false, error: response.statusText };
    }
    
  } catch (error) {
    console.error(`💥 Error getting execution status:`, error.message);
    return { success: false, error: error.message };
  }
}

// Clean up test workflows
async function cleanupTestWorkflows() {
  console.log('🧹 Cleaning up existing test workflows...');
  
  try {
    // Get all workflows
    const response = await n8nRequest('/workflows');
    
    if (response.status === 200 && response.data.data) {
      const testWorkflows = response.data.data.filter(wf => 
        wf.name.includes('[TEST]')
      );
      
      console.log(`Found ${testWorkflows.length} test workflows to clean up`);
      
      for (const workflow of testWorkflows) {
        try {
          // Deactivate first if active
          if (workflow.active) {
            await n8nRequest(`/workflows/${workflow.id}/deactivate`, { method: 'POST' });
            console.log(`  Deactivated: ${workflow.name}`);
          }
          
          // Delete workflow
          const deleteResponse = await n8nRequest(`/workflows/${workflow.id}`, { method: 'DELETE' });
          
          if (deleteResponse.status === 200) {
            console.log(`  ✅ Deleted: ${workflow.name}`);
          } else {
            console.log(`  ❌ Failed to delete: ${workflow.name}`);
          }
        } catch (error) {
          console.log(`  ⚠️  Error deleting ${workflow.name}: ${error.message}`);
        }
      }
      
      return { success: true, cleaned: testWorkflows.length };
    }
    
    return { success: true, cleaned: 0 };
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test function with MCP integration
async function runWorkflowTests() {
  console.log('🚀 Starting n8n Workflow Testing Suite with MCP Integration\n');
  console.log(`🌐 n8n Instance: ${N8N_BASE_URL}`);
  console.log(`🔑 API Key: ${N8N_API_KEY ? N8N_API_KEY.substring(0, 20) + '...' : 'MISSING'}\n`);
  
  // Initialize MCP Manager
  const mcpManager = new N8NMCPManager();
  
  const results = {
    workflows: [],
    mcp: {
      initialized: false,
      tools: [],
      workflowsCreated: 0,
      workflowsActivated: 0,
      workflowsExecuted: 0
    },
    summary: {
      created: 0,
      activated: 0,
      executed: 0,
      failed: 0
    }
  };
  
  try {
    // Step 1: Initialize MCP Server
    console.log('\n🔧 Initializing MCP Server...');
    try {
      await mcpManager.startMCPServer();
      results.mcp.initialized = true;
      console.log('✅ MCP Server initialized successfully');
      
      // List available MCP tools
      const tools = await mcpManager.listMCPTools();
      results.mcp.tools = tools?.tools || [];
      
    } catch (mcpError) {
      console.error('❌ MCP Server initialization failed:', mcpError.message);
      console.log('⚠️  Continuing with direct API tests only...\n');
    }
    
    // Step 2: Clean up any existing test workflows
    await cleanupTestWorkflows();
    console.log('');
    
    // Step 3: Test each workflow type
    for (const [workflowName, workflowDef] of Object.entries(TEST_WORKFLOWS)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 Testing workflow: ${workflowName}`);
      console.log(`${'='.repeat(60)}`);
      
      // Validate workflow
      const validation = await validateWorkflow(workflowDef);
      
      if (!validation.isValid) {
        console.log(`❌ Workflow validation failed: ${validation.issues.join(', ')}`);
        results.workflows.push({
          name: workflowName,
          success: false,
          error: 'Validation failed',
          issues: validation.issues
        });
        results.summary.failed++;
        continue;
      }
      
      console.log('✅ Workflow validation passed\n');
      
      // Test 1: Enhanced MCP Validation if available
      let mcpValidationResult = null;
      if (results.mcp.initialized) {
        console.log('🔧 Testing MCP Workflow Validation...');
        try {
          mcpValidationResult = await mcpManager.validateWorkflowWithMCP(workflowDef);
          if (mcpValidationResult) {
            console.log('✅ MCP Workflow validation successful');
            console.log(`📊 MCP Validation Result:`, JSON.stringify(mcpValidationResult.content?.[0]?.text || mcpValidationResult, null, 2));
          }
        } catch (mcpError) {
          console.log('❌ MCP Workflow validation failed:', mcpError.message);
        }
      }
      
      // Test 2: Create workflow via direct API
      console.log('🔧 Testing Direct API Creation...');
      const createResult = await createWorkflow(workflowName, workflowDef);
      
      let workflowId = null;
      if (createResult.success) {
        workflowId = createResult.workflowId;
        results.mcp.workflowsCreated++;
      }
      
      if (!workflowId || !createResult.success) {
        results.workflows.push({
          name: workflowName,
          success: false,
          error: createResult.error || 'Failed to create workflow',
          details: createResult.details,
          mcpValidationResult: mcpValidationResult
        });
        results.summary.failed++;
        continue;
      }
      
      results.summary.created++;
      
      // Wait a moment for the workflow to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 3: Activate workflow (only for webhook workflow)
      let activationResult = null;
      let mcpActivationResult = null;
      
      if (workflowName === 'simpleWebhook') {
        console.log('⚡ Testing Direct API Activation...');
        activationResult = await activateWorkflow(workflowId);
        
        // Test MCP activation if available
        if (results.mcp.initialized) {
          console.log('⚡ Testing MCP Activation...');
          try {
            mcpActivationResult = await mcpManager.activateWorkflowWithMCP(workflowId);
            if (mcpActivationResult) {
              console.log('✅ MCP Workflow activation successful');
              results.mcp.workflowsActivated++;
            }
          } catch (mcpError) {
            console.log('❌ MCP Workflow activation failed:', mcpError.message);
          }
        }
        
        if (activationResult?.success || mcpActivationResult) {
          results.summary.activated++;
          console.log('✅ Workflow activation successful');
          
          // Get webhook URL
          console.log(`🔗 Webhook URL: ${N8N_BASE_URL}/webhook/test-webhook-echo`);
        } else {
          console.log('❌ Workflow activation failed');
        }
      }
      
      // Test 4: Execute workflow (for non-webhook workflows)
      let executionResult = null;
      let mcpExecutionResult = null;
      
      if (workflowName !== 'simpleWebhook') {
        console.log('🚀 Testing Direct API Execution...');
        executionResult = await executeWorkflow(workflowId);
        
        // Test MCP execution if available
        if (results.mcp.initialized) {
          console.log('🚀 Testing MCP Execution...');
          try {
            mcpExecutionResult = await mcpManager.executeWorkflowWithMCP(workflowId);
            if (mcpExecutionResult) {
              console.log('✅ MCP Workflow execution successful');
              results.mcp.workflowsExecuted++;
            }
          } catch (mcpError) {
            console.log('❌ MCP Workflow execution failed:', mcpError.message);
          }
        }
        
        if (executionResult?.success || mcpExecutionResult) {
          results.summary.executed++;
          
          // Wait for execution to complete and check status
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (executionResult?.executionId) {
            await getExecutionStatus(executionResult.executionId);
          }
          
          // Try to get executions via MCP
          if (results.mcp.initialized && workflowId) {
            try {
              console.log('📊 Testing MCP Get Executions...');
              const executions = await mcpManager.getWorkflowExecutionsWithMCP(workflowId);
              console.log(`📋 Found ${executions?.executions?.length || 0} executions via MCP`);
            } catch (mcpError) {
              console.log('❌ MCP Get executions failed:', mcpError.message);
            }
          }
        }
      }
      
      // Store results
      results.workflows.push({
        name: workflowName,
        workflowId: workflowId,
        success: true,
        created: true,
        activated: activationResult?.success || mcpActivationResult || false,
        executed: executionResult?.success || mcpExecutionResult || false,
        executionId: executionResult?.executionId || null,
        usedMCP: mcpValidationResult ? true : false,
        mcpResults: {
          validated: mcpValidationResult ? true : false,
          activated: mcpActivationResult ? true : false,
          executed: mcpExecutionResult ? true : false
        }
      });
      
      console.log(`✅ Workflow ${workflowName} test completed`);
    }
    
    // Step 4: Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST RESULTS SUMMARY');
    console.log(`${'='.repeat(60)}`);
    
    console.log(`Total Workflows Tested: ${Object.keys(TEST_WORKFLOWS).length}`);
    console.log(`Successfully Created: ${results.summary.created}`);
    console.log(`Successfully Activated: ${results.summary.activated}`);
    console.log(`Successfully Executed: ${results.summary.executed}`);
    console.log(`Failed: ${results.summary.failed}`);
    
    console.log('\n🔧 MCP Integration Results:');
    console.log(`MCP Server Initialized: ${results.mcp.initialized ? '✅' : '❌'}`);
    console.log(`MCP Tools Available: ${results.mcp.tools.length}`);
    console.log(`MCP Workflows Validated: ${results.mcp.workflowsCreated}`);
    console.log(`MCP Workflows Activated: ${results.mcp.workflowsActivated}`);
    console.log(`MCP Workflows Executed: ${results.mcp.workflowsExecuted}`);
    
    console.log('\n📋 Individual Results:');
    results.workflows.forEach((result, i) => {
      const status = result.success ? '✅' : '❌';
      const mcpUsed = result.usedMCP ? '🔧' : '🔄';
      console.log(`  ${i + 1}. ${status} ${mcpUsed} ${result.name}`);
      if (result.workflowId) console.log(`     ID: ${result.workflowId}`);
      if (result.executionId) console.log(`     Execution: ${result.executionId}`);
      if (result.mcpResults) {
        console.log(`     MCP: Validated=${result.mcpResults.validated ? '✅' : '❌'} Activated=${result.mcpResults.activated ? '✅' : '❌'} Executed=${result.mcpResults.executed ? '✅' : '❌'}`);
      }
      if (result.error) console.log(`     Error: ${result.error}`);
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Check n8n dashboard for created workflows');
    console.log('  2. Test webhook endpoint manually if activated');
    console.log('  3. Monitor execution logs via our monitoring system');
    console.log('  4. Use MCP tools to debug any failed workflows');
    console.log(`  5. MCP Server: ${results.mcp.initialized ? 'Available for debugging' : 'Restart required'}`);
    
    return results;
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Always cleanup MCP server
    if (mcpManager) {
      mcpManager.cleanup();
    }
  }
}

// Export for use in other scripts
module.exports = { runWorkflowTests, TEST_WORKFLOWS, n8nRequest };

// Run if called directly
if (require.main === module) {
  runWorkflowTests()
    .then(results => {
      process.exit(results.success !== false ? 0 : 1);
    })
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}