#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

async function createSimpleWorkflow() {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  
  const workflow = {
    name: "Simple AI Agent Test",
    nodes: [
      {
        parameters: {
          path: "ai-test",
          options: {}
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 300]
      },
      {
        parameters: {
          assignments: {
            assignments: [
              {
                id: "query",
                name: "query",
                type: "string",
                value: "={{ $json.message || 'Hello AI' }}"
              }
            ]
          },
          options: {}
        },
        name: "Set",
        type: "n8n-nodes-base.set",
        typeVersion: 1,
        position: [450, 300]
      },
      {
        parameters: {},
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [650, 300]
      }
    ],
    connections: {
      "Webhook": {
        "main": [
          [
            {
              "node": "Set",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Set": {
        "main": [
          [
            {
              "node": "Respond to Webhook",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    settings: {}
  };

  try {
    console.log(chalk.blue('Creating simple workflow...'));
    
    const response = await axios.post(
      `${baseUrl}/api/v1/workflows`,
      workflow,
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(chalk.green(`✓ Workflow created successfully!`));
    const workflowData = response.data.data || response.data;
    console.log(chalk.cyan(`  ID: ${workflowData.id}`));
    console.log(chalk.cyan(`  Name: ${workflowData.name}`));
    console.log(chalk.cyan(`  Webhook URL: ${baseUrl}/webhook/ai-test`));
    
    // Activate the workflow
    await axios.patch(
      `${baseUrl}/api/v1/workflows/${workflowData.id}`,
      { active: true },
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(chalk.green('✓ Workflow activated!'));
    
    // Test the webhook
    console.log(chalk.blue('\nTesting webhook...'));
    try {
      const testResponse = await axios.post(
        `${baseUrl}/webhook/ai-test`,
        { message: "Hello from test!" },
        { timeout: 5000 }
      );
      console.log(chalk.green('✓ Webhook is responding!'));
      console.log(chalk.gray('Response:', JSON.stringify(testResponse.data)));
    } catch (err) {
      console.log(chalk.yellow('⚠ Webhook test failed (workflow might need a moment to activate)'));
    }
    
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error.response?.data?.message || error.message}`));
    if (error.response?.data) {
      console.log(chalk.gray(JSON.stringify(error.response.data, null, 2)));
    }
  }
}

createSimpleWorkflow();