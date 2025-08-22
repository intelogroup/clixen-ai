#!/usr/bin/env node

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjU1NTA5fQ.DKPBT396-Ni_nn3K5R2JD8WzfMyEMnQAJq4xKB0QcUI';
const N8N_BASE_URL = 'https://clixen.app.n8n.cloud';

async function activateWorkflow(workflowId) {
    console.log(`🔄 Activating workflow ${workflowId}...`);
    
    try {
        // Try different methods
        const methods = [
            { method: 'PUT', url: `/api/v1/workflows/${workflowId}/activate` },
            { method: 'POST', url: `/api/v1/workflows/${workflowId}/activate` },
            { method: 'PATCH', url: `/api/v1/workflows/${workflowId}`, body: { active: true } }
        ];
        
        for (const methodConfig of methods) {
            console.log(`Trying ${methodConfig.method} ${methodConfig.url}...`);
            
            const options = {
                method: methodConfig.method,
                headers: {
                    'X-N8N-API-KEY': N8N_API_KEY,
                    'Content-Type': 'application/json'
                }
            };
            
            if (methodConfig.body) {
                options.body = JSON.stringify(methodConfig.body);
            }
            
            const response = await fetch(`${N8N_BASE_URL}${methodConfig.url}`, options);
            
            if (response.ok) {
                console.log('✅ Activation successful!');
                const result = await response.json();
                console.log('Result:', result);
                return true;
            } else {
                console.log(`❌ ${methodConfig.method} failed:`, response.status, await response.text());
            }
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testWorkflow() {
    console.log('\n🧪 Testing webhook endpoints...');
    
    const testUrls = [
        'https://clixen.app.n8n.cloud/webhook/ai-chat',
        'https://clixen.app.n8n.cloud/webhook-test/ai-chat'
    ];
    
    const testData = {
        query: 'What\'s the weather in Everett, MA?',
        user_id: 'test-user-123'
    };
    
    for (const url of testUrls) {
        console.log(`\nTesting: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Success:', result);
            } else {
                console.log('❌ Failed:', response.status, await response.text());
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }
}

async function main() {
    const workflowId = process.argv[2] || 'wfKjmou5n0qp1DHG';
    
    console.log(`🎯 Working with workflow: ${workflowId}`);
    
    const activated = await activateWorkflow(workflowId);
    
    if (activated) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testWorkflow();
    }
}

main().catch(console.error);