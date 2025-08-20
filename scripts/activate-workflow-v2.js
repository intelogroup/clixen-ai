#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

async function activateWorkflow(workflowId) {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  
  try {
    // First, get the workflow
    console.log(chalk.blue(`Fetching workflow ${workflowId}...`));
    
    const getResponse = await axios.get(
      `${baseUrl}/api/v1/workflows/${workflowId}`,
      {
        headers: {
          'X-N8N-API-KEY': apiKey
        }
      }
    );
    
    const workflow = getResponse.data.data || getResponse.data;
    console.log(chalk.gray(`  Found: ${workflow.name}`));
    
    // Now update it with active status
    console.log(chalk.blue('Activating workflow...'));
    
    // Only send required fields
    const updateData = {
      name: workflow.name,
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      settings: workflow.settings || {},
      active: true
    };
    
    const response = await axios.put(
      `${baseUrl}/api/v1/workflows/${workflowId}`,
      updateData,
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(chalk.green(`✓ Workflow activated successfully!`));
    
    // Find webhook URLs
    if (workflow.nodes) {
      const webhooks = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
      webhooks.forEach(webhook => {
        if (webhook.parameters?.path) {
          console.log(chalk.cyan(`  Webhook URL: ${baseUrl}/webhook/${webhook.parameters.path}`));
        }
      });
    }
    
    return true;
    
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error.response?.data?.message || error.message}`));
    if (error.response?.data) {
      console.log(chalk.gray(JSON.stringify(error.response.data, null, 2)));
    }
    return false;
  }
}

// CLI
if (require.main === module) {
  const workflowId = process.argv[2];
  
  if (!workflowId) {
    console.log(chalk.yellow('Usage: node activate-workflow-v2.js <workflow-id>'));
    console.log(chalk.gray('\nExample: node activate-workflow-v2.js P3v5IzBj6qE6VI0X'));
    process.exit(1);
  }
  
  activateWorkflow(workflowId);
}

module.exports = activateWorkflow;