#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

async function listWorkflows() {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  
  try {
    console.log(chalk.blue('Fetching workflows from n8n...'));
    
    const response = await axios.get(
      `${baseUrl}/api/v1/workflows`,
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const workflows = response.data.data || [];
    
    console.log(chalk.green(`\n✓ Found ${workflows.length} workflows:\n`));
    
    workflows.forEach(wf => {
      const status = wf.active ? chalk.green('● Active') : chalk.gray('○ Inactive');
      console.log(`${status}  ${chalk.cyan(wf.name)} (ID: ${wf.id})`);
      
      // Check for webhook nodes
      if (wf.nodes) {
        const webhooks = wf.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
        webhooks.forEach(webhook => {
          if (webhook.parameters?.path) {
            console.log(chalk.gray(`      └─ Webhook: ${baseUrl}/webhook/${webhook.parameters.path}`));
          }
        });
      }
    });
    
    // Summary
    const activeCount = workflows.filter(w => w.active).length;
    const inactiveCount = workflows.length - activeCount;
    
    console.log(chalk.cyan('\n📊 Summary:'));
    console.log(chalk.green(`  Active: ${activeCount}`));
    console.log(chalk.gray(`  Inactive: ${inactiveCount}`));
    console.log(chalk.blue(`  Total: ${workflows.length}`));
    
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error.response?.data?.message || error.message}`));
  }
}

listWorkflows();