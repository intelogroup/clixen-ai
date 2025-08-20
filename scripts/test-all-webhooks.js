#!/usr/bin/env node

/**
 * Test webhook with different URL patterns
 */

const N8N_BASE_URL = 'https://clixen.app.n8n.cloud';

async function testWebhookPatterns() {
    console.log('🧪 Testing different webhook URL patterns...');
    
    const testUrls = [
        'https://clixen.app.n8n.cloud/webhook/ai-chat',
        'https://clixen.app.n8n.cloud/webhook-test/ai-chat',
        'https://clixen.app.n8n.cloud/webhook/wfKjmou5n0qp1DHG/ai-chat',
        'https://clixen.app.n8n.cloud/webhook-test/wfKjmou5n0qp1DHG/ai-chat'
    ];
    
    const testData = {
        query: 'Hello! What\'s the weather in Everett, MA?',
        user_id: 'test-user-123',
        message: 'Test message from webhook'
    };
    
    for (const url of testUrls) {
        console.log(`\n📡 Testing: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            const responseText = await response.text();
            
            if (response.ok) {
                console.log('✅ SUCCESS!');
                try {
                    const result = JSON.parse(responseText);
                    console.log('📥 Response:', result);
                    
                    if (result.ai_response) {
                        console.log('🤖 AI Said:', result.ai_response);
                    }
                } catch (e) {
                    console.log('📄 Raw response:', responseText);
                }
                return url; // Return successful URL
            } else {
                console.log(`❌ Status ${response.status}:`, responseText);
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
}

async function main() {
    console.log('\n' + '='.repeat(50));
    console.log('🔬 WEBHOOK TESTING SUITE');
    console.log('='.repeat(50));
    
    const workingUrl = await testWebhookPatterns();
    
    if (workingUrl) {
        console.log('\n🎉 FOUND WORKING WEBHOOK!');
        console.log(`✅ URL: ${workingUrl}`);
        
        // Test multiple queries
        const queries = [
            'What\'s the weather today?',
            'Give me the latest news',
            'What events are happening?',
            'Hello, how are you?'
        ];
        
        console.log('\n🧪 Testing multiple queries...');
        
        for (const query of queries) {
            console.log(`\n📤 Query: "${query}"`);
            
            try {
                const response = await fetch(workingUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        query: query,
                        user_id: 'test-user'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('🤖 AI Response:', result.ai_response || result.response || result);
                } else {
                    console.log('❌ Failed:', response.status);
                }
            } catch (error) {
                console.log('❌ Error:', error.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } else {
        console.log('\n❌ No working webhook found');
        console.log('💡 The workflow may need to be manually executed in the n8n UI first');
        console.log(`🔗 Open: ${N8N_BASE_URL}/workflow/wfKjmou5n0qp1DHG`);
    }
}

main().catch(console.error);