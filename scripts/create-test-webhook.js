#!/usr/bin/env node

/**
 * Create a simple test webhook to verify the connection
 */

const OFFICIAL_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NzAxMzUyfQ.X30AXRqDIGwjU07Pa-DdNjjOFix0zkQ9nAsitjESBJc';
const N8N_BASE_URL = 'https://clixen.app.n8n.cloud';

async function createTestWorkflow() {
    console.log('🎨 Creating simple test webhook workflow...');
    
    const workflow = {
        name: 'Test Connection Webhook - ' + new Date().toISOString().split('T')[0],
        nodes: [
            {
                parameters: {
                    httpMethod: 'POST',
                    path: 'test-connection',
                    responseMode: 'onReceived'
                },
                id: 'webhook',
                name: 'Test Webhook',
                type: 'n8n-nodes-base.webhook',
                typeVersion: 2,
                position: [300, 300]
            },
            {
                parameters: {
                    respondWith: 'json',
                    responseBody: JSON.stringify({
                        success: true,
                        message: "Hello from n8n!",
                        timestamp: "{{ new Date().toISOString() }}",
                        received: "{{ $json }}"
                    }, null, 2)
                },
                id: 'response',
                name: 'Send Response',
                type: 'n8n-nodes-base.respondToWebhook',
                typeVersion: 1,
                position: [500, 300]
            }
        ],
        connections: {
            'webhook': {
                main: [[{ node: 'response', type: 'main', index: 0 }]]
            }
        },
        settings: {
            executionOrder: 'v1'
        }
    };
    
    return workflow;
}

async function deployAndTest() {
    console.log('\n🚀 Deploying test workflow...');
    
    const workflow = await createTestWorkflow();
    
    try {
        // Deploy
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': OFFICIAL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workflow)
        });
        
        if (!response.ok) {
            console.error('❌ Deploy failed:', await response.text());
            return;
        }
        
        const result = await response.json();
        console.log('✅ Deployed successfully!');
        console.log(`📋 Workflow ID: ${result.id}`);
        
        // Activate
        console.log('\n⚡ Activating...');
        const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${result.id}/activate`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': OFFICIAL_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (activateResponse.ok) {
            console.log('✅ Activated!');
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test the webhook
            console.log('\n🧪 Testing webhook...');
            const testUrl = `${N8N_BASE_URL}/webhook/test-connection`;
            
            const testResponse = await fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    test: 'Hello from API test!',
                    timestamp: new Date().toISOString()
                })
            });
            
            if (testResponse.ok) {
                const testResult = await testResponse.json();
                console.log('✅ WEBHOOK TEST SUCCESSFUL!');
                console.log('Response:', JSON.stringify(testResult, null, 2));
            } else {
                console.log('❌ Webhook test failed:', testResponse.status);
                console.log('Response:', await testResponse.text());
            }
            
        } else {
            console.log('❌ Activation failed:', await activateResponse.text());
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ TEST COMPLETE!');
        console.log('='.repeat(50));
        console.log(`🔗 Dashboard: ${N8N_BASE_URL}/workflow/${result.id}`);
        console.log(`📡 Webhook URL: ${N8N_BASE_URL}/webhook/test-connection`);
        
        return result.id;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

deployAndTest().catch(console.error);