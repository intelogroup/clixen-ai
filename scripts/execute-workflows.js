#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowExecutor {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  async executeWorkflow(workflowId, data = {}) {
    try {
      console.log(chalk.blue(`\nExecuting workflow: ${workflowId}`));
      
      // Execute workflow via API
      const response = await axios.post(
        `${this.apiUrl}/workflows/${workflowId}/execute`,
        {
          workflowData: data,
          startNode: null
        },
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const executionId = response.data?.data?.id || response.data?.id;
      console.log(chalk.green(`✓ Started execution: ${executionId}`));
      
      // Wait and get execution details
      await this.delay(3000);
      return await this.getExecutionDetails(executionId);
      
    } catch (error) {
      console.log(chalk.red(`✗ Execution failed: ${error.response?.data?.message || error.message}`));
      return null;
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
      
      console.log(chalk.cyan('\n📊 Execution Details:'));
      console.log(chalk.gray(`  ID: ${execution.id}`));
      console.log(chalk.gray(`  Status: ${execution.finished ? 'Completed' : 'Running'}`));
      console.log(chalk.gray(`  Start: ${execution.startedAt}`));
      console.log(chalk.gray(`  End: ${execution.stoppedAt || 'Still running'}`));
      
      if (execution.data) {
        console.log(chalk.cyan('\n📋 Execution Data:'));
        const resultData = execution.data?.resultData;
        if (resultData?.runData) {
          Object.keys(resultData.runData).forEach(nodeName => {
            const nodeData = resultData.runData[nodeName];
            if (nodeData && nodeData[0]) {
              console.log(chalk.yellow(`\n  Node: ${nodeName}`));
              console.log(chalk.gray(`    Status: ${nodeData[0].error ? 'Error' : 'Success'}`));
              if (nodeData[0].error) {
                console.log(chalk.red(`    Error: ${nodeData[0].error.message}`));
              }
              if (nodeData[0].data?.main?.[0]?.[0]?.json) {
                const outputData = nodeData[0].data.main[0][0].json;
                console.log(chalk.gray(`    Output: ${JSON.stringify(outputData).substring(0, 200)}...`));
              }
            }
          });
        }
      }
      
      return execution;
      
    } catch (error) {
      console.log(chalk.red(`✗ Could not get execution details: ${error.message}`));
      return null;
    }
  }

  async testWebhookWorkflow(webhookPath, payload) {
    try {
      console.log(chalk.blue(`\nTesting webhook: /${webhookPath}`));
      console.log(chalk.gray(`Payload: ${JSON.stringify(payload)}`));
      
      const response = await axios.post(
        `${this.baseUrl}/webhook/${webhookPath}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(chalk.green(`✓ Webhook executed successfully`));
      console.log(chalk.gray(`Response: ${JSON.stringify(response.data).substring(0, 500)}...`));
      
      return response.data;
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(chalk.yellow(`⚠ Webhook not found or workflow inactive`));
        console.log(chalk.gray(`  Activate the workflow in n8n UI first`));
      } else {
        console.log(chalk.red(`✗ Webhook failed: ${error.message}`));
      }
      return null;
    }
  }

  async activateWorkflow(workflowId) {
    try {
      console.log(chalk.blue(`Activating workflow ${workflowId}...`));
      
      // Get workflow first
      const getResponse = await axios.get(
        `${this.apiUrl}/workflows/${workflowId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );
      
      const workflow = getResponse.data?.data || getResponse.data;
      
      // Update with active status
      const updateData = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        active: true
      };
      
      await axios.put(
        `${this.apiUrl}/workflows/${workflowId}`,
        updateData,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(chalk.green(`✓ Workflow activated`));
      return true;
      
    } catch (error) {
      console.log(chalk.red(`✗ Activation failed: ${error.response?.data?.message || error.message}`));
      return false;
    }
  }

  async getExecutions(limit = 10) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/executions`,
        {
          params: { limit },
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      const executions = response.data?.data || [];
      
      console.log(chalk.cyan(`\n📜 Recent Executions (Last ${limit}):\n`));
      
      executions.forEach(exec => {
        const status = exec.finished ? 
          (exec.data?.resultData?.error ? chalk.red('❌ Error') : chalk.green('✅ Success')) : 
          chalk.yellow('⏳ Running');
        
        console.log(`${status} ${exec.id} - ${exec.workflowData?.name || 'Unknown'}`);
        console.log(chalk.gray(`   Started: ${exec.startedAt}`));
        if (exec.stoppedAt) {
          console.log(chalk.gray(`   Duration: ${(new Date(exec.stoppedAt) - new Date(exec.startedAt)) / 1000}s`));
        }
        console.log();
      });
      
      return executions;
      
    } catch (error) {
      console.log(chalk.red(`✗ Could not get executions: ${error.message}`));
      return [];
    }
  }

  async testAllWorkflows() {
    console.log(chalk.bold.cyan('\n🚀 Testing All Deployed Workflows\n'));
    
    // Test Enhanced Multi-Tool Agent
    console.log(chalk.bold.yellow('\n1️⃣ Enhanced Multi-Tool AI Agent'));
    await this.testWebhookWorkflow('multi-tool-agent', {
      query: "What's the weather in London?"
    });
    await this.delay(2000);
    
    // Test Research Analyst
    console.log(chalk.bold.yellow('\n2️⃣ Research Analyst'));
    await this.testWebhookWorkflow('research-analyst', {
      topic: "Artificial Intelligence",
      depth: "basic"
    });
    await this.delay(2000);
    
    // Test Customer Support
    console.log(chalk.bold.yellow('\n3️⃣ Customer Support'));
    await this.testWebhookWorkflow('customer-support', {
      query: "How do I reset my password?",
      context: { userId: "test123" }
    });
    await this.delay(2000);
    
    // Test Content Generation
    console.log(chalk.bold.yellow('\n4️⃣ Content Generation'));
    await this.testWebhookWorkflow('generate-content', {
      content_type: "blog_post",
      topic: "Cloud Computing",
      length: 200
    });
    await this.delay(2000);
    
    // Test Orchestrator
    console.log(chalk.bold.yellow('\n5️⃣ Multi-Agent Orchestrator'));
    await this.testWebhookWorkflow('orchestrate', {
      task: "Analyze market trends",
      taskType: "analysis"
    });
    
    // Get recent executions
    await this.delay(3000);
    await this.getExecutions(5);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
if (require.main === module) {
  const executor = new WorkflowExecutor();
  const command = process.argv[2];
  const param = process.argv[3];
  
  switch(command) {
    case 'execute':
      if (param) {
        executor.executeWorkflow(param).catch(console.error);
      } else {
        console.log(chalk.yellow('Usage: execute <workflow-id>'));
      }
      break;
    
    case 'webhook':
      if (param) {
        const payload = process.argv[4] ? JSON.parse(process.argv[4]) : { test: true };
        executor.testWebhookWorkflow(param, payload).catch(console.error);
      } else {
        console.log(chalk.yellow('Usage: webhook <path> [json-payload]'));
      }
      break;
    
    case 'activate':
      if (param) {
        executor.activateWorkflow(param).catch(console.error);
      } else {
        console.log(chalk.yellow('Usage: activate <workflow-id>'));
      }
      break;
    
    case 'executions':
      executor.getExecutions(parseInt(param) || 10).catch(console.error);
      break;
    
    case 'test-all':
      executor.testAllWorkflows().catch(console.error);
      break;
    
    default:
      console.log(chalk.cyan('N8N Workflow Executor'));
      console.log(chalk.gray('\nCommands:'));
      console.log('  execute <workflow-id>         Execute a workflow by ID');
      console.log('  webhook <path> [payload]      Test a webhook endpoint');
      console.log('  activate <workflow-id>        Activate a workflow');
      console.log('  executions [limit]            Get recent executions');
      console.log('  test-all                      Test all workflows');
      console.log(chalk.gray('\nExamples:'));
      console.log('  node execute-workflows.js execute 9E1umhk4VQy2kyS6');
      console.log('  node execute-workflows.js webhook multi-tool-agent \'{"query":"test"}\'');
      console.log('  node execute-workflows.js test-all');
  }
}

module.exports = WorkflowExecutor;