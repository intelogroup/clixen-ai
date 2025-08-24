#!/usr/bin/env node

/**
 * Clixen AI - n8n MCP Server
 * Model Context Protocol server for n8n monitoring and debugging
 * Uses n8n API instead of direct database access for CE compatibility
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

// HTTP client for n8n API
async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`n8n API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`n8n API Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'clixen-n8n-monitor',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      logging: {}
    }
  }
);

// Tool: Get recent executions with detailed filtering
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_recent_executions',
        description: 'Get recent workflow executions with filtering options',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20, description: 'Number of executions to return' },
            status: { type: 'string', enum: ['success', 'error', 'running', 'waiting'], description: 'Filter by execution status' },
            workflowId: { type: 'string', description: 'Filter by specific workflow ID' },
            includeData: { type: 'boolean', default: false, description: 'Include execution data (verbose)' }
          }
        }
      },
      {
        name: 'get_execution_errors',
        description: 'Get detailed error information from failed executions',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10, description: 'Number of errors to return' },
            since: { type: 'string', description: 'ISO date string to get errors since' },
            workflowId: { type: 'string', description: 'Filter by specific workflow ID' }
          }
        }
      },
      {
        name: 'get_workflow_stats',
        description: 'Get comprehensive workflow statistics and performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Specific workflow ID (optional)' },
            days: { type: 'number', default: 7, description: 'Number of days to analyze' }
          }
        }
      },
      {
        name: 'get_system_health',
        description: 'Get overall system health and performance indicators',
        inputSchema: {
          type: 'object',
          properties: {
            detailed: { type: 'boolean', default: false, description: 'Include detailed diagnostics' }
          }
        }
      },
      {
        name: 'get_active_workflows',
        description: 'List all active workflows with execution frequency',
        inputSchema: {
          type: 'object',
          properties: {
            includeNodes: { type: 'boolean', default: false, description: 'Include node details' }
          }
        }
      },
      {
        name: 'debug_execution',
        description: 'Get detailed debugging information for a specific execution',
        inputSchema: {
          type: 'object',
          properties: {
            executionId: { type: 'string', required: true, description: 'Execution ID to debug' },
            includeNodeData: { type: 'boolean', default: true, description: 'Include individual node execution data' }
          }
        }
      }
    ]
  };
});

// Implementation: Get recent executions
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'get_recent_executions': {
        const { limit = 20, status, workflowId, includeData = false } = args;
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        if (workflowId) params.append('workflowId', workflowId);
        if (includeData) params.append('includeData', 'true');
        
        const data = await n8nRequest(`/executions?${params}`);
        const executions = data.data || [];
        
        // Enhanced formatting for development debugging
        const formatted = executions.map(exec => ({
          id: exec.id,
          workflowId: exec.workflowId,
          status: exec.status || (exec.finished ? 'finished' : 'running'),
          mode: exec.mode,
          startedAt: exec.startedAt,
          stoppedAt: exec.stoppedAt,
          duration: exec.stoppedAt ? 
            new Date(exec.stoppedAt) - new Date(exec.startedAt) : null,
          retryOf: exec.retryOf,
          ...(includeData && { executionData: exec.data })
        }));
        
        const summary = {
          total: formatted.length,
          byStatus: formatted.reduce((acc, exec) => {
            acc[exec.status] = (acc[exec.status] || 0) + 1;
            return acc;
          }, {}),
          executions: formatted
        };
        
        return {
          content: [{
            type: 'text',
            text: `# Recent Executions\n\n${JSON.stringify(summary, null, 2)}`
          }]
        };
      }

      case 'get_execution_errors': {
        const { limit = 10, since, workflowId } = args;
        
        // Get all executions and filter for errors
        const params = new URLSearchParams();
        params.append('limit', (limit * 3).toString()); // Get more to ensure we have enough errors
        if (workflowId) params.append('workflowId', workflowId);
        
        const data = await n8nRequest(`/executions?${params}`);
        let executions = data.data || [];
        
        // Filter for errors and apply date filter
        executions = executions.filter(exec => {
          const isError = exec.status === 'error' || 
                         (exec.finished && exec.status !== 'success');
          
          if (!isError) return false;
          
          if (since) {
            const execDate = new Date(exec.startedAt);
            const sinceDate = new Date(since);
            return execDate >= sinceDate;
          }
          
          return true;
        }).slice(0, limit);
        
        // Get detailed error information
        const errorDetails = await Promise.all(
          executions.map(async (exec) => {
            try {
              // Try to get detailed execution data
              const detailData = await n8nRequest(`/executions/${exec.id}`);
              
              return {
                id: exec.id,
                workflowId: exec.workflowId,
                startedAt: exec.startedAt,
                stoppedAt: exec.stoppedAt,
                error: detailData.data?.resultData?.error || 'Unknown error',
                mode: exec.mode,
                retryOf: exec.retryOf,
                // Extract error from execution data if available
                detailedError: detailData.data?.resultData?.runData ? 
                  extractExecutionErrors(detailData.data.resultData.runData) : null
              };
            } catch (err) {
              return {
                id: exec.id,
                workflowId: exec.workflowId,
                startedAt: exec.startedAt,
                stoppedAt: exec.stoppedAt,
                error: 'Could not fetch detailed error information',
                mode: exec.mode
              };
            }
          })
        );
        
        return {
          content: [{
            type: 'text',
            text: `# Execution Errors\n\n${JSON.stringify(errorDetails, null, 2)}`
          }]
        };
      }

      case 'get_workflow_stats': {
        const { workflowId, days = 7 } = args;
        
        // Get workflows
        const workflowsData = await n8nRequest('/workflows');
        const workflows = workflowsData.data || [];
        
        // Get executions for analysis
        const executionsData = await n8nRequest('/executions?limit=1000');
        const executions = executionsData.data || [];
        
        // Calculate date threshold
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        
        // Filter executions by date and optionally by workflow
        const relevantExecutions = executions.filter(exec => {
          const execDate = new Date(exec.startedAt);
          const isRecent = execDate >= dateThreshold;
          const matchesWorkflow = !workflowId || exec.workflowId === workflowId;
          return isRecent && matchesWorkflow;
        });
        
        // Calculate statistics
        const stats = {
          timeframe: `${days} days`,
          workflows: workflowId ? 
            workflows.filter(wf => wf.id === workflowId) : 
            workflows.map(wf => ({
              id: wf.id,
              name: wf.name,
              active: wf.active,
              executions: relevantExecutions.filter(ex => ex.workflowId === wf.id).length
            })),
          executionStats: {
            total: relevantExecutions.length,
            successful: relevantExecutions.filter(ex => ex.status === 'success').length,
            failed: relevantExecutions.filter(ex => ex.status === 'error').length,
            running: relevantExecutions.filter(ex => !ex.finished).length,
            avgDuration: calculateAverageDuration(relevantExecutions)
          }
        };
        
        return {
          content: [{
            type: 'text',
            text: `# Workflow Statistics\n\n${JSON.stringify(stats, null, 2)}`
          }]
        };
      }

      case 'get_system_health': {
        const { detailed = false } = args;
        
        try {
          // Check n8n health endpoint
          const healthResponse = await fetch(`${N8N_BASE_URL}/healthz`);
          const isHealthy = healthResponse.ok;
          
          // Get basic metrics
          const workflowsData = await n8nRequest('/workflows');
          const executionsData = await n8nRequest('/executions?limit=100');
          
          const workflows = workflowsData.data || [];
          const executions = executionsData.data || [];
          
          // Calculate health metrics
          const recentExecutions = executions.filter(exec => {
            const execDate = new Date(exec.startedAt);
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return execDate >= hourAgo;
          });
          
          const health = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            metrics: {
              totalWorkflows: workflows.length,
              activeWorkflows: workflows.filter(wf => wf.active).length,
              recentExecutions: recentExecutions.length,
              errorRate: recentExecutions.length > 0 ? 
                (recentExecutions.filter(ex => ex.status === 'error').length / recentExecutions.length) * 100 : 0
            }
          };
          
          if (detailed) {
            health.detailed = {
              workflowBreakdown: workflows.map(wf => ({
                id: wf.id,
                name: wf.name,
                active: wf.active,
                recentExecutions: recentExecutions.filter(ex => ex.workflowId === wf.id).length
              })),
              recentErrors: executions
                .filter(ex => ex.status === 'error')
                .slice(0, 5)
                .map(ex => ({
                  id: ex.id,
                  workflowId: ex.workflowId,
                  startedAt: ex.startedAt
                }))
            };
          }
          
          return {
            content: [{
              type: 'text',
              text: `# System Health\n\n${JSON.stringify(health, null, 2)}`
            }]
          };
          
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `# System Health - ERROR\n\nFailed to check system health: ${error.message}`
            }]
          };
        }
      }

      case 'get_active_workflows': {
        const { includeNodes = false } = args;
        
        const workflowsData = await n8nRequest('/workflows');
        const workflows = workflowsData.data || [];
        
        const activeWorkflows = workflows
          .filter(wf => wf.active)
          .map(wf => ({
            id: wf.id,
            name: wf.name,
            active: wf.active,
            nodeCount: wf.nodes ? wf.nodes.length : 0,
            ...(includeNodes && { 
              nodes: wf.nodes ? wf.nodes.map(node => ({
                name: node.name,
                type: node.type,
                position: node.position
              })) : []
            }),
            createdAt: wf.createdAt,
            updatedAt: wf.updatedAt
          }));
        
        return {
          content: [{
            type: 'text',
            text: `# Active Workflows\n\n${JSON.stringify(activeWorkflows, null, 2)}`
          }]
        };
      }

      case 'debug_execution': {
        const { executionId, includeNodeData = true } = args;
        
        if (!executionId) {
          throw new Error('executionId is required');
        }
        
        // Get detailed execution data
        const executionData = await n8nRequest(`/executions/${executionId}`);
        
        if (!executionData.data) {
          throw new Error('Execution not found');
        }
        
        const debug = {
          execution: {
            id: executionData.data.id,
            workflowId: executionData.data.workflowId,
            mode: executionData.data.mode,
            startedAt: executionData.data.startedAt,
            stoppedAt: executionData.data.stoppedAt,
            status: executionData.data.status,
            finished: executionData.data.finished
          },
          workflow: executionData.data.workflowData,
          ...(includeNodeData && {
            nodeExecutions: executionData.data.resultData?.runData || {},
            error: executionData.data.resultData?.error || null
          })
        };
        
        return {
          content: [{
            type: 'text',
            text: `# Execution Debug - ${executionId}\n\n${JSON.stringify(debug, null, 2)}`
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error executing ${name}: ${error.message}`
      }]
    };
  }
});

// Helper functions
function extractExecutionErrors(runData) {
  const errors = [];
  
  for (const [nodeName, nodeRuns] of Object.entries(runData)) {
    for (const run of nodeRuns) {
      if (run.error) {
        errors.push({
          node: nodeName,
          error: run.error,
          startTime: run.startTime,
          executionTime: run.executionTime
        });
      }
    }
  }
  
  return errors.length > 0 ? errors : null;
}

function calculateAverageDuration(executions) {
  const finishedExecs = executions.filter(ex => ex.stoppedAt);
  
  if (finishedExecs.length === 0) return null;
  
  const totalDuration = finishedExecs.reduce((sum, exec) => {
    return sum + (new Date(exec.stoppedAt) - new Date(exec.startedAt));
  }, 0);
  
  return Math.round(totalDuration / finishedExecs.length);
}

// Start server
async function main() {
  console.log('🚀 Starting Clixen n8n MCP Server...');
  console.log(`📡 n8n URL: ${N8N_BASE_URL}`);
  console.log(`🔑 API Key: ${N8N_API_KEY ? 'SET' : 'MISSING'}`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log('✅ MCP Server running on stdio');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP server...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}