#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Telegram AI Agent Workflow Creator
 * Creates a comprehensive workflow with:
 * - Telegram trigger for user messages
 * - AI Agent node at the center
 * - Weather, News, Events tools
 * - PostgreSQL for memory
 * - Scheduled email reports
 */
class TelegramAgentWorkflowCreator {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  /**
   * Create the complete Telegram AI Agent workflow
   */
  createWorkflow() {
    console.log(chalk.bold.cyan('\n🤖 Creating Telegram AI Agent Workflow\n'));
    
    const workflow = {
      name: 'Telegram AI Assistant - Weather, News & Events',
      nodes: [],
      connections: {},
      settings: {
        executionOrder: 'v1'
      },
      staticData: {}
    };

    // Node positions for visual layout
    const positions = {
      telegramTrigger: [250, 300],
      messageRouter: [450, 300],
      aiAgent: [750, 300],
      weatherTool: [1050, 100],
      newsTool: [1050, 300],
      eventsTool: [1050, 500],
      postgresMemory: [750, 500],
      responseFormatter: [1350, 300],
      telegramReply: [1550, 300],
      scheduleTrigger: [250, 700],
      morningReportGenerator: [550, 700],
      emailSender: [850, 700],
      errorHandler: [750, 900]
    };

    // 1. Telegram Trigger Node
    workflow.nodes.push({
      name: 'Telegram_Trigger',
      type: 'n8n-nodes-base.telegramTrigger',
      typeVersion: 1.1,
      position: positions.telegramTrigger,
      parameters: {
        updates: ['message', 'edited_message']
      },
      webhookId: 'telegram-webhook-' + Date.now()
    });

    // 2. Message Router Node (to parse user intent)
    workflow.nodes.push({
      name: 'Message_Router',
      type: 'n8n-nodes-base.switch',
      typeVersion: 3,
      position: positions.messageRouter,
      parameters: {
        mode: 'expression',
        outputsAmount: 3,
        options: {
          conditions: [
            {
              outputKey: 'weather',
              conditionValue: '={{ $json.message.text.toLowerCase().includes("weather") }}'
            },
            {
              outputKey: 'news',
              conditionValue: '={{ $json.message.text.toLowerCase().includes("news") }}'
            },
            {
              outputKey: 'events',
              conditionValue: '={{ $json.message.text.toLowerCase().includes("events") }}'
            }
          ]
        }
      }
    });

    // 3. AI Agent Node (Central Intelligence)
    workflow.nodes.push({
      name: 'AI_Agent_Central',
      type: 'n8n-nodes-base.agent',
      typeVersion: 1.7,
      position: positions.aiAgent,
      parameters: {
        promptType: 'define',
        text: `You are a helpful AI assistant for Telegram users. You help with:
1. Weather information for any location
2. Top news for any location
3. Local events happening today
4. Setting up daily email reports

User message: {{ $json.message.text }}
User ID: {{ $json.message.from.id }}
Chat ID: {{ $json.message.chat.id }}

Analyze the user's request and determine what information they need.
Extract location (default: Everett, MA if not specified).
If they mention email, extract the email address for daily reports.

Respond in a friendly, conversational tone.`,
        options: {
          systemMessage: `You are integrated with weather, news, and events APIs. 
You can also schedule daily email reports.
Always be helpful and provide accurate, timely information.
Store user preferences in memory for personalization.`,
          temperature: 0.7,
          maxTokens: 500
        }
      }
    });

    // 4. Weather Tool Node
    workflow.nodes.push({
      name: 'Weather_Tool',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: positions.weatherTool,
      parameters: {
        method: 'GET',
        url: '=https://api.openweathermap.org/data/2.5/weather',
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: 'q',
              value: '={{ $json.location || "Everett,MA,US" }}'
            },
            {
              name: 'appid',
              value: '={{ $env.OPENWEATHER_API_KEY }}'
            },
            {
              name: 'units',
              value: 'imperial'
            }
          ]
        },
        options: {
          response: {
            response: {
              responseFormat: 'json'
            }
          }
        }
      }
    });

    // 5. News Tool Node
    workflow.nodes.push({
      name: 'News_Tool',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: positions.newsTool,
      parameters: {
        method: 'GET',
        url: 'https://newsapi.org/v2/everything',
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: 'q',
              value: '={{ $json.location || "Everett Massachusetts" }}'
            },
            {
              name: 'apiKey',
              value: '={{ $env.NEWS_API_KEY }}'
            },
            {
              name: 'sortBy',
              value: 'publishedAt'
            },
            {
              name: 'pageSize',
              value: '5'
            },
            {
              name: 'from',
              value: '={{ $now.minus({days: 1}).toISO() }}'
            }
          ]
        },
        options: {
          response: {
            response: {
              responseFormat: 'json'
            }
          }
        }
      }
    });

    // 6. Events Tool Node (using SerpAPI or similar)
    workflow.nodes.push({
      name: 'Events_Tool',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: positions.eventsTool,
      parameters: {
        method: 'GET',
        url: 'https://serpapi.com/search',
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: 'q',
              value: '={{ $json.location || "Everett MA" }} events today'
            },
            {
              name: 'api_key',
              value: '={{ $env.SERP_API_KEY }}'
            },
            {
              name: 'engine',
              value: 'google_events'
            },
            {
              name: 'hl',
              value: 'en'
            }
          ]
        },
        options: {
          response: {
            response: {
              responseFormat: 'json'
            }
          }
        }
      }
    });

    // 7. PostgreSQL Memory Node (Store user preferences and history)
    workflow.nodes.push({
      name: 'PostgreSQL_Memory',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2.5,
      position: positions.postgresMemory,
      parameters: {
        operation: 'upsert',
        schema: 'public',
        table: 'telegram_user_memory',
        columns: 'user_id,chat_id,preferences,last_location,email,last_request,updated_at',
        columnToMatchOn: 'user_id',
        valueToMatchOn: '={{ $json.message.from.id }}',
        dataMode: 'defineBelow',
        columnsUi: {
          columns: [
            {
              column: 'user_id',
              value: '={{ $json.message.from.id }}'
            },
            {
              column: 'chat_id',
              value: '={{ $json.message.chat.id }}'
            },
            {
              column: 'preferences',
              value: '={{ JSON.stringify($json.preferences) }}'
            },
            {
              column: 'last_location',
              value: '={{ $json.location || "Everett, MA" }}'
            },
            {
              column: 'email',
              value: '={{ $json.extractedEmail || $json.existingEmail }}'
            },
            {
              column: 'last_request',
              value: '={{ $json.message.text }}'
            },
            {
              column: 'updated_at',
              value: '={{ $now.toISO() }}'
            }
          ]
        },
        options: {
          queryBatching: 'independently'
        }
      }
    });

    // 8. Response Formatter Node
    workflow.nodes.push({
      name: 'Response_Formatter',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: positions.responseFormatter,
      parameters: {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        code: `// Format the response based on what was requested
const items = $input.all();
const results = [];

for (const item of items) {
  let response = '';
  
  // Weather Response
  if (item.json.weather) {
    const w = item.json.weather;
    response += \`🌤 **Weather in \${w.name}**\\n\`;
    response += \`Temperature: \${w.main.temp}°F\\n\`;
    response += \`Feels like: \${w.main.feels_like}°F\\n\`;
    response += \`Conditions: \${w.weather[0].description}\\n\`;
    response += \`Humidity: \${w.main.humidity}%\\n\\n\`;
  }
  
  // News Response
  if (item.json.news && item.json.news.articles) {
    response += \`📰 **Top News**\\n\`;
    const articles = item.json.news.articles.slice(0, 3);
    articles.forEach((article, i) => {
      response += \`\${i + 1}. \${article.title}\\n\`;
      response += \`   \${article.url}\\n\\n\`;
    });
  }
  
  // Events Response
  if (item.json.events && item.json.events.events_results) {
    response += \`📅 **Today's Events**\\n\`;
    const events = item.json.events.events_results.slice(0, 3);
    events.forEach((event, i) => {
      response += \`\${i + 1}. \${event.title}\\n\`;
      if (event.date) response += \`   When: \${event.date.when}\\n\`;
      if (event.address) response += \`   Where: \${event.address}\\n\`;
      response += \`\\n\`;
    });
  }
  
  // Email setup confirmation
  if (item.json.emailSetup) {
    response += \`✅ Daily reports will be sent to: \${item.json.email}\\n\`;
    response += \`You'll receive weather, news, and events every morning at 8 AM.\\n\`;
  }
  
  results.push({
    json: {
      chat_id: item.json.message.chat.id,
      text: response || 'I can help you with weather, news, and events. Just ask!',
      parse_mode: 'Markdown'
    }
  });
}

return results;`
      }
    });

    // 9. Telegram Reply Node
    workflow.nodes.push({
      name: 'Telegram_Reply',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      position: positions.telegramReply,
      parameters: {
        operation: 'sendMessage',
        chatId: '={{ $json.chat_id }}',
        text: '={{ $json.text }}',
        additionalFields: {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }
      }
    });

    // 10. Schedule Trigger for Morning Reports
    workflow.nodes.push({
      name: 'Schedule_Morning_Report',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: positions.scheduleTrigger,
      parameters: {
        rule: {
          interval: [
            {
              field: 'cronExpression',
              expression: '0 8 * * *' // Every day at 8 AM
            }
          ]
        }
      }
    });

    // 11. Morning Report Generator
    workflow.nodes.push({
      name: 'Morning_Report_Generator',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2.5,
      position: positions.morningReportGenerator,
      parameters: {
        operation: 'select',
        schema: 'public',
        table: 'telegram_user_memory',
        returnAll: true,
        where: {
          conditions: [
            {
              column: 'email',
              condition: 'NOT NULL',
              value: ''
            }
          ]
        },
        options: {}
      }
    });

    // 12. Email Sender Node
    workflow.nodes.push({
      name: 'Email_Sender',
      type: 'n8n-nodes-base.emailSend',
      typeVersion: 2.1,
      position: positions.emailSender,
      parameters: {
        fromEmail: '={{ $env.SMTP_FROM_EMAIL }}',
        toEmail: '={{ $json.email }}',
        subject: 'Your Daily Update - Weather, News & Events for {{ $json.last_location }}',
        emailType: 'html',
        htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 20px; }
    .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
    .weather { background: #e8f4f8; }
    .news { background: #fef9e7; }
    .events { background: #f4e8f8; }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🌅 Good Morning! Here's Your Daily Update</h1>
  
  <div class="section weather">
    <h2>🌤 Weather in {{ $json.last_location }}</h2>
    <p><strong>Temperature:</strong> {{ $json.weather.temp }}°F</p>
    <p><strong>Conditions:</strong> {{ $json.weather.description }}</p>
    <p><strong>Humidity:</strong> {{ $json.weather.humidity }}%</p>
  </div>
  
  <div class="section news">
    <h2>📰 Top News</h2>
    {{ $json.news_html }}
  </div>
  
  <div class="section events">
    <h2>📅 Today's Events</h2>
    {{ $json.events_html }}
  </div>
  
  <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
    You're receiving this because you subscribed via Telegram. 
    To unsubscribe, message /stop to our Telegram bot.
  </p>
</body>
</html>`,
        options: {
          allowUnauthorizedCerts: true
        }
      }
    });

    // 13. Error Handler Node
    workflow.nodes.push({
      name: 'Error_Handler',
      type: 'n8n-nodes-base.errorTrigger',
      typeVersion: 1,
      position: positions.errorHandler,
      parameters: {}
    });

    // Create Connections
    workflow.connections = {
      'Telegram_Trigger': {
        main: [[
          { node: 'Message_Router', type: 'main', index: 0 }
        ]]
      },
      'Message_Router': {
        main: [
          [{ node: 'AI_Agent_Central', type: 'main', index: 0 }], // Weather
          [{ node: 'AI_Agent_Central', type: 'main', index: 0 }], // News
          [{ node: 'AI_Agent_Central', type: 'main', index: 0 }]  // Events
        ]
      },
      'AI_Agent_Central': {
        main: [[
          { node: 'Weather_Tool', type: 'main', index: 0 },
          { node: 'News_Tool', type: 'main', index: 0 },
          { node: 'Events_Tool', type: 'main', index: 0 },
          { node: 'PostgreSQL_Memory', type: 'main', index: 0 }
        ]]
      },
      'Weather_Tool': {
        main: [[
          { node: 'Response_Formatter', type: 'main', index: 0 }
        ]]
      },
      'News_Tool': {
        main: [[
          { node: 'Response_Formatter', type: 'main', index: 0 }
        ]]
      },
      'Events_Tool': {
        main: [[
          { node: 'Response_Formatter', type: 'main', index: 0 }
        ]]
      },
      'PostgreSQL_Memory': {
        main: [[
          { node: 'Response_Formatter', type: 'main', index: 0 }
        ]]
      },
      'Response_Formatter': {
        main: [[
          { node: 'Telegram_Reply', type: 'main', index: 0 }
        ]]
      },
      'Schedule_Morning_Report': {
        main: [[
          { node: 'Morning_Report_Generator', type: 'main', index: 0 }
        ]]
      },
      'Morning_Report_Generator': {
        main: [[
          { node: 'Email_Sender', type: 'main', index: 0 }
        ]]
      },
      'Error_Handler': {
        main: [[
          { node: 'Telegram_Reply', type: 'main', index: 0 }
        ]]
      }
    };

    return workflow;
  }

  /**
   * Create PostgreSQL table for memory
   */
  getPostgreSQLSchema() {
    return `
-- Create table for storing user preferences and memory
CREATE TABLE IF NOT EXISTS telegram_user_memory (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  chat_id BIGINT NOT NULL,
  preferences JSONB DEFAULT '{}',
  last_location VARCHAR(255) DEFAULT 'Everett, MA',
  email VARCHAR(255),
  last_request TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_id ON telegram_user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_email ON telegram_user_memory(email) WHERE email IS NOT NULL;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_telegram_user_memory_updated_at 
BEFORE UPDATE ON telegram_user_memory 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
`;
  }

  /**
   * Deploy workflow to n8n
   */
  async deployWorkflow(workflow) {
    console.log(chalk.blue('🚀 Deploying workflow to n8n...'));
    
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
      
      const workflowId = response.data?.data?.id || response.data?.id;
      console.log(chalk.green(`✓ Workflow deployed (ID: ${workflowId})`));
      
      return { success: true, workflowId };
    } catch (error) {
      console.error(chalk.red(`✗ Deployment failed: ${error.response?.data?.message || error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Main execution
   */
  async execute() {
    console.log(chalk.bold.cyan('\n🤖 Telegram AI Agent Workflow Creator\n'));
    
    // Create workflow
    const workflow = this.createWorkflow();
    
    // Save workflow JSON locally
    const outputPath = path.join(__dirname, '../workflows/generated/telegram-ai-agent.json');
    fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
    console.log(chalk.green(`✓ Workflow saved to: ${outputPath}`));
    
    // Display PostgreSQL schema
    console.log(chalk.blue('\n📊 PostgreSQL Schema Required:\n'));
    console.log(chalk.gray(this.getPostgreSQLSchema()));
    
    // Deploy if API configured
    if (this.apiKey && this.baseUrl) {
      const deployment = await this.deployWorkflow(workflow);
      
      if (deployment.success) {
        console.log(chalk.bold.green('\n🎉 Workflow Created Successfully!\n'));
        console.log(chalk.cyan('Features:'));
        console.log(chalk.gray('  • Telegram bot integration'));
        console.log(chalk.gray('  • AI Agent with OpenAI'));
        console.log(chalk.gray('  • Weather API integration'));
        console.log(chalk.gray('  • News API integration'));
        console.log(chalk.gray('  • Events search integration'));
        console.log(chalk.gray('  • PostgreSQL memory storage'));
        console.log(chalk.gray('  • Scheduled morning email reports'));
        console.log(chalk.gray('  • Error handling'));
        
        console.log(chalk.cyan('\n📝 Required Environment Variables:'));
        console.log(chalk.gray('  • TELEGRAM_BOT_TOKEN'));
        console.log(chalk.gray('  • OPENAI_API_KEY'));
        console.log(chalk.gray('  • OPENWEATHER_API_KEY'));
        console.log(chalk.gray('  • NEWS_API_KEY'));
        console.log(chalk.gray('  • SERP_API_KEY'));
        console.log(chalk.gray('  • PostgreSQL connection'));
        console.log(chalk.gray('  • SMTP configuration'));
        
        console.log(chalk.cyan('\n🚀 Next Steps:'));
        console.log(chalk.gray('  1. Configure credentials in n8n'));
        console.log(chalk.gray('  2. Create PostgreSQL table using provided schema'));
        console.log(chalk.gray('  3. Activate the workflow'));
        console.log(chalk.gray('  4. Set up Telegram webhook'));
        console.log(chalk.gray('  5. Test with Telegram messages'));
      }
    } else {
      console.log(chalk.yellow('\n⚠ No n8n API configured - workflow saved locally only'));
    }
    
    return workflow;
  }
}

// Execute if run directly
if (require.main === module) {
  const creator = new TelegramAgentWorkflowCreator();
  creator.execute().catch(console.error);
}

module.exports = TelegramAgentWorkflowCreator;