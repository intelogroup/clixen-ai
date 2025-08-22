#!/usr/bin/env node

/**
 * Test the MCP-cooked workflow
 */

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjU1NTA5fQ.DKPBT396-Ni_nn3K5R2JD8WzfMyEMnQAJq4xKB0QcUI';
const N8N_BASE_URL = 'https://clixen.app.n8n.cloud';

async function testWorkflow() {
    console.log('🧪 Testing MCP-cooked workflow...\n');
    
    // Test different queries
    const testQueries = [
        { message: "What's the weather like?", user_id: "test-user-1" },
        { message: "Give me the latest news", user_id: "test-user-2" },
        { message: "What events are happening today?", user_id: "test-user-3" },
        { message: "Help me understand what you can do", user_id: "test-user-4" },
        { message: "Send me an email summary", user_id: "test-user-5" }
    ];
    
    const testUrls = [
        `${N8N_BASE_URL}/webhook/mcp-ai-chat`,
        `${N8N_BASE_URL}/webhook-test/mcp-ai-chat`,
        `${N8N_BASE_URL}/webhook/qQYFPKv5Jvq72dDm`,
        `${N8N_BASE_URL}/webhook-test/qQYFPKv5Jvq72dDm`
    ];
    
    // Try to find a working endpoint
    let workingUrl = null;
    
    for (const url of testUrls) {
        console.log(`Testing: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testQueries[0])
            });
            
            if (response.ok) {
                workingUrl = url;
                console.log('✅ Found working endpoint!\n');
                break;
            } else {
                const text = await response.text();
                console.log(`❌ ${response.status}: ${text.substring(0, 100)}...\n`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }
    
    if (workingUrl) {
        console.log('🎯 Testing with different queries:\n');
        
        for (const query of testQueries) {
            console.log(`📤 User: "${query.message}"`);
            
            try {
                const response = await fetch(workingUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(query)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`📥 AI: ${result.response || JSON.stringify(result)}\n`);
                } else {
                    console.log(`❌ Failed: ${response.status}\n`);
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}\n`);
            }
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } else {
        console.log('❌ No working endpoint found');
        console.log('💡 The workflow needs to be manually executed in n8n first');
        console.log(`🔗 Visit: ${N8N_BASE_URL}/workflow/qQYFPKv5Jvq72dDm`);
    }
}

testWorkflow().catch(console.error);