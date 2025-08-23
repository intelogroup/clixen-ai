#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

/**
 * Test n8n MCP and create a simple competitor monitoring workflow
 */
class N8nWorkflowCreator {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  /**
   * Create a simple competitor monitoring workflow
   */
  async createCompetitorMonitorWorkflow() {
    console.log(chalk.bold.cyan('\n🤖 Creating Competitor Monitoring Workflow\n'));

    const workflow = {
      name: 'B2C Competitor Price Monitor',
      nodes: [
        {
          id: 'webhook_trigger',
          name: 'Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1.1,
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: 'competitor-monitor',
            responseMode: 'onReceived',
            responseData: 'allEntries',
            options: {}
          },
          webhookId: 'competitor-monitor-webhook'
        },
        {
          id: 'auth_validator',
          name: 'Validate Auth Token',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            functionCode: `// Extract and validate auth token from headers
const authToken = $input.first().headers['x-auth-token'];
const userId = $input.first().headers['x-user-id'];
const telegramId = $input.first().headers['x-telegram-id'];
const executionId = $input.first().headers['x-execution-id'];

if (!authToken || !userId) {
  throw new Error('Authentication required');
}

// Pass through the context
return {
  authenticated: true,
  userId: userId,
  telegramId: telegramId,
  executionId: executionId,
  input: $input.first().json.body
};`
          }
        },
        {
          id: 'http_request',
          name: 'Scrape Competitor Site',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [650, 300],
          parameters: {
            method: 'GET',
            url: '={{ $json.input.url || "https://www.example.com/product" }}',
            options: {
              timeout: 30000,
              followRedirects: true,
              ignoreResponseCode: false,
              response: {
                response: {
                  responseFormat: 'text'
                }
              }
            }
          }
        },
        {
          id: 'html_extract',
          name: 'Extract Price Data',
          type: 'n8n-nodes-base.htmlExtract',
          typeVersion: 1,
          position: [850, 300],
          parameters: {
            extractionValues: {
              values: [
                {
                  key: 'price',
                  cssSelector: '.price, .product-price, [itemprop="price"], .current-price',
                  returnValue: 'text',
                  multiple: false
                },
                {
                  key: 'productName',
                  cssSelector: 'h1, .product-title, [itemprop="name"]',
                  returnValue: 'text',
                  multiple: false
                },
                {
                  key: 'availability',
                  cssSelector: '.availability, .stock-status, [itemprop="availability"]',
                  returnValue: 'text',
                  multiple: false
                }
              ]
            },
            options: {}
          }
        },
        {
          id: 'format_response',
          name: 'Format Response',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [1050, 300],
          parameters: {
            functionCode: `// Format the extracted data
const extractedData = $input.first().json;
const context = $node["Validate Auth Token"].json;

// Clean up price (remove currency symbols, etc)
let price = extractedData.price || 'Not found';
if (price && price !== 'Not found') {
  price = price.replace(/[^0-9.,]/g, '').trim();
}

const result = {
  success: true,
  executionId: context.executionId,
  userId: context.userId,
  telegramId: context.telegramId,
  data: {
    productName: extractedData.productName || 'Unknown Product',
    price: price,
    availability: extractedData.availability || 'Unknown',
    url: context.input.url,
    timestamp: new Date().toISOString()
  },
  creditsConsumed: 5
};

return result;`
          }
        },
        {
          id: 'webhook_response',
          name: 'Respond to Webhook',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [1250, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{ JSON.stringify($json) }}',
            options: {}
          }
        }
      ],
      connections: {
        'Webhook Trigger': {
          main: [[{ node: 'Validate Auth Token', type: 'main', index: 0 }]]
        },
        'Validate Auth Token': {
          main: [[{ node: 'Scrape Competitor Site', type: 'main', index: 0 }]]
        },
        'Scrape Competitor Site': {
          main: [[{ node: 'Extract Price Data', type: 'main', index: 0 }]]
        },
        'Extract Price Data': {
          main: [[{ node: 'Format Response', type: 'main', index: 0 }]]
        },
        'Format Response': {
          main: [[{ node: 'Respond to Webhook', type: 'main', index: 0 }]]
        }
      },
      settings: {
        executionOrder: 'v1'
      },
      staticData: {}
    };

    try {
      // Create the workflow
      const response = await axios.post(
        `${this.apiUrl}/workflows`,
        workflow,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(chalk.green('✅ Workflow created successfully!'));
      console.log(chalk.blue(`Workflow ID: ${response.data.id}`));
      console.log(chalk.blue(`Workflow Name: ${response.data.name}`));
      console.log(chalk.yellow(`Webhook URL: ${this.baseUrl}/webhook/competitor-monitor`));
      
      return response.data;
    } catch (error) {
      console.log(chalk.red('❌ Failed to create workflow:'), error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test the created workflow
   */
  async testWorkflow() {
    console.log(chalk.cyan('\n🧪 Testing the workflow...\n'));

    const testPayload = {
      url: 'https://www.amazon.com/dp/B0CHX2F5HT', // Example product
      productType: 'electronics'
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': 'test-user-123',
      'X-Telegram-Id': '987654321',
      'X-Execution-Id': 'test-exec-' + Date.now(),
      'X-Auth-Token': 'test-token-xyz',
      'X-User-Tier': 'pro'
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/webhook/competitor-monitor`,
        testPayload,
        {
          headers,
          timeout: 30000
        }
      );

      console.log(chalk.green('✅ Workflow test successful!'));
      console.log(chalk.blue('Response:'), JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(chalk.yellow('⚠️  Workflow not active. Please activate it in n8n UI.'));
      } else {
        console.log(chalk.red('❌ Workflow test failed:'), error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Create a simple test workflow
   */
  async createSimpleTestWorkflow() {
    console.log(chalk.cyan('\n🔧 Creating simple test workflow...\n'));

    const workflow = {
      name: 'B2C Simple Echo Test',
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1.1,
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: 'echo-test',
            responseMode: 'onReceived',
            responseData: 'allEntries'
          }
        },
        {
          id: 'respond',
          name: 'Respond',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{ JSON.stringify({ "echo": $json.body, "headers": $json.headers, "timestamp": new Date().toISOString() }) }}',
            options: {}
          }
        }
      ],
      connections: {
        'Webhook': {
          main: [[{ node: 'Respond', type: 'main', index: 0 }]]
        }
      },
      settings: {},
      staticData: {}
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/workflows`,
        workflow,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(chalk.green('✅ Simple test workflow created!'));
      console.log(chalk.blue(`Test URL: ${this.baseUrl}/webhook/echo-test`));
      
      // Cannot test immediately as workflow needs to be activated manually
      console.log(chalk.yellow('\n⚠️  Workflow created but needs manual activation.'));
      console.log(chalk.blue('Activate it in n8n UI to test.'));
      
      return response.data;
    } catch (error) {
      console.log(chalk.red('Failed:'), error.response?.data || error.message);
      throw error;
    }
  }

  async run() {
    try {
      // First create a simple test workflow
      await this.createSimpleTestWorkflow();
      
      // Then create the competitor monitoring workflow
      const workflow = await this.createCompetitorMonitorWorkflow();
      
      // Try to activate it
      console.log(chalk.cyan('\n⚡ Attempting to activate workflow...'));
      try {
        await axios.patch(
          `${this.apiUrl}/workflows/${workflow.id}`,
          { active: true },
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(chalk.green('✅ Workflow activated!'));
        
        // Test the workflow
        await this.testWorkflow();
      } catch (activationError) {
        console.log(chalk.yellow('⚠️  Could not activate workflow programmatically.'));
        console.log(chalk.blue('Please activate it manually in n8n UI.'));
      }
      
      console.log(chalk.bold.green('\n🎉 Workflow creation complete!'));
      console.log(chalk.cyan('Next steps:'));
      console.log('1. Check the workflow in n8n UI');
      console.log('2. Activate it if not already active');
      console.log('3. Test with the orchestration service');
      
    } catch (error) {
      console.log(chalk.red('\n❌ Workflow creation failed'));
      process.exit(1);
    }
  }
}

// Run the workflow creator
if (require.main === module) {
  const creator = new N8nWorkflowCreator();
  creator.run().catch(console.error);
}

module.exports = N8nWorkflowCreator;