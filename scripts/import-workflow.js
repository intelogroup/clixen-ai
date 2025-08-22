#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowImporter {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  async getExistingWorkflows() {
    try {
      const response = await axios.get(`${this.apiUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.log(chalk.yellow('Note: Could not fetch existing workflows'));
      return [];
    }
  }

  async importWorkflow(workflowPath) {
    const fileName = path.basename(workflowPath);
    console.log(chalk.blue(`\nImporting: ${fileName}`));

    try {
      const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      
      // Check if workflow already exists
      const existing = await this.getExistingWorkflows();
      const existingWorkflow = existing.find(w => w.name === workflowData.name);
      
      if (existingWorkflow) {
        console.log(chalk.yellow(`  ⚠ Workflow "${workflowData.name}" already exists (ID: ${existingWorkflow.id})`));
        const updateResponse = await axios.put(
          `${this.apiUrl}/workflows/${existingWorkflow.id}`,
          workflowData,
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(chalk.green(`  ✓ Updated workflow ID: ${existingWorkflow.id}`));
        return updateResponse.data;
      } else {
        // Create new workflow
        const response = await axios.post(
          `${this.apiUrl}/workflows`,
          workflowData,
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(chalk.green(`  ✓ Created workflow ID: ${response.data.data.id}`));
        return response.data;
      }
    } catch (error) {
      console.log(chalk.red(`  ✗ Failed: ${error.response?.data?.message || error.message}`));
      if (error.response?.status === 401) {
        console.log(chalk.red('\n❌ Authentication failed. Please check your N8N_API_KEY'));
      }
      return null;
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
      console.log(chalk.green(`  ✓ Activated workflow ${workflowId}`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠ Could not activate: ${error.message}`));
    }
  }

  async importAll() {
    console.log(chalk.bold.cyan('\n🚀 Importing Workflows to N8N Cloud\n'));
    console.log(chalk.gray(`Instance: ${this.baseUrl}`));
    
    const workflowDir = path.join(__dirname, '../workflows/core');
    const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));
    
    const results = {
      successful: [],
      failed: []
    };

    for (const file of files) {
      const filePath = path.join(workflowDir, file);
      const result = await this.importWorkflow(filePath);
      
      if (result) {
        results.successful.push(file);
      } else {
        results.failed.push(file);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log(chalk.bold.cyan('\n📊 Import Summary\n'));
    console.log(chalk.green(`✓ Successful: ${results.successful.length}`));
    console.log(chalk.red(`✗ Failed: ${results.failed.length}`));
    
    if (results.successful.length > 0) {
      console.log(chalk.cyan('\n🔗 Webhook URLs:'));
      console.log(chalk.gray(`  Customer Support: ${process.env.N8N_WEBHOOK_URL}/customer-support`));
      console.log(chalk.gray(`  Content Generation: ${process.env.N8N_WEBHOOK_URL}/generate-content`));
      console.log(chalk.gray(`  Multi-Agent: ${process.env.N8N_WEBHOOK_URL}/orchestrate`));
    }
  }

  async importSingle(workflowName) {
    const workflowPath = path.join(__dirname, '../workflows/core', workflowName);
    if (!fs.existsSync(workflowPath)) {
      console.log(chalk.red(`Workflow file not found: ${workflowName}`));
      return;
    }
    await this.importWorkflow(workflowPath);
  }
}

// CLI handling
if (require.main === module) {
  const importer = new WorkflowImporter();
  const args = process.argv.slice(2);
  
  if (args[0]) {
    importer.importSingle(args[0]).catch(console.error);
  } else {
    importer.importAll().catch(console.error);
  }
}

module.exports = WorkflowImporter;