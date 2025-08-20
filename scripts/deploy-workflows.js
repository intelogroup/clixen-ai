#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowDeployer {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  async validateEnvironment() {
    console.log(chalk.blue('🔍 Validating environment...'));
    
    const required = ['N8N_API_KEY', 'N8N_BASE_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.log(chalk.red(`Missing environment variables: ${missing.join(', ')}`));
      return false;
    }

    // Test API connection
    try {
      await axios.get(`${this.apiUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log(chalk.green('✓ API connection successful'));
      return true;
    } catch (error) {
      console.log(chalk.red('✗ API connection failed'));
      console.log(chalk.yellow(`  ${error.message}`));
      return false;
    }
  }

  async deployWorkflow(workflowPath, options = {}) {
    const fileName = path.basename(workflowPath);
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    console.log(chalk.blue(`\n📦 Deploying: ${workflowData.name}`));

    try {
      // Check if workflow exists
      const existingWorkflows = await this.getWorkflows();
      const existing = existingWorkflows.find(w => w.name === workflowData.name);

      let workflowId;
      
      if (existing) {
        // Update existing workflow
        console.log(chalk.yellow(`  Updating existing workflow (ID: ${existing.id})`));
        
        const updateData = {
          ...workflowData,
          id: existing.id,
          active: options.activate !== false
        };
        
        await axios.put(
          `${this.apiUrl}/workflows/${existing.id}`,
          updateData,
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        workflowId = existing.id;
      } else {
        // Create new workflow
        console.log(chalk.green('  Creating new workflow'));
        
        const createData = {
          ...workflowData,
          active: options.activate !== false
        };
        
        const response = await axios.post(
          `${this.apiUrl}/workflows`,
          createData,
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        workflowId = response.data.data.id;
      }

      // Activate workflow if requested
      if (options.activate) {
        await this.activateWorkflow(workflowId);
      }

      // Test webhook if it exists
      if (options.test) {
        await this.testWorkflowWebhook(workflowData, workflowId);
      }

      console.log(chalk.green(`✓ Deployed successfully (ID: ${workflowId})`));
      return { success: true, workflowId, name: workflowData.name };
      
    } catch (error) {
      console.log(chalk.red(`✗ Deployment failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  async getWorkflows() {
    try {
      const response = await axios.get(`${this.apiUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  async activateWorkflow(workflowId) {
    try {
      await axios.patch(
        `${this.apiUrl}/workflows/${workflowId}`,
        { active: true },
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(chalk.green(`  ✓ Workflow activated`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠ Could not activate: ${error.message}`));
    }
  }

  async testWorkflowWebhook(workflowData, workflowId) {
    // Find webhook trigger node
    const webhookNode = workflowData.nodes?.find(n => 
      n.type === 'n8n-nodes-base.webhook' && n.parameters?.path
    );
    
    if (!webhookNode) return;
    
    const webhookPath = webhookNode.parameters.path;
    const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/${webhookPath}`;
    
    console.log(chalk.blue(`  🔗 Testing webhook: ${webhookUrl}`));
    
    try {
      const response = await axios.post(webhookUrl, { test: true }, {
        timeout: 5000
      });
      console.log(chalk.green(`  ✓ Webhook responding`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠ Webhook not responding (workflow might need activation)`));
    }
  }

  async deployAll(options = {}) {
    console.log(chalk.bold.cyan('\n🚀 Deploying All Workflows to N8N\n'));
    console.log(chalk.gray(`Instance: ${this.baseUrl}`));
    
    if (!await this.validateEnvironment()) {
      console.log(chalk.red('\n❌ Environment validation failed'));
      return;
    }

    const workflowDir = path.join(__dirname, '../workflows/core');
    const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));
    
    const results = {
      successful: [],
      failed: []
    };

    for (const file of files) {
      const filePath = path.join(workflowDir, file);
      const result = await this.deployWorkflow(filePath, options);
      
      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push({ file, error: result.error });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log(chalk.bold.cyan('\n📊 Deployment Summary\n'));
    console.log(chalk.green(`✓ Successful: ${results.successful.length}`));
    console.log(chalk.red(`✗ Failed: ${results.failed.length}`));
    
    if (results.successful.length > 0) {
      console.log(chalk.cyan('\n✅ Deployed Workflows:'));
      results.successful.forEach(w => {
        console.log(chalk.gray(`  - ${w.name} (ID: ${w.workflowId})`));
      });
      
      console.log(chalk.cyan('\n🔗 Webhook Endpoints:'));
      console.log(chalk.gray(`  Customer Support: ${process.env.N8N_WEBHOOK_URL}/customer-support`));
      console.log(chalk.gray(`  Content Generation: ${process.env.N8N_WEBHOOK_URL}/generate-content`));
      console.log(chalk.gray(`  Multi-Agent: ${process.env.N8N_WEBHOOK_URL}/orchestrate`));
    }
    
    if (results.failed.length > 0) {
      console.log(chalk.red('\n❌ Failed Deployments:'));
      results.failed.forEach(f => {
        console.log(chalk.red(`  - ${f.file}: ${f.error}`));
      });
    }
  }

  async rollback(workflowId) {
    console.log(chalk.yellow(`\n⏪ Rolling back workflow ${workflowId}`));
    
    try {
      // Deactivate workflow
      await axios.patch(
        `${this.apiUrl}/workflows/${workflowId}`,
        { active: false },
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(chalk.green('✓ Workflow deactivated'));
      
      // Optionally delete workflow
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Delete workflow? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await axios.delete(`${this.apiUrl}/workflows/${workflowId}`, {
            headers: {
              'X-N8N-API-KEY': this.apiKey
            }
          });
          console.log(chalk.green('✓ Workflow deleted'));
        }
        readline.close();
      });
    } catch (error) {
      console.log(chalk.red(`✗ Rollback failed: ${error.message}`));
    }
  }
}

// CLI handling
if (require.main === module) {
  const deployer = new WorkflowDeployer();
  const args = process.argv.slice(2);
  
  const options = {
    activate: !args.includes('--no-activate'),
    test: args.includes('--test')
  };
  
  if (args.includes('--rollback')) {
    const workflowId = args[args.indexOf('--rollback') + 1];
    deployer.rollback(workflowId).catch(console.error);
  } else if (args[0] && !args[0].startsWith('--')) {
    const workflowPath = path.join(__dirname, '../workflows/core', args[0]);
    deployer.deployWorkflow(workflowPath, options).catch(console.error);
  } else {
    deployer.deployAll(options).catch(console.error);
  }
}

module.exports = WorkflowDeployer;