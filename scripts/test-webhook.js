#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const { program } = require('commander');
require('dotenv').config();

class WebhookTester {
  constructor() {
    this.webhookBase = process.env.N8N_WEBHOOK_URL || 'https://clixen.app.n8n.cloud/webhook';
  }

  async testEndpoint(endpoint, payload, options = {}) {
    const url = `${this.webhookBase}/${endpoint}`;
    console.log(chalk.blue(`\n🔗 Testing webhook: ${url}`));
    console.log(chalk.gray('Payload:'), JSON.stringify(payload, null, 2));

    try {
      const startTime = Date.now();
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 30000
      });

      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`\n✓ Success (${duration}ms)`));
      console.log(chalk.gray('Response:'));
      console.log(JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        duration,
        statusCode: response.status,
        data: response.data
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(chalk.red(`\n✗ Failed (${duration}ms)`));
      
      if (error.response) {
        console.log(chalk.red(`Status: ${error.response.status}`));
        console.log(chalk.red(`Error: ${JSON.stringify(error.response.data, null, 2)}`));
      } else if (error.request) {
        console.log(chalk.red('No response received'));
        console.log(chalk.yellow('Tip: Check if the workflow is active in n8n'));
      } else {
        console.log(chalk.red(`Error: ${error.message}`));
      }
      
      return {
        success: false,
        duration,
        error: error.message
      };
    }
  }

  async testCustomerSupport() {
    const testPayloads = [
      {
        query: "How do I reset my password?",
        context: {
          userId: "test-user-001",
          channel: "web",
          priority: "medium"
        }
      },
      {
        query: "I need help with my recent order #12345",
        context: {
          userId: "test-user-002",
          channel: "mobile",
          priority: "high",
          orderId: "12345"
        }
      }
    ];

    console.log(chalk.bold.cyan('\n🤖 Testing Customer Support Agent\n'));
    
    for (const payload of testPayloads) {
      await this.testEndpoint('customer-support', payload);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async testContentGeneration() {
    const testPayloads = [
      {
        content_type: "blog_post",
        topic: "The Future of AI in 2024",
        tone: "professional",
        length: 500
      },
      {
        content_type: "social_media",
        topic: "Cloud Computing Benefits",
        tone: "casual",
        platform: "linkedin",
        length: 150
      }
    ];

    console.log(chalk.bold.cyan('\n✍️ Testing Content Generation Agent\n'));
    
    for (const payload of testPayloads) {
      await this.testEndpoint('generate-content', payload);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async testOrchestrator() {
    const payload = {
      task: "Research and create a comprehensive report about quantum computing",
      subtasks: [
        "research",
        "analysis",
        "generation",
        "validation"
      ],
      output_format: "detailed_report"
    };

    console.log(chalk.bold.cyan('\n🎯 Testing Multi-Agent Orchestrator\n'));
    await this.testEndpoint('orchestrate', payload);
  }

  async runInteractiveTest() {
    console.log(chalk.bold.cyan('\n🔧 Interactive Webhook Test\n'));
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => readline.question(prompt, resolve));

    const endpoint = await question(chalk.yellow('Enter webhook endpoint (e.g., customer-support): '));
    const payloadStr = await question(chalk.yellow('Enter JSON payload: '));
    
    try {
      const payload = JSON.parse(payloadStr);
      await this.testEndpoint(endpoint, payload);
    } catch (error) {
      console.log(chalk.red('Invalid JSON payload'));
    }

    readline.close();
  }

  async healthCheck() {
    console.log(chalk.bold.cyan('\n🏥 N8N Instance Health Check\n'));
    console.log(chalk.gray(`Instance: ${this.webhookBase}`));
    
    // Test a simple webhook to see if instance is responding
    const testPayload = { test: true, timestamp: new Date().toISOString() };
    
    const endpoints = ['customer-support', 'generate-content', 'orchestrate'];
    const results = [];

    for (const endpoint of endpoints) {
      console.log(chalk.blue(`\nChecking: /${endpoint}`));
      const result = await this.testEndpoint(endpoint, testPayload, { timeout: 5000 });
      results.push({ endpoint, ...result });
    }

    console.log(chalk.bold.cyan('\n📊 Health Check Summary\n'));
    results.forEach(r => {
      const status = r.success ? chalk.green('✓ Active') : chalk.red('✗ Inactive');
      console.log(`${r.endpoint}: ${status}`);
    });
  }
}

// CLI Setup
program
  .version('1.0.0')
  .description('N8N Webhook Testing Tool');

program
  .command('customer-support')
  .description('Test customer support agent workflow')
  .action(async () => {
    const tester = new WebhookTester();
    await tester.testCustomerSupport();
  });

program
  .command('content')
  .description('Test content generation workflow')
  .action(async () => {
    const tester = new WebhookTester();
    await tester.testContentGeneration();
  });

program
  .command('orchestrator')
  .description('Test multi-agent orchestrator')
  .action(async () => {
    const tester = new WebhookTester();
    await tester.testOrchestrator();
  });

program
  .command('health')
  .description('Check health of all webhooks')
  .action(async () => {
    const tester = new WebhookTester();
    await tester.healthCheck();
  });

program
  .command('interactive')
  .description('Interactive webhook testing')
  .action(async () => {
    const tester = new WebhookTester();
    await tester.runInteractiveTest();
  });

program
  .command('custom <endpoint>')
  .description('Test custom endpoint with payload')
  .option('-p, --payload <json>', 'JSON payload', '{}')
  .action(async (endpoint, options) => {
    const tester = new WebhookTester();
    try {
      const payload = JSON.parse(options.payload);
      await tester.testEndpoint(endpoint, payload);
    } catch (error) {
      console.log(chalk.red('Invalid JSON payload'));
    }
  });

// Default action
if (process.argv.length === 2) {
  console.log(chalk.bold.cyan('N8N Webhook Tester'));
  console.log(chalk.gray('\nUsage: node test-webhook.js [command]\n'));
  console.log('Commands:');
  console.log('  customer-support  Test customer support workflow');
  console.log('  content          Test content generation workflow');
  console.log('  orchestrator     Test multi-agent orchestrator');
  console.log('  health           Check all webhook health');
  console.log('  interactive      Interactive testing mode');
  console.log('  custom <endpoint> Test custom endpoint');
  console.log('\nExample:');
  console.log('  node test-webhook.js customer-support');
  console.log('  node test-webhook.js custom my-webhook -p \'{"test":true}\'');
}

program.parse(process.argv);

module.exports = WebhookTester;