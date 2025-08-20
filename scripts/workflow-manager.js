#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowManager {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  async getWorkflowDetails(workflowId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/workflows/${workflowId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      const workflow = response.data?.data || response.data;
      
      console.log(chalk.cyan('\n📋 Workflow Details:'));
      console.log(chalk.gray(`  ID: ${workflow.id}`));
      console.log(chalk.gray(`  Name: ${workflow.name}`));
      console.log(chalk.gray(`  Active: ${workflow.active ? chalk.green('Yes') : chalk.red('No')}`));
      console.log(chalk.gray(`  Created: ${workflow.createdAt}`));
      console.log(chalk.gray(`  Updated: ${workflow.updatedAt}`));
      console.log(chalk.gray(`  Nodes: ${workflow.nodes?.length || 0}`));
      
      // Check for webhook nodes
      const webhookNodes = workflow.nodes?.filter(n => n.type === 'n8n-nodes-base.webhook') || [];
      if (webhookNodes.length > 0) {
        console.log(chalk.cyan('\n🔗 Webhook Endpoints:'));
        webhookNodes.forEach(node => {
          const path = node.parameters?.path;
          if (path) {
            console.log(chalk.gray(`  - ${this.baseUrl}/webhook/${path}`));
            if (!workflow.active) {
              console.log(chalk.yellow(`    ⚠ Workflow must be activated to use this webhook`));
            }
          }
        });
      }
      
      // Check for trigger nodes
      const triggerNodes = workflow.nodes?.filter(n => 
        n.type.includes('trigger') || n.type.includes('Trigger')
      ) || [];
      if (triggerNodes.length > 0) {
        console.log(chalk.cyan('\n⏰ Trigger Nodes:'));
        triggerNodes.forEach(node => {
          console.log(chalk.gray(`  - ${node.name} (${node.type})`));
        });
      }
      
      return workflow;
      
    } catch (error) {
      console.log(chalk.red(`✗ Failed to get workflow: ${error.response?.data?.message || error.message}`));
      return null;
    }
  }

  async testWorkflowExecution(workflowId) {
    console.log(chalk.blue(`\nTesting workflow execution for ID: ${workflowId}`));
    
    // Get workflow details first
    const workflow = await this.getWorkflowDetails(workflowId);
    if (!workflow) return;
    
    if (!workflow.active) {
      console.log(chalk.yellow('\n⚠ Workflow is inactive. Attempting to activate...'));
      
      // Create test execution request
      const testData = {
        mode: 'manual',
        workflowData: {
          id: workflowId,
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings || {}
        },
        testData: {
          webhook_trigger: [{
            json: {
              query: "Test execution from API",
              test: true,
              timestamp: new Date().toISOString()
            }
          }]
        }
      };
      
      try {
        console.log(chalk.blue('\nAttempting manual test execution...'));
        const response = await axios.post(
          `${this.apiUrl}/workflows/run`,
          testData,
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const executionId = response.data?.data?.executionId;
        console.log(chalk.green(`✓ Test execution started: ${executionId}`));
        
        // Wait for execution to complete
        await this.delay(5000);
        
        // Get execution details
        await this.getExecutionDetails(executionId);
        
      } catch (error) {
        console.log(chalk.red(`✗ Test execution failed: ${error.response?.data?.message || error.message}`));
        
        // Try alternative execution method
        console.log(chalk.blue('\nTrying alternative execution method...'));
        await this.alternativeExecution(workflow);
      }
    }
  }

  async alternativeExecution(workflow) {
    try {
      // Create a test run with minimal data
      const runData = {
        executionMode: 'manual',
        workflowData: workflow,
        pinData: {},
        startNodes: []
      };
      
      const response = await axios.post(
        `${this.apiUrl}/workflows/${workflow.id}/run`,
        runData,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(chalk.green('✓ Alternative execution started'));
      console.log(chalk.gray(`Response: ${JSON.stringify(response.data).substring(0, 200)}...`));
      
    } catch (error) {
      console.log(chalk.red(`✗ Alternative execution failed: ${error.response?.data?.message || error.message}`));
    }
  }

  async getExecutionDetails(executionId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/executions/${executionId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      const execution = response.data?.data || response.data;
      
      console.log(chalk.cyan('\n📊 Execution Results:'));
      console.log(chalk.gray(`  Status: ${execution.finished ? 'Completed' : 'Running'}`));
      console.log(chalk.gray(`  Mode: ${execution.mode}`));
      console.log(chalk.gray(`  Duration: ${execution.executionTime || 'N/A'}ms`));
      
      if (execution.data?.resultData?.error) {
        console.log(chalk.red(`  Error: ${execution.data.resultData.error.message}`));
      }
      
      // Show node execution results
      if (execution.data?.resultData?.runData) {
        console.log(chalk.cyan('\n📝 Node Execution Results:'));
        Object.keys(execution.data.resultData.runData).forEach(nodeName => {
          const nodeData = execution.data.resultData.runData[nodeName];
          if (nodeData && nodeData[0]) {
            const status = nodeData[0].error ? chalk.red('❌') : chalk.green('✅');
            console.log(`  ${status} ${nodeName}`);
            if (nodeData[0].error) {
              console.log(chalk.red(`     Error: ${nodeData[0].error.message}`));
            }
          }
        });
      }
      
      return execution;
      
    } catch (error) {
      console.log(chalk.red(`✗ Could not get execution details: ${error.message}`));
      return null;
    }
  }

  async listActiveWorkflows() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/workflows`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      const workflows = response.data?.data || [];
      const activeWorkflows = workflows.filter(w => w.active);
      
      console.log(chalk.cyan(`\n✨ Active Workflows (${activeWorkflows.length}):\n`));
      
      if (activeWorkflows.length === 0) {
        console.log(chalk.yellow('No active workflows found.'));
        console.log(chalk.gray('Activate workflows in the n8n UI to enable execution.'));
      } else {
        activeWorkflows.forEach(wf => {
          console.log(chalk.green(`● ${wf.name}`));
          console.log(chalk.gray(`  ID: ${wf.id}`));
          
          // Check for webhooks
          if (wf.nodes) {
            const webhooks = wf.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
            webhooks.forEach(webhook => {
              if (webhook.parameters?.path) {
                console.log(chalk.blue(`  Webhook: ${this.baseUrl}/webhook/${webhook.parameters.path}`));
              }
            });
          }
        });
      }
      
      console.log(chalk.cyan(`\n📊 Workflow Summary:`));
      console.log(chalk.gray(`  Total: ${workflows.length}`));
      console.log(chalk.green(`  Active: ${activeWorkflows.length}`));
      console.log(chalk.gray(`  Inactive: ${workflows.length - activeWorkflows.length}`));
      
    } catch (error) {
      console.log(chalk.red(`✗ Failed to list workflows: ${error.message}`));
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
if (require.main === module) {
  const manager = new WorkflowManager();
  const command = process.argv[2];
  const param = process.argv[3];
  
  switch(command) {
    case 'details':
      if (param) {
        manager.getWorkflowDetails(param).catch(console.error);
      } else {
        console.log(chalk.yellow('Usage: details <workflow-id>'));
      }
      break;
    
    case 'test':
      if (param) {
        manager.testWorkflowExecution(param).catch(console.error);
      } else {
        console.log(chalk.yellow('Usage: test <workflow-id>'));
      }
      break;
    
    case 'active':
      manager.listActiveWorkflows().catch(console.error);
      break;
    
    default:
      console.log(chalk.cyan('N8N Workflow Manager'));
      console.log(chalk.gray('\nCommands:'));
      console.log('  details <workflow-id>    Get workflow details');
      console.log('  test <workflow-id>       Test workflow execution');
      console.log('  active                   List active workflows');
      console.log(chalk.gray('\nExamples:'));
      console.log('  node workflow-manager.js details 9E1umhk4VQy2kyS6');
      console.log('  node workflow-manager.js test 9E1umhk4VQy2kyS6');
      console.log('  node workflow-manager.js active');
  }
}

module.exports = WorkflowManager;