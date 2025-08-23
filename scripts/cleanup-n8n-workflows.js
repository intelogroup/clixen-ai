#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

/**
 * N8N Workflow Cleanup Script
 * Removes test/demo workflows and keeps only production-ready ones
 */
class N8nWorkflowCleaner {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
    
    if (!this.baseUrl || !this.apiKey || this.apiKey === 'your_n8n_api_key_here') {
      console.log(chalk.yellow('⚠️  N8N credentials not configured. Please set N8N_API_KEY in .env file'));
      console.log(chalk.blue('This script will show you what workflows would be deleted'));
    }
  }

  // Workflows to DELETE (test/demo/unnecessary workflows)
  workflowsToDelete = [
    'Simple AI Agent Test',
    'Customer Service Generated', 
    'Data Processing Generated',
    'Integration Generated',
    'Profile Update Handler',
    'MCP Generated Workflow',
    'MCP Cooked AI Agent',
    'Vredrick MCP AI Agent',
    'Template Analysis',
    'Front LLM Router',
    'User Onboarding Workflow',
    'Main Orchestrator',
    'Global Error Handler',
    'Execution Logger',
    'Document Analytics',
    'Data Processing',
    'Credit Usage Tracker',
    // Core test workflows
    'Customer Support Agent',
    'Data Analysis Agent',
    'Content Generation Agent',
    'Multi-Agent Orchestrator',
    'Enhanced Multi-Tool Agent',
    'Research Analyst Agent'
  ];

  // Workflows to KEEP and modify for production
  workflowsToKeep = [
    'Telegram AI Assistant - Weather, News & Events',
    'Telegram Bot'
  ];

  async listWorkflows() {
    if (!this.isConfigured()) {
      return this.showPlanWithoutAPI();
    }

    try {
      console.log(chalk.blue('🔍 Fetching workflows from n8n...\\n'));
      
      const response = await axios.get(`${this.apiUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const workflows = response.data.data || [];
      
      console.log(chalk.green(`✓ Found ${workflows.length} workflows:\\n`));
      
      const toDelete = [];
      const toKeep = [];
      const unknown = [];

      workflows.forEach(wf => {
        const status = wf.active ? chalk.green('● Active') : chalk.gray('○ Inactive');
        
        if (this.workflowsToDelete.includes(wf.name)) {
          toDelete.push(wf);
          console.log(`${chalk.red('🗑️  DELETE')} ${status}  ${chalk.cyan(wf.name)} (ID: ${wf.id})`);
        } else if (this.workflowsToKeep.includes(wf.name)) {
          toKeep.push(wf);
          console.log(`${chalk.green('✅ KEEP')}   ${status}  ${chalk.cyan(wf.name)} (ID: ${wf.id})`);
        } else {
          unknown.push(wf);
          console.log(`${chalk.yellow('❓ REVIEW')} ${status}  ${chalk.cyan(wf.name)} (ID: ${wf.id})`);
        }
      });

      console.log(chalk.cyan('\\n📊 Cleanup Summary:'));
      console.log(chalk.red(`  To Delete: ${toDelete.length}`));
      console.log(chalk.green(`  To Keep: ${toKeep.length}`));
      console.log(chalk.yellow(`  To Review: ${unknown.length}`));
      console.log(chalk.blue(`  Total: ${workflows.length}`));

      return { toDelete, toKeep, unknown };

    } catch (error) {
      console.log(chalk.red(`✗ Failed: ${error.response?.data?.message || error.message}`));
      return null;
    }
  }

  async deleteWorkflows(workflowsToDelete, dryRun = true) {
    if (!this.isConfigured()) {
      console.log(chalk.yellow('Cannot delete workflows without valid API key'));
      return;
    }

    console.log(chalk.blue(`\\n🧹 ${dryRun ? 'DRY RUN - Would delete' : 'Deleting'} ${workflowsToDelete.length} workflows...\\n`));

    for (const workflow of workflowsToDelete) {
      try {
        if (!dryRun) {
          await axios.delete(`${this.apiUrl}/workflows/${workflow.id}`, {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          });
        }
        
        console.log(`${dryRun ? chalk.yellow('WOULD DELETE') : chalk.green('✓ DELETED')} ${workflow.name}`);
      } catch (error) {
        console.log(chalk.red(`✗ FAILED to delete ${workflow.name}: ${error.response?.data?.message || error.message}`));
      }
    }

    console.log(chalk.green(`\\n✅ Cleanup ${dryRun ? 'planned' : 'completed'}!`));
  }

  isConfigured() {
    return this.baseUrl && this.apiKey && this.apiKey !== 'your_n8n_api_key_here';
  }

  showPlanWithoutAPI() {
    console.log(chalk.blue('\\n🔍 N8N Cleanup Plan (without API access)\\n'));
    
    console.log(chalk.red('📋 Workflows TO DELETE:'));
    this.workflowsToDelete.forEach(name => {
      console.log(chalk.red(`  🗑️  ${name}`));
    });

    console.log(chalk.green('\\n📋 Workflows TO KEEP:'));
    this.workflowsToKeep.forEach(name => {
      console.log(chalk.green(`  ✅ ${name}`));
    });

    console.log(chalk.cyan('\\n📊 Summary:'));
    console.log(chalk.red(`  Planned Deletions: ${this.workflowsToDelete.length}`));
    console.log(chalk.green(`  Will Keep: ${this.workflowsToKeep.length}`));
    
    console.log(chalk.yellow('\\n⚠️  To execute cleanup:'));
    console.log('1. Get N8N API key from https://clixen.app.n8n.cloud');
    console.log('2. Update N8N_API_KEY in .env file');
    console.log('3. Run: node scripts/cleanup-n8n-workflows.js --execute');

    return { 
      planned: {
        toDelete: this.workflowsToDelete.map(name => ({ name })),
        toKeep: this.workflowsToKeep.map(name => ({ name }))
      }
    };
  }

  async run() {
    console.log(chalk.bold.cyan('\\n🤖 N8N Workflow Cleanup Tool\\n'));
    
    const execute = process.argv.includes('--execute');
    const dryRun = !execute;

    if (dryRun) {
      console.log(chalk.yellow('🏃 Running in DRY RUN mode. Use --execute to actually delete workflows.\\n'));
    }

    const result = await this.listWorkflows();
    
    if (result && result.toDelete && result.toDelete.length > 0) {
      console.log(chalk.yellow('\\n⚠️  About to delete workflows. Continue? (Ctrl+C to cancel)'));
      
      if (!dryRun) {
        // Add a 5-second delay for safety
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      await this.deleteWorkflows(result.toDelete, dryRun);
    }

    console.log(chalk.blue('\\nNext steps:'));
    console.log('1. Review any UNKNOWN workflows manually');
    console.log('2. Run: node scripts/create-production-workflows.js');
    console.log('3. Set up orchestration service');
  }
}

// Run the cleanup
if (require.main === module) {
  const cleaner = new N8nWorkflowCleaner();
  cleaner.run().catch(console.error);
}

module.exports = N8nWorkflowCleaner;