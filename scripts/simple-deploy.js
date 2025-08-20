#!/usr/bin/env node

/**
 * Simple deployment with correct n8n structure
 */

require('dotenv').config();

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjU1NTA5fQ.DKPBT396-Ni_nn3K5R2JD8WzfMyEMnQAJq4xKB0QcUI';
const N8N_BASE_URL = 'https://clixen.app.n8n.cloud';

async function createSimpleWorkflow() {
    const workflow = {
        name: 'Telegram AI Chat Assistant',
        nodes: [
            // 1. Webhook for testing
            {
                parameters: {
                    httpMethod: 'POST',
                    path: 'telegram-chat',
                    responseMode: 'onReceived'
                },
                id: 'webhook',
                name: 'Chat Webhook',
                type: 'n8n-nodes-base.webhook',
                typeVersion: 2,
                position: [240, 300]
            },
            
            // 2. Simple response
            {
                parameters: {
                    respondWith: 'json',
                    responseBody: '={"message": "Hello from AI Assistant! You said: {{ $json.query }}", "timestamp": "{{ new Date().toISOString() }}"}'
                },
                id: 'response',
                name: 'Chat Response',
                type: 'n8n-nodes-base.respondToWebhook',
                typeVersion: 1,
                position: [460, 300]
            }
        ],
        connections: {
            webhook: {
                main: [[{
                    node: 'response',
                    type: 'main',
                    index: 0
                }]]
            }
        },
        settings: {}
    };
    
    return workflow;
}

async function deploy() {
    console.log('🚀 Deploying simple workflow...');
    
    const workflow = await createSimpleWorkflow();
    
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
            console.log('✅ Deployed:', result.id);
            
            // Activate
            const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${result.id}`, {
                method: 'PATCH',
                headers: {
                    'X-N8N-API-KEY': N8N_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: true })
            });
            
            if (activateResponse.ok) {
                console.log('✅ Activated!');
                console.log(`🔗 Test URL: ${N8N_BASE_URL}/webhook/telegram-chat`);
                
                // Test it
                await testWorkflow();
            }
        } else {
            const error = await response.text();
            console.error('❌ Deploy failed:', error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testWorkflow() {
    console.log('\n🧪 Testing workflow...');
    
    const testUrl = `${N8N_BASE_URL}/webhook/telegram-chat`;
    
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                query: 'Hello, what\'s the weather in Everett MA?',
                user: 'test-user'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('📥 Response:', result);
        } else {
            console.log('⚠️ Test response:', response.status, await response.text());
        }
    } catch (error) {
        console.log('⚠️ Test error:', error.message);
    }
}

deploy().catch(console.error);