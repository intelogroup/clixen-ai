#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

/**
 * Clean n8n instance by deleting all workflows
 */
class N8nCleaner {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  /**
   * Get all workflows from n8n instance
   */
  async getAllWorkflows() {
    try {
      console.log(chalk.blue('📋 Fetching all workflows...'));
      
      const response = await axios.get(
        `${this.apiUrl}/workflows`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );
      
      const workflows = response.data?.data || response.data || [];
      console.log(chalk.yellow(`Found ${workflows.length} workflows`));
      return workflows;
      
    } catch (error) {
      console.error(chalk.red(`Error fetching workflows: ${error.message}`));
      return [];
    }
  }

  /**
   * Delete a single workflow
   */
  async deleteWorkflow(workflowId, workflowName) {
    try {
      await axios.delete(
        `${this.apiUrl}/workflows/${workflowId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );
      
      console.log(chalk.green(`✓ Deleted: ${workflowName} (ID: ${workflowId})`));
      return true;
      
    } catch (error) {
      console.error(chalk.red(`✗ Failed to delete ${workflowName}: ${error.message}`));
      return false;
    }
  }

  /**
   * Delete all workflows
   */
  async deleteAllWorkflows() {
    console.log(chalk.bold.yellow('\n⚠️  WARNING: This will delete ALL workflows from your n8n instance!\n'));
    
    const workflows = await this.getAllWorkflows();
    
    if (workflows.length === 0) {
      console.log(chalk.green('No workflows to delete.'));
      return;
    }

    console.log(chalk.blue(`\n🗑️  Deleting ${workflows.length} workflows...\n`));
    
    let deleted = 0;
    let failed = 0;
    
    for (const workflow of workflows) {
      const success = await this.deleteWorkflow(workflow.id, workflow.name);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    }
    
    console.log(chalk.bold.cyan('\n📊 Summary'));
    console.log(chalk.green(`✓ Deleted: ${deleted} workflows`));
    if (failed > 0) {
      console.log(chalk.red(`✗ Failed: ${failed} workflows`));
    }
    
    console.log(chalk.bold.green('\n🎉 n8n instance cleaned!\n'));
  }
}

// CLI
if (require.main === module) {
  const cleaner = new N8nCleaner();
  
  // Add confirmation prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(chalk.bold.red('⚠️  DELETE ALL WORKFLOWS'));
  console.log(chalk.yellow('This action cannot be undone!'));
  
  rl.question('\nAre you sure you want to delete all workflows? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await cleaner.deleteAllWorkflows();
    } else {
      console.log(chalk.blue('Operation cancelled.'));
    }
    rl.close();
    process.exit(0);
  });
}

module.exports = N8nCleaner;