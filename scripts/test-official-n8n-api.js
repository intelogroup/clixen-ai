#!/usr/bin/env node

/**
 * Test n8n Cloud with official API key
 */

const OFFICIAL_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NzAxMzUyfQ.X30AXRqDIGwjU07Pa-DdNjjOFix0zkQ9nAsitjESBJc';
const N8N_BASE_URL = 'https://clixen.app.n8n.cloud';

async function testConnection() {
    console.log('🔗 Testing connection to n8n Cloud...');
    console.log(`Base URL: ${N8N_BASE_URL}`);
    
    try {
        // Test API connection
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
            method: 'GET',
            headers: {
                'X-N8N-API-KEY': OFFICIAL_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Connection successful!');
            console.log(`📊 Found ${result.data?.length || 0} workflows`);
            
            // List existing workflows
            if (result.data && result.data.length > 0) {
                console.log('\n📋 Existing workflows:');
                result.data.forEach((workflow, i) => {
                    console.log(`  ${i + 1}. ${workflow.name} (ID: ${workflow.id}) - Active: ${workflow.active}`);
                });
            }
            
            return result.data;
        } else {
            console.error('❌ Connection failed:', response.status, await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        return null;
    }
}

async function activateWorkflow(workflowId, workflowName) {
    console.log(`\n⚡ Activating workflow: ${workflowName} (${workflowId})`);
    
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': OFFICIAL_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Activation successful!');
            return true;
        } else {
            const error = await response.text();
            console.log('❌ Activation failed:', error);
            return false;
        }
    } catch (error) {
        console.log('❌ Activation error:', error.message);
        return false;
    }
}

async function testWebhooks() {
    console.log('\n🧪 Testing webhook endpoints...');
    
    const testCases = [
        {
            name: 'Simple AI Chat',
            url: `${N8N_BASE_URL}/webhook/simple-ai-chat`,
            data: { message: "Hello! What's the weather like?" }
        },
        {
            name: 'AI Agent Chat',
            url: `${N8N_BASE_URL}/webhook/ai-agent-chat`,
            data: { message: "Tell me the news", sessionId: "test-123" }
        },
        {
            name: 'MCP AI Chat',
            url: `${N8N_BASE_URL}/webhook/mcp-ai-chat`,
            data: { message: "What can you help me with?", user_id: "test-user" }
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📡 Testing: ${testCase.name}`);
        console.log(`URL: ${testCase.url}`);
        
        try {
            const response = await fetch(testCase.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testCase.data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ SUCCESS!');
                console.log('Response:', JSON.stringify(result, null, 2));
            } else {
                const error = await response.text();
                console.log(`❌ Failed (${response.status}):`, error.substring(0, 200));
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function executeWorkflow(workflowId, workflowName) {
    console.log(`\n🚀 Executing workflow: ${workflowName}`);
    
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': OFFICIAL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                triggerNode: 'webhook',
                data: [{
                    json: {
                        message: "Test execution from API",
                        sessionId: "api-test-" + Date.now()
                    }
                }]
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Execution started');
            console.log('Execution ID:', result.id);
            return result;
        } else {
            const error = await response.text();
            console.log('❌ Execution failed:', error);
            return null;
        }
    } catch (error) {
        console.log('❌ Execution error:', error.message);
        return null;
    }
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 OFFICIAL N8N CLOUD API CONNECTION TEST');
    console.log('='.repeat(60));
    
    // Step 1: Test connection
    const workflows = await testConnection();
    if (!workflows) {
        console.error('❌ Could not connect to n8n Cloud');
        process.exit(1);
    }
    
    // Step 2: Try to activate inactive workflows
    const inactiveWorkflows = workflows.filter(w => !w.active);
    console.log(`\n📋 Found ${inactiveWorkflows.length} inactive workflows`);
    
    for (const workflow of inactiveWorkflows) {
        const activated = await activateWorkflow(workflow.id, workflow.name);
        if (activated) {
            console.log(`✅ ${workflow.name} activated`);
        }
    }
    
    // Step 3: Execute one workflow to register webhooks
    if (workflows.length > 0) {
        const testWorkflow = workflows.find(w => w.name.includes('Simple') || w.name.includes('AI'));
        if (testWorkflow) {
            await executeWorkflow(testWorkflow.id, testWorkflow.name);
        }
    }
    
    // Step 4: Test webhooks
    await testWebhooks();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`• Total workflows: ${workflows.length}`);
    console.log(`• Active workflows: ${workflows.filter(w => w.active).length}`);
    console.log(`• API Connection: ✅ Working`);
    console.log('\n🎯 Next steps:');
    console.log('1. Check n8n dashboard for execution results');
    console.log('2. Webhooks should now be registered and working');
    console.log('3. Test the workflows manually if needed');
}

if (require.main === module) {
    main().catch(console.error);
}