#!/usr/bin/env node

/**
 * Deploy Telegram AI Assistant Workflow to n8n Cloud
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE_URL = process.env.N8N_BASE_URL;

async function createCompleteWorkflow() {
    console.log('🎨 Creating complete Telegram AI Assistant workflow...');
    
    const workflow = {
        name: 'Telegram AI Assistant - Weather, News & Events',
        nodes: [
            // 1. Webhook/Chat Trigger for testing
            {
                parameters: {
                    httpMethod: 'POST',
                    path: '/telegram-test',
                    responseMode: 'onReceived',
                    responseData: 'allEntries'
                },
                id: 'chat-webhook',
                name: 'Chat Interface',
                type: 'n8n-nodes-base.webhook',
                typeVersion: 2,
                position: [250, 300]
            },
            
            // 2. Telegram Trigger
            {
                parameters: {
                    updates: ['message', 'edited_message']
                },
                id: 'telegram-trigger',
                name: 'Telegram Bot Trigger',
                type: 'n8n-nodes-base.telegramTrigger',
                typeVersion: 1.1,
                position: [250, 500],
                webhookId: `telegram-${Date.now()}`
            },
            
            // 3. Merge node to combine chat and telegram inputs
            {
                parameters: {
                    mode: 'multiplex'
                },
                id: 'merge-inputs',
                name: 'Merge Inputs',
                type: 'n8n-nodes-base.merge',
                typeVersion: 3,
                position: [450, 400]
            },
            
            // 4. AI Agent at CENTER
            {
                parameters: {
                    sessionIdType: 'fromInput',
                    text: '={{ $json.message?.text || $json.query || "Hello" }}',
                    hasOutputParser: true,
                    options: {
                        systemMessage: `You are a helpful AI assistant for Telegram users. You have access to:
- Weather information for any location (especially Everett, MA)
- Latest news and headlines 
- Local events information
- Database for storing user preferences and history

When a user asks about weather, news, or events for a location (like Everett, MA), provide that information.
For weather requests, respond with current conditions and forecast.
For news requests, provide latest headlines and summaries.
For events, list upcoming local events.

Always be helpful and conversational. If you can't find specific information, let the user know and suggest alternatives.`,
                        temperature: 0.7,
                        maxTokens: 500
                    }
                },
                id: 'ai-agent-center',
                name: 'AI Agent (Central Hub)',
                type: 'n8n-nodes-langchain.agent',
                typeVersion: 1.2,
                position: [650, 400] // CENTER position
            },
            
            // 5. Weather Tool
            {
                parameters: {
                    operation: 'currentWeather',
                    cityName: 'Everett, MA',
                    additionalFields: {
                        units: 'imperial',
                        language: 'en'
                    }
                },
                id: 'weather-tool',
                name: 'Weather API',
                type: 'n8n-nodes-base.openWeatherMap',
                typeVersion: 1,
                position: [450, 200]
            },
            
            // 6. News Tool
            {
                parameters: {
                    method: 'GET',
                    url: 'https://newsapi.org/v2/everything',
                    sendQuery: true,
                    queryParameters: {
                        parameters: [
                            { name: 'q', value: 'Everett Massachusetts OR Boston news' },
                            { name: 'sortBy', value: 'publishedAt' },
                            { name: 'pageSize', value: '5' },
                            { name: 'language', value: 'en' }
                        ]
                    },
                    sendHeaders: true,
                    headerParameters: {
                        parameters: [
                            { name: 'X-API-Key', value: '{{ $credentials.newsApiKey }}' }
                        ]
                    },
                    options: {
                        timeout: 10000,
                        response: {
                            response: {
                                fullResponse: false,
                                responseFormat: 'json'
                            }
                        }
                    }
                },
                id: 'news-tool',
                name: 'News API',
                type: 'n8n-nodes-base.httpRequest',
                typeVersion: 4.1,
                position: [850, 200]
            },
            
            // 7. Events Tool (using Eventbrite alternative - Google Calendar or generic events)
            {
                parameters: {
                    method: 'GET',
                    url: 'https://serpapi.com/search',
                    sendQuery: true,
                    queryParameters: {
                        parameters: [
                            { name: 'engine', value: 'google_events' },
                            { name: 'q', value: 'events in Everett Massachusetts today' },
                            { name: 'location', value: 'Everett, MA' },
                            { name: 'api_key', value: '{{ $credentials.serpApiKey }}' }
                        ]
                    },
                    options: {
                        timeout: 10000
                    }
                },
                id: 'events-tool',
                name: 'Events API',
                type: 'n8n-nodes-base.httpRequest',
                typeVersion: 4.1,
                position: [850, 600]
            },
            
            // 8. PostgreSQL Memory
            {
                parameters: {
                    operation: 'executeQuery',
                    query: `
                        INSERT INTO conversations (user_id, message, response, timestamp)
                        VALUES (
                            COALESCE($1::text, 'test-user'),
                            $2::text,
                            $3::text,
                            NOW()
                        )
                        ON CONFLICT (user_id) DO UPDATE
                        SET message = $2, response = $3, timestamp = NOW()
                        RETURNING *
                    `,
                    additionalFields: {
                        mode: 'multiple'
                    }
                },
                id: 'postgres-memory',
                name: 'PostgreSQL Memory',
                type: 'n8n-nodes-base.postgres',
                typeVersion: 2.4,
                position: [450, 600]
            },
            
            // 9. Schedule Trigger for morning emails
            {
                parameters: {
                    rule: {
                        interval: [
                            {
                                field: 'hours',
                                hoursInterval: 24,
                                triggerAtHour: 8,
                                triggerAtMinute: 0
                            }
                        ]
                    },
                    timezone: 'America/New_York'
                },
                id: 'schedule-trigger',
                name: 'Morning Schedule',
                type: 'n8n-nodes-base.scheduleTrigger',
                typeVersion: 1.1,
                position: [250, 800]
            },
            
            // 10. Email Send
            {
                parameters: {
                    fromEmail: 'noreply@clixen.ai',
                    toEmail: 'jimkalinov@gmail.com',
                    subject: 'Daily Update: Weather, News & Events for Everett, MA - {{ new Date().toLocaleDateString() }}',
                    html: `
                        <h2>Good Morning! 🌅</h2>
                        <p>Here's your daily update for Everett, MA:</p>
                        
                        <h3>🌤️ Weather:</h3>
                        <div style="background: #f0f8ff; padding: 10px; border-radius: 5px;">
                            {{ $node["weather-tool"].json }}
                        </div>
                        
                        <h3>📰 Top News:</h3>
                        <div style="background: #fff8f0; padding: 10px; border-radius: 5px;">
                            {{ $node["news-tool"].json }}
                        </div>
                        
                        <h3>🎉 Events Today:</h3>
                        <div style="background: #f0fff0; padding: 10px; border-radius: 5px;">
                            {{ $node["events-tool"].json }}
                        </div>
                        
                        <p style="color: #666; font-size: 12px;">
                            Sent automatically by your Telegram AI Assistant
                        </p>
                    `,
                    options: {}
                },
                id: 'email-send',
                name: 'Send Email Report',
                type: 'n8n-nodes-base.emailSend',
                typeVersion: 2.1,
                position: [1050, 800]
            },
            
            // 11. Response Handler (for both Telegram and Chat)
            {
                parameters: {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict'
                        },
                        conditions: [
                            {
                                id: '1',
                                leftValue: '={{ $node["merge-inputs"].json.message?.chat?.id }}',
                                rightValue: '',
                                operator: {
                                    type: 'string',
                                    operation: 'exists'
                                }
                            }
                        ],
                        combinator: 'and'
                    },
                    options: {}
                },
                id: 'response-router',
                name: 'Response Router',
                type: 'n8n-nodes-base.if',
                typeVersion: 2,
                position: [850, 400]
            },
            
            // 12. Telegram Reply
            {
                parameters: {
                    resource: 'message',
                    operation: 'sendMessage',
                    chatId: '={{ $node["merge-inputs"].json.message.chat.id }}',
                    text: '={{ $node["ai-agent-center"].json.output }}',
                    additionalFields: {
                        parse_mode: 'Markdown'
                    }
                },
                id: 'telegram-reply',
                name: 'Reply to Telegram',
                type: 'n8n-nodes-base.telegram',
                typeVersion: 1.1,
                position: [1050, 350]
            },
            
            // 13. Chat Response (for webhook testing)
            {
                parameters: {
                    respondWith: 'json',
                    responseBody: '={{ { "response": $node["ai-agent-center"].json.output, "timestamp": new Date().toISOString() } }}'
                },
                id: 'chat-response',
                name: 'Chat Response',
                type: 'n8n-nodes-base.respondToWebhook',
                typeVersion: 1.1,
                position: [1050, 450]
            }
        ],
        
        connections: {
            // Chat webhook and Telegram trigger → Merge
            'chat-webhook': {
                main: [[{ node: 'merge-inputs', type: 'main', index: 0 }]]
            },
            'telegram-trigger': {
                main: [[{ node: 'merge-inputs', type: 'main', index: 1 }]]
            },
            
            // Merge → AI Agent
            'merge-inputs': {
                main: [[{ node: 'ai-agent-center', type: 'main', index: 0 }]]
            },
            
            // AI Agent → Response Router and Memory
            'ai-agent-center': {
                main: [
                    [{ node: 'response-router', type: 'main', index: 0 }],
                    [{ node: 'postgres-memory', type: 'main', index: 0 }]
                ]
            },
            
            // Response Router → Telegram or Chat response
            'response-router': {
                main: [
                    [{ node: 'telegram-reply', type: 'main', index: 0 }], // True branch
                    [{ node: 'chat-response', type: 'main', index: 0 }]  // False branch
                ]
            },
            
            // Schedule → Data gathering for email
            'schedule-trigger': {
                main: [
                    [{ node: 'weather-tool', type: 'main', index: 0 }],
                    [{ node: 'news-tool', type: 'main', index: 0 }],
                    [{ node: 'events-tool', type: 'main', index: 0 }]
                ]
            },
            
            // Connect data tools to email (using merge or direct)
            'weather-tool': {
                main: [[{ node: 'email-send', type: 'main', index: 0 }]]
            },
            'news-tool': {
                main: [[{ node: 'email-send', type: 'main', index: 0 }]]
            },
            'events-tool': {
                main: [[{ node: 'email-send', type: 'main', index: 0 }]]
            }
        },
        
        active: false,
        settings: {
            executionOrder: 'v1',
            saveDataSuccessExecution: 'all',
            saveManualExecutions: true,
            callerPolicy: 'workflowsFromSameOwner',
            timezone: 'America/New_York',
            errorWorkflow: null
        },
        staticData: null,
        tags: ['telegram', 'ai-agent', 'weather', 'news', 'events', 'automated', 'chat'],
        triggerCount: 0,
        updatedAt: new Date().toISOString(),
        versionId: null
    };
    
    return workflow;
}

async function deployWorkflow() {
    console.log('\n🚀 Deploying to n8n Cloud...');
    
    if (!N8N_API_KEY || !N8N_BASE_URL) {
        console.error('❌ Missing N8N_API_KEY or N8N_BASE_URL environment variables');
        process.exit(1);
    }
    
    const workflow = await createCompleteWorkflow();
    
    // Save locally first
    const filename = 'telegram-ai-assistant-complete.json';
    const filepath = path.join(__dirname, '..', 'workflows', filename);
    await fs.writeFile(filepath, JSON.stringify(workflow, null, 2));
    console.log(`✅ Saved locally: ${filename}`);
    
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workflow)
        });
        
        if (response.ok) {
            const result = await response.json();
            workflow.id = result.id;
            
            console.log('✅ Workflow deployed successfully!');
            console.log(`📋 Workflow ID: ${result.id}`);
            console.log(`🔗 Workflow URL: ${N8N_BASE_URL}/workflow/${result.id}`);
            
            return result;
        } else {
            const error = await response.text();
            console.error('❌ Deployment failed:', response.status, error);
            return null;
        }
    } catch (error) {
        console.error('❌ Deployment error:', error.message);
        return null;
    }
}

async function activateWorkflow(workflowId) {
    console.log('\n⚡ Activating workflow...');
    
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
            method: 'PATCH',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ active: true })
        });
        
        if (response.ok) {
            console.log('✅ Workflow activated successfully!');
            return true;
        } else {
            const error = await response.text();
            console.error('❌ Activation failed:', response.status, error);
            return false;
        }
    } catch (error) {
        console.error('❌ Activation error:', error.message);
        return false;
    }
}

async function testWorkflow() {
    console.log('\n🧪 Testing workflow with chat interface...');
    
    const testUrl = `${N8N_BASE_URL}/webhook/telegram-test`;
    
    const testMessages = [
        'Hello! What\'s the weather like in Everett, MA?',
        'Give me the latest news about Everett',
        'What events are happening in Everett today?'
    ];
    
    for (const message of testMessages) {
        console.log(`\n📤 Testing: "${message}"`);
        
        try {
            const response = await fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    query: message,
                    user_id: 'test-user-123',
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('📥 Response:', result.response || result);
            } else {
                console.log('⚠️ Test failed:', response.status, await response.text());
            }
        } catch (error) {
            console.log('⚠️ Test error:', error.message);
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 DEPLOYING TELEGRAM AI ASSISTANT WORKFLOW');
    console.log('='.repeat(60));
    
    // Deploy workflow
    const result = await deployWorkflow();
    if (!result) {
        console.error('❌ Deployment failed');
        process.exit(1);
    }
    
    // Activate workflow
    const activated = await activateWorkflow(result.id);
    if (!activated) {
        console.error('❌ Activation failed');
        process.exit(1);
    }
    
    // Wait a moment for activation to take effect
    console.log('\n⏳ Waiting for workflow to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test workflow
    await testWorkflow();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEPLOYMENT AND TESTING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📋 Workflow ID: ${result.id}`);
    console.log(`🔗 n8n Dashboard: ${N8N_BASE_URL}/workflow/${result.id}`);
    console.log(`🌐 Chat Test URL: ${N8N_BASE_URL}/webhook/telegram-test`);
    console.log(`📧 Email reports scheduled for 8 AM daily`);
    console.log('\n🎯 Ready to use! Send POST requests to the webhook URL to test.');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { deployWorkflow, activateWorkflow, testWorkflow };