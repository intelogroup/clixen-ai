#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class N8NWorkflowGenerator {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  // Generate AI-powered customer service workflow
  generateCustomerServiceWorkflow() {
    return {
      name: "AI Customer Service Agent",
      nodes: [
        {
          id: "webhook",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1.1,
          position: [250, 300],
          webhookId: "customer-service-ai",
          parameters: {
            path: "customer-service-ai",
            method: "POST",
            responseMode: "responseNode",
            options: {}
          }
        },
        {
          id: "set_context",
          name: "Set Context",
          type: "n8n-nodes-base.set",
          typeVersion: 3,
          position: [450, 300],
          parameters: {
            mode: "manual",
            duplicateItem: false,
            assignments: [
              {
                name: "customer_query",
                type: "string",
                value: "={{ $json.query }}"
              },
              {
                name: "customer_id",
                type: "string", 
                value: "={{ $json.customer_id || 'anonymous' }}"
              },
              {
                name: "timestamp",
                type: "string",
                value: "={{ new Date().toISOString() }}"
              }
            ]
          }
        },
        {
          id: "ai_classifier",
          name: "AI Query Classifier",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1,
          position: [650, 200],
          parameters: {
            operation: "text",
            modelId: "gpt-4",
            prompt: "Classify this customer query into one of these categories: technical_support, billing, general_inquiry, complaint, feedback. Query: {{ $json.customer_query }}\n\nRespond with only the category name.",
            maxTokens: 50,
            temperature: 0.3
          }
        },
        {
          id: "switch",
          name: "Route by Category",
          type: "n8n-nodes-base.switch",
          typeVersion: 3,
          position: [850, 300],
          parameters: {
            mode: "expression",
            outputsAmount: 5,
            rules: [
              {
                output: 0,
                operation: "contains",
                value: "={{ $json.message }}",
                value2: "technical_support"
              },
              {
                output: 1,
                operation: "contains",
                value: "={{ $json.message }}",
                value2: "billing"
              },
              {
                output: 2,
                operation: "contains",
                value: "={{ $json.message }}",
                value2: "general_inquiry"
              },
              {
                output: 3,
                operation: "contains",
                value: "={{ $json.message }}",
                value2: "complaint"
              },
              {
                output: 4,
                operation: "contains",
                value: "={{ $json.message }}",
                value2: "feedback"
              }
            ]
          }
        },
        {
          id: "ai_responder",
          name: "AI Response Generator",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1,
          position: [1050, 300],
          parameters: {
            operation: "text",
            modelId: "gpt-4",
            prompt: "You are a helpful customer service agent. Provide a professional and helpful response to this query: {{ $('set_context').item.json.customer_query }}\n\nCategory: {{ $json.message }}\n\nProvide a clear, concise, and helpful response.",
            maxTokens: 500,
            temperature: 0.7
          }
        },
        {
          id: "format_response",
          name: "Format Response",
          type: "n8n-nodes-base.set",
          typeVersion: 3,
          position: [1250, 300],
          parameters: {
            mode: "manual",
            assignments: [
              {
                name: "response",
                type: "string",
                value: "={{ $json.message }}"
              },
              {
                name: "category",
                type: "string",
                value: "={{ $('ai_classifier').item.json.message }}"
              },
              {
                name: "customer_id",
                type: "string",
                value: "={{ $('set_context').item.json.customer_id }}"
              },
              {
                name: "processed_at",
                type: "string",
                value: "={{ new Date().toISOString() }}"
              },
              {
                name: "status",
                type: "string",
                value: "success"
              }
            ]
          }
        },
        {
          id: "respond",
          name: "Respond to Webhook",
          type: "n8n-nodes-base.respondToWebhook",
          typeVersion: 1,
          position: [1450, 300],
          parameters: {
            responseMode: "json",
            responseCode: 200
          }
        }
      ],
      connections: {
        "webhook": {
          "main": [[{"node": "set_context", "type": "main", "index": 0}]]
        },
        "set_context": {
          "main": [[{"node": "ai_classifier", "type": "main", "index": 0}]]
        },
        "ai_classifier": {
          "main": [[{"node": "switch", "type": "main", "index": 0}]]
        },
        "switch": {
          "main": [
            [{"node": "ai_responder", "type": "main", "index": 0}],
            [{"node": "ai_responder", "type": "main", "index": 0}],
            [{"node": "ai_responder", "type": "main", "index": 0}],
            [{"node": "ai_responder", "type": "main", "index": 0}],
            [{"node": "ai_responder", "type": "main", "index": 0}]
          ]
        },
        "ai_responder": {
          "main": [[{"node": "format_response", "type": "main", "index": 0}]]
        },
        "format_response": {
          "main": [[{"node": "respond", "type": "main", "index": 0}]]
        }
      },
      settings: {
        executionTimeout: 60,
        maxExecutionTime: 120,
        saveDataSuccessExecution: "all",
        saveDataErrorExecution: "all",
        saveManualExecutions: true
      }
    };
  }

  // Generate data processing workflow with AI
  generateDataProcessingWorkflow() {
    return {
      name: "AI Data Processing Pipeline",
      nodes: [
        {
          id: "schedule",
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1.1,
          position: [250, 300],
          parameters: {
            rule: {
              interval: [
                {
                  field: "hours",
                  hoursInterval: 1
                }
              ]
            }
          }
        },
        {
          id: "http_request",
          name: "Fetch Data",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.1,
          position: [450, 300],
          parameters: {
            method: "GET",
            url: "https://api.example.com/data",
            options: {
              timeout: 10000
            }
          }
        },
        {
          id: "ai_analyzer",
          name: "AI Data Analyzer",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1,
          position: [650, 300],
          parameters: {
            operation: "text",
            modelId: "gpt-4",
            prompt: "Analyze this data and provide insights:\n\n{{ JSON.stringify($json) }}\n\nProvide:\n1. Key patterns\n2. Anomalies\n3. Recommendations\n\nFormat as JSON.",
            maxTokens: 1000,
            temperature: 0.3
          }
        },
        {
          id: "code",
          name: "Process Results",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [850, 300],
          parameters: {
            mode: "runOnceForEachItem",
            jsCode: `// Parse AI response and structure data
try {
  const aiResponse = $input.item.json.message;
  const parsed = JSON.parse(aiResponse);
  
  return {
    json: {
      insights: parsed,
      original_data: $('http_request').item.json,
      processed_at: new Date().toISOString(),
      status: 'processed'
    }
  };
} catch (error) {
  return {
    json: {
      error: error.message,
      raw_response: $input.item.json.message,
      status: 'error'
    }
  };
}`
          }
        },
        {
          id: "store_results",
          name: "Store Results",
          type: "n8n-nodes-base.postgres",
          typeVersion: 2.3,
          position: [1050, 300],
          parameters: {
            operation: "insert",
            table: "processed_data",
            columns: "data,insights,processed_at",
            options: {}
          }
        },
        {
          id: "notify",
          name: "Send Notification",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 2.1,
          position: [1250, 300],
          parameters: {
            fromEmail: "n8n@example.com",
            toEmail: "team@example.com",
            subject: "Data Processing Complete",
            text: "Data has been processed successfully.\n\nInsights: {{ $json.insights }}",
            options: {}
          }
        }
      ],
      connections: {
        "schedule": {
          "main": [[{"node": "http_request", "type": "main", "index": 0}]]
        },
        "http_request": {
          "main": [[{"node": "ai_analyzer", "type": "main", "index": 0}]]
        },
        "ai_analyzer": {
          "main": [[{"node": "code", "type": "main", "index": 0}]]
        },
        "code": {
          "main": [[{"node": "store_results", "type": "main", "index": 0}]]
        },
        "store_results": {
          "main": [[{"node": "notify", "type": "main", "index": 0}]]
        }
      },
      settings: {
        executionTimeout: 300,
        saveDataSuccessExecution: "all",
        saveDataErrorExecution: "all"
      }
    };
  }

  // Generate integration workflow
  generateIntegrationWorkflow() {
    return {
      name: "Multi-System Integration with AI",
      nodes: [
        {
          id: "webhook",
          name: "Webhook Trigger",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1.1,
          position: [250, 400],
          parameters: {
            path: "integrate",
            method: "POST",
            responseMode: "responseNode"
          }
        },
        {
          id: "validate",
          name: "Validate Input",
          type: "n8n-nodes-base.if",
          typeVersion: 2,
          position: [450, 400],
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict"
              },
              combineConditions: "and",
              conditions: [
                {
                  leftValue: "={{ $json.action }}",
                  rightValue: "",
                  operator: {
                    type: "string",
                    operation: "notEmpty"
                  }
                }
              ]
            }
          }
        },
        {
          id: "ai_router",
          name: "AI Action Router",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1,
          position: [650, 400],
          parameters: {
            operation: "text",
            modelId: "gpt-3.5-turbo",
            prompt: "Based on this action request, determine which system to integrate with:\n\nAction: {{ $json.action }}\nData: {{ JSON.stringify($json.data) }}\n\nRespond with one of: CRM, ERP, SLACK, DATABASE, EMAIL\n\nResponse:",
            maxTokens: 50,
            temperature: 0.2
          }
        },
        {
          id: "switch",
          name: "System Router",
          type: "n8n-nodes-base.switch",
          typeVersion: 3,
          position: [850, 400],
          parameters: {
            mode: "expression",
            outputsAmount: 5,
            rules: [
              {
                output: 0,
                operation: "contains",
                value: "={{ $json.message.toUpperCase() }}",
                value2: "CRM"
              },
              {
                output: 1,
                operation: "contains",
                value: "={{ $json.message.toUpperCase() }}",
                value2: "ERP"
              },
              {
                output: 2,
                operation: "contains",
                value: "={{ $json.message.toUpperCase() }}",
                value2: "SLACK"
              },
              {
                output: 3,
                operation: "contains",
                value: "={{ $json.message.toUpperCase() }}",
                value2: "DATABASE"
              },
              {
                output: 4,
                operation: "contains",
                value: "={{ $json.message.toUpperCase() }}",
                value2: "EMAIL"
              }
            ]
          }
        },
        {
          id: "crm_integration",
          name: "CRM Integration",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.1,
          position: [1050, 200],
          parameters: {
            method: "POST",
            url: "https://api.crm.example.com/contacts",
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: "data",
                  value: "={{ $('webhook').item.json.data }}"
                }
              ]
            }
          }
        },
        {
          id: "slack_integration",
          name: "Slack Notification",
          type: "n8n-nodes-base.slack",
          typeVersion: 2.1,
          position: [1050, 400],
          parameters: {
            operation: "post",
            channel: "#integrations",
            text: "New integration action: {{ $('webhook').item.json.action }}",
            otherOptions: {}
          }
        },
        {
          id: "merge",
          name: "Merge Results",
          type: "n8n-nodes-base.merge",
          typeVersion: 3,
          position: [1250, 400],
          parameters: {
            mode: "combine",
            mergeByPosition: true,
            options: {}
          }
        },
        {
          id: "ai_summary",
          name: "AI Summary",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1,
          position: [1450, 400],
          parameters: {
            operation: "text",
            modelId: "gpt-3.5-turbo",
            prompt: "Summarize the integration results:\n\n{{ JSON.stringify($json) }}\n\nProvide a brief success message.",
            maxTokens: 100,
            temperature: 0.5
          }
        },
        {
          id: "respond",
          name: "Webhook Response",
          type: "n8n-nodes-base.respondToWebhook",
          typeVersion: 1,
          position: [1650, 400],
          parameters: {
            responseMode: "json",
            responseCode: 200
          }
        }
      ],
      connections: {
        "webhook": {
          "main": [[{"node": "validate", "type": "main", "index": 0}]]
        },
        "validate": {
          "main": [
            [{"node": "ai_router", "type": "main", "index": 0}],
            [{"node": "respond", "type": "main", "index": 0}]
          ]
        },
        "ai_router": {
          "main": [[{"node": "switch", "type": "main", "index": 0}]]
        },
        "switch": {
          "main": [
            [{"node": "crm_integration", "type": "main", "index": 0}],
            [{"node": "merge", "type": "main", "index": 0}],
            [{"node": "slack_integration", "type": "main", "index": 0}],
            [{"node": "merge", "type": "main", "index": 0}],
            [{"node": "merge", "type": "main", "index": 0}]
          ]
        },
        "crm_integration": {
          "main": [[{"node": "merge", "type": "main", "index": 0}]]
        },
        "slack_integration": {
          "main": [[{"node": "merge", "type": "main", "index": 1}]]
        },
        "merge": {
          "main": [[{"node": "ai_summary", "type": "main", "index": 0}]]
        },
        "ai_summary": {
          "main": [[{"node": "respond", "type": "main", "index": 0}]]
        }
      },
      settings: {
        executionTimeout: 120,
        saveDataSuccessExecution: "all",
        saveDataErrorExecution: "all"
      }
    };
  }

  async createWorkflow(workflowData) {
    try {
      console.log(chalk.blue(`\n📦 Creating workflow: ${workflowData.name}`));
      
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

      console.log(chalk.green(`✓ Created workflow ID: ${response.data.data.id}`));
      return response.data.data;
    } catch (error) {
      console.log(chalk.red(`✗ Failed to create workflow: ${error.response?.data?.message || error.message}`));
      throw error;
    }
  }

  async generateAndDeploy(type) {
    let workflow;
    
    switch(type) {
      case 'customer-service':
        workflow = this.generateCustomerServiceWorkflow();
        break;
      case 'data-processing':
        workflow = this.generateDataProcessingWorkflow();
        break;
      case 'integration':
        workflow = this.generateIntegrationWorkflow();
        break;
      default:
        console.log(chalk.red('Unknown workflow type'));
        return;
    }

    // Save locally
    const fileName = `${type}-generated.json`;
    const filePath = path.join(__dirname, '../workflows/generated', fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
    console.log(chalk.gray(`💾 Saved to: ${filePath}`));

    // Deploy to n8n
    try {
      const deployed = await this.createWorkflow(workflow);
      console.log(chalk.green(`\n✅ Successfully deployed: ${deployed.name}`));
      console.log(chalk.cyan(`   ID: ${deployed.id}`));
      
      if (workflow.nodes[0].type === 'n8n-nodes-base.webhook') {
        const webhookPath = workflow.nodes[0].parameters.path;
        console.log(chalk.cyan(`   Webhook: ${process.env.N8N_WEBHOOK_URL}/${webhookPath}`));
      }
    } catch (error) {
      console.log(chalk.red('\n❌ Deployment failed'));
    }
  }

  async generateAll() {
    console.log(chalk.bold.cyan('\n🚀 Generating N8N Workflows with AI Nodes\n'));
    
    const workflows = ['customer-service', 'data-processing', 'integration'];
    
    for (const type of workflows) {
      await this.generateAndDeploy(type);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(chalk.bold.green('\n✅ All workflows generated successfully!'));
  }
}

// CLI
if (require.main === module) {
  const generator = new N8NWorkflowGenerator();
  const args = process.argv.slice(2);
  
  if (args[0] === 'all') {
    generator.generateAll().catch(console.error);
  } else if (args[0]) {
    generator.generateAndDeploy(args[0]).catch(console.error);
  } else {
    console.log(chalk.cyan('N8N Workflow Generator'));
    console.log(chalk.gray('\nUsage:'));
    console.log('  node workflow-generator.js all                # Generate all workflows');
    console.log('  node workflow-generator.js customer-service   # Generate customer service workflow');
    console.log('  node workflow-generator.js data-processing    # Generate data processing workflow');
    console.log('  node workflow-generator.js integration        # Generate integration workflow');
  }
}

module.exports = N8NWorkflowGenerator;