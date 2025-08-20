#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

async function activateWorkflow(workflowId) {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  
  try {
    console.log(chalk.blue(`Activating workflow ${workflowId}...`));
    
    // Use PUT to update the workflow with active status
    const response = await axios.put(
      `${baseUrl}/api/v1/workflows/${workflowId}`,
      { active: true },
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(chalk.green(`✓ Workflow activated successfully!`));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error.response?.data?.message || error.message}`));
    return false;
  }
}

// CLI
if (require.main === module) {
  const workflowId = process.argv[2];
  
  if (!workflowId) {
    console.log(chalk.yellow('Usage: node activate-workflow.js <workflow-id>'));
    console.log(chalk.gray('\nExample: node activate-workflow.js P3v5IzBj6qE6VI0X'));
    process.exit(1);
  }
  
  activateWorkflow(workflowId);
}

module.exports = activateWorkflow;