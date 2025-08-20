#!/usr/bin/env node

/**
 * Deploy a simple AI agent workflow without LangChain nodes
 */

require('dotenv').config();
const fs = require('fs').promises;

const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjU1NTA5fQ.DKPBT396-Ni_nn3K5R2JD8WzfMyEMnQAJq4xKB0QcUI';
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://clixen.app.n8n.cloud';

async function createSimpleAIAgent() {
    console.log('🎨 Creating Simple AI Agent Workflow...');
    
    const workflow = {
        name: 'Simple AI Agent with Chat & Tools',
        nodes: [
            // 1. Chat Webhook
            {
                parameters: {
                    httpMethod: 'POST',
                    path: 'simple-ai-chat',
                    responseMode: 'responseNode'
                },
                id: 'webhook',
                name: 'Chat Interface',
                type: 'n8n-nodes-base.webhook',
                typeVersion: 2,
                position: [250, 400]
            },
            
            // 2. Parse Message
            {
                parameters: {
                    mode: 'runOnceForEachItem',
                    jsCode: `// Parse incoming message and determine intent
const message = ($input.first().json.message || $input.first().json.query || '').toLowerCase();
const sessionId = $input.first().json.sessionId || 'session-' + Date.now();

// Determine what the user wants
let intent = 'general';
let needsWeather = false;
let needsNews = false;
let needsCalculation = false;
let needsHelp = false;

if (message.includes('weather') || message.includes('temperature')) {
    intent = 'weather';
    needsWeather = true;
}
if (message.includes('news') || message.includes('headline')) {
    intent = 'news';
    needsNews = true;
}
if (message.includes('calculate') || message.includes('math') || /\\d+[\\+\\-\\*\\/]\\d+/.test(message)) {
    intent = 'calculation';
    needsCalculation = true;
}
if (message.includes('help') || message.includes('what can you do')) {
    intent = 'help';
    needsHelp = true;
}

return {
    originalMessage: message,
    sessionId: sessionId,
    intent: intent,
    needsWeather,
    needsNews,
    needsCalculation,
    needsHelp,
    timestamp: new Date().toISOString()
};`
                },
                id: 'parse-message',
                name: 'Parse Message',
                type: 'n8n-nodes-base.code',
                typeVersion: 2,
                position: [450, 400]
            },
            
            // 3. Router
            {
                parameters: {
                    conditions: {
                        options: {
                            caseSensitive: false,
                            leftValue: '',
                            typeValidation: 'strict'
                        },
                        conditions: [
                            {
                                leftValue: '={{ $json.intent }}',
                                rightValue: 'weather',
                                operator: {
                                    type: 'string',
                                    operation: 'equals'
                                }
                            }
                        ],
                        combinator: 'or'
                    },
                    options: {}
                },
                id: 'router-weather',
                name: 'Is Weather?',
                type: 'n8n-nodes-base.if',
                typeVersion: 2,
                position: [650, 300]
            },
            
            // 4. Weather Service
            {
                parameters: {
                    mode: 'runOnceForEachItem',
                    jsCode: `// Weather Service
const locations = ['Everett, MA', 'Boston', 'New York', 'Los Angeles'];
const location = locations.find(loc => $json.originalMessage.includes(loc.toLowerCase())) || 'Everett, MA';

const weatherData = {
    location: location,
    temperature: Math.floor(Math.random() * 30) + 60,
    condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 40) + 40,
    windSpeed: Math.floor(Math.random() * 15) + 5
};

return {
    ...($input.first().json),
    weatherResponse: \`🌤️ Weather in \${weatherData.location}:\\n• Temperature: \${weatherData.temperature}°F\\n• Condition: \${weatherData.condition}\\n• Humidity: \${weatherData.humidity}%\\n• Wind: \${weatherData.windSpeed} mph\`,
    toolUsed: 'weather'
};`
                },
                id: 'weather-service',
                name: 'Weather Service',
                type: 'n8n-nodes-base.code',
                typeVersion: 2,
                position: [850, 250]
            },
            
            // 5. News Service
            {
                parameters: {
                    conditions: {
                        options: {
                            caseSensitive: false
                        },
                        conditions: [
                            {
                                leftValue: '={{ $json.intent }}',
                                rightValue: 'news',
                                operator: {
                                    type: 'string',
                                    operation: 'equals'
                                }
                            }
                        ]
                    }
                },
                id: 'router-news',
                name: 'Is News?',
                type: 'n8n-nodes-base.if',
                typeVersion: 2,
                position: [650, 500]
            },
            
            {
                parameters: {
                    mode: 'runOnceForEachItem',
                    jsCode: `// News Service
const newsTopics = {
    tech: ['AI breakthrough in language models', 'New smartphone features announced', 'Cybersecurity alert issued'],
    local: ['Community center opens new programs', 'Local park renovation complete', 'City council meeting highlights'],
    world: ['Climate summit reaches agreement', 'Global economy shows signs of recovery', 'Scientific discovery announced']
};

const topic = $json.originalMessage.includes('tech') ? 'tech' : 
             $json.originalMessage.includes('local') ? 'local' : 'world';

const headlines = newsTopics[topic];

return {
    ...($input.first().json),
    newsResponse: \`📰 Latest \${topic} news:\\n\${headlines.map((h, i) => \`\${i+1}. \${h}\`).join('\\n')}\`,
    toolUsed: 'news'
};`
                },
                id: 'news-service',
                name: 'News Service',
                type: 'n8n-nodes-base.code',
                typeVersion: 2,
                position: [850, 450]
            },
            
            // 6. General AI Response
            {
                parameters: {
                    mode: 'runOnceForEachItem',
                    jsCode: `// AI Response Generator
const message = $json.originalMessage;
const intent = $json.intent;

// Check if we have tool responses
const weatherResponse = $json.weatherResponse || '';
const newsResponse = $json.newsResponse || '';

// Generate appropriate response
let response = '';

if (weatherResponse) {
    response = weatherResponse;
} else if (newsResponse) {
    response = newsResponse;
} else if (intent === 'help' || message.includes('help')) {
    response = \`🤖 I'm your AI Assistant! I can help you with:\\n\\n• 🌤️ Weather information\\n• 📰 Latest news\\n• 🧮 Calculations\\n• 💬 General conversation\\n\\nJust ask me anything!\`;
} else if (message.includes('hello') || message.includes('hi')) {
    response = 'Hello! How can I help you today? I can provide weather updates, news, or just chat!';
} else if (intent === 'calculation') {
    try {
        const match = message.match(/\\d+[\\+\\-\\*\\/]\\d+/);
        if (match) {
            const result = eval(match[0]);
            response = \`🧮 \${match[0]} = \${result}\`;
        } else {
            response = '🧮 Please provide a calculation like "2+2" or "10*5"';
        }
    } catch {
        response = '🧮 I can help with calculations! Try asking "What is 2+2?"';
    }
} else {
    response = \`I understand you're asking about "\${message}". I can help with weather, news, calculations, or general questions. What would you like to know?\`;
}

return {
    sessionId: $json.sessionId,
    response: response,
    intent: intent,
    toolsUsed: $json.toolUsed ? [$json.toolUsed] : [],
    timestamp: new Date().toISOString()
};`
                },
                id: 'ai-response',
                name: 'AI Response',
                type: 'n8n-nodes-base.code',
                typeVersion: 2,
                position: [1050, 400]
            },
            
            // 7. Format Response
            {
                parameters: {
                    mode: 'runOnceForEachItem',
                    jsCode: `// Format final response
return {
    success: true,
    sessionId: $json.sessionId,
    response: $json.response,
    metadata: {
        intent: $json.intent,
        toolsUsed: $json.toolsUsed,
        timestamp: $json.timestamp,
        processingTime: Date.now() - new Date($node["parse-message"].json.timestamp).getTime() + 'ms'
    }
};`
                },
                id: 'format-response',
                name: 'Format Response',
                type: 'n8n-nodes-base.code',
                typeVersion: 2,
                position: [1250, 400]
            },
            
            // 8. Send Response
            {
                parameters: {
                    respondWith: 'json',
                    responseBody: '={{ $json }}'
                },
                id: 'send-response',
                name: 'Send Response',
                type: 'n8n-nodes-base.respondToWebhook',
                typeVersion: 1,
                position: [1450, 400]
            }
        ],
        
        connections: {
            'webhook': {
                main: [[{ node: 'parse-message', type: 'main', index: 0 }]]
            },
            'parse-message': {
                main: [
                    [{ node: 'router-weather', type: 'main', index: 0 }],
                    [{ node: 'router-news', type: 'main', index: 0 }]
                ]
            },
            'router-weather': {
                main: [
                    [{ node: 'weather-service', type: 'main', index: 0 }], // True
                    [{ node: 'ai-response', type: 'main', index: 0 }]      // False
                ]
            },
            'weather-service': {
                main: [[{ node: 'ai-response', type: 'main', index: 0 }]]
            },
            'router-news': {
                main: [
                    [{ node: 'news-service', type: 'main', index: 0 }],    // True
                    [{ node: 'ai-response', type: 'main', index: 0 }]      // False
                ]
            },
            'news-service': {
                main: [[{ node: 'ai-response', type: 'main', index: 0 }]]
            },
            'ai-response': {
                main: [[{ node: 'format-response', type: 'main', index: 0 }]]
            },
            'format-response': {
                main: [[{ node: 'send-response', type: 'main', index: 0 }]]
            }
        },
        
        settings: {
            executionOrder: 'v1'
        }
    };
    
    return workflow;
}

async function deploy() {
    const workflow = await createSimpleAIAgent();
    
    // Save workflow
    await fs.writeFile('/root/repo/workflows/simple-ai-agent.json', JSON.stringify(workflow, null, 2));
    console.log('💾 Workflow saved');
    
    console.log('\n🚀 Deploying to n8n...');
    
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
            console.log('✅ Deployed successfully!');
            console.log(`📋 Workflow ID: ${result.id}`);
            
            // Try to activate
            console.log('\n⚡ Activating...');
            const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${result.id}/activate`, {
                method: 'POST',
                headers: {
                    'X-N8N-API-KEY': N8N_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (activateResponse.ok) {
                console.log('✅ Workflow activated!');
            } else {
                console.log('⚠️ Activation response:', await activateResponse.text());
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ SIMPLE AI AGENT DEPLOYED!');
            console.log('='.repeat(60));
            console.log(`🔗 Dashboard: ${N8N_BASE_URL}/workflow/${result.id}`);
            console.log('\n📡 Test commands:');
            console.log(`curl -X POST ${N8N_BASE_URL}/webhook/simple-ai-chat \\`);
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"message": "What is the weather like?"}\'');
            console.log();
            console.log(`curl -X POST ${N8N_BASE_URL}/webhook/simple-ai-chat \\`);
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"message": "Give me the latest news"}\'');
            
            return result;
        } else {
            console.error('❌ Deployment failed:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

deploy().catch(console.error);