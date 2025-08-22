#!/usr/bin/env node

/**
 * Deploy B2C Automation Platform to n8n Cloud
 * Deploys all core workflows in the correct order
 */

require('dotenv').config();
const fs = require('fs').promises;

const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NzAxMzUyfQ.X30AXRqDIGwjU07Pa-DdNjjOFix0zkQ9nAsitjESBJc';
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://clixen.app.n8n.cloud';

// Deployment order is important!
const WORKFLOWS_TO_DEPLOY = [
    {
        name: "Global Error Handler",
        file: "./workflows/global-error-handler.json",
        priority: 1,
        activate: false, // Will activate after all are deployed
        description: "Handles all workflow errors and sends alerts"
    },
    {
        name: "Front LLM Router", 
        file: "./workflows/front-llm-router.json",
        priority: 2,
        activate: true,
        description: "Conversation guard and intent parser"
    },
    {
        name: "Document Analytics Service",
        file: "./workflows/document-analytics.json", 
        priority: 3,
        activate: true,
        description: "Core document analysis with AI insights"
    },
    {
        name: "Main Orchestrator",
        file: "./workflows/main-orchestrator.json",
        priority: 4, 
        activate: true,
        description: "Central routing hub for all services"
    },
    {
        name: "Execution Logger",
        file: "./workflows/execution-logger.json",
        priority: 5,
        activate: false, // Needs credentials first
        description: "Collects workflow execution metrics"
    }
];

/**
 * Deploy a single workflow
 */
async function deployWorkflow(workflowConfig) {
    console.log(`\n🚀 Deploying: ${workflowConfig.name}`);
    console.log(`📝 Description: ${workflowConfig.description}`);
    
    try {
        // Load workflow JSON
        const workflowData = JSON.parse(await fs.readFile(workflowConfig.file, 'utf8'));
        
        // Deploy to n8n
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workflowData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Deployed: ${workflowConfig.name}`);
            console.log(`   Workflow ID: ${result.id}`);
            console.log(`   View at: ${N8N_BASE_URL}/workflow/${result.id}`);
            
            return {
                success: true,
                id: result.id,
                name: workflowConfig.name,
                shouldActivate: workflowConfig.activate
            };
        } else {
            const error = await response.text();
            console.error(`❌ Failed to deploy ${workflowConfig.name}:`);
            console.error(`   Error: ${error}`);
            return {
                success: false,
                name: workflowConfig.name,
                error: error
            };
        }
    } catch (error) {
        console.error(`❌ Error deploying ${workflowConfig.name}:`, error.message);
        return {
            success: false,
            name: workflowConfig.name,
            error: error.message
        };
    }
}

/**
 * Activate a workflow
 */
async function activateWorkflow(workflowId, workflowName) {
    console.log(`⚡ Activating: ${workflowName}`);
    
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`✅ Activated: ${workflowName}`);
            return { success: true };
        } else {
            const error = await response.text();
            console.log(`⚠️  Could not activate ${workflowName}: ${error}`);
            console.log(`   This is normal if credentials are not configured yet`);
            return { success: false, error: error };
        }
    } catch (error) {
        console.log(`❌ Error activating ${workflowName}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Create deployment summary
 */
function createDeploymentSummary(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Successfully deployed: ${successful.length} workflows`);
    console.log(`❌ Failed deployments: ${failed.length} workflows`);
    
    if (successful.length > 0) {
        console.log('\n✅ Successful deployments:');
        successful.forEach(result => {
            console.log(`   • ${result.name} (ID: ${result.id})`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ Failed deployments:');
        failed.forEach(result => {
            console.log(`   • ${result.name}: ${result.error}`);
        });
    }
    
    return { successful: successful.length, failed: failed.length };
}

/**
 * Generate setup instructions
 */
function generateSetupInstructions(deploymentResults) {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 SETUP INSTRUCTIONS');
    console.log('='.repeat(60));
    
    console.log('\n1. 🔑 Configure Credentials in n8n UI:');
    console.log(`   Visit: ${N8N_BASE_URL}/credentials`);
    console.log('   Add these credential types:');
    console.log('   • OpenAI API - For AI insights generation');
    console.log('   • Supabase API - For database operations');
    console.log('   • SMTP/Email - For report delivery');
    console.log('   • HTTP Basic Auth - For Loki/Grafana (monitoring)');
    console.log('   • Telegram Bot - For alerts (optional)');
    
    console.log('\n2. 🗄️  Set up Supabase Database:');
    console.log('   • Run SQL: scripts/supabase/b2c-platform-schema.sql');
    console.log('   • Configure RLS policies');
    console.log('   • Test connection from n8n');
    
    console.log('\n3. ⚙️  Environment Variables (if needed):');
    console.log('   • N8N_BASE_URL - Your n8n instance URL');
    console.log('   • GRAFANA_LOKI_URL - For monitoring');
    console.log('   • TELEGRAM_BOT_TOKEN - For alerts');
    
    console.log('\n4. 🧪 Test the Platform:');
    console.log('   • Test Front LLM: POST /webhook/chat');
    console.log('   • Test Orchestrator: POST /webhook/api/orchestrate');
    console.log('   • Test Document Analytics: Upload a test document');
    
    console.log('\n5. ⚡ Activate Workflows:');
    const toActivate = deploymentResults.filter(r => r.success && r.shouldActivate);
    if (toActivate.length > 0) {
        console.log('   These workflows are ready to activate:');
        toActivate.forEach(workflow => {
            console.log(`   • ${workflow.name} (ID: ${workflow.id})`);
        });
    }
    
    console.log('\n6. 📊 Set up Monitoring:');
    console.log('   • Configure Grafana dashboards');
    console.log('   • Import dashboard JSON from dashboards/ folder');
    console.log('   • Test alerting system');
    
    console.log('\n🎯 API Endpoints (after activation):');
    console.log(`   • Chat: ${N8N_BASE_URL}/webhook/chat`);
    console.log(`   • Main API: ${N8N_BASE_URL}/webhook/api/orchestrate`);
    console.log(`   • Document Analytics: ${N8N_BASE_URL}/webhook/document-analytics`);
}

/**
 * Main deployment function
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 B2C AUTOMATION PLATFORM DEPLOYMENT');
    console.log('='.repeat(60));
    console.log(`Target: ${N8N_BASE_URL}`);
    console.log(`Workflows to deploy: ${WORKFLOWS_TO_DEPLOY.length}`);
    
    // Check if workflow files exist
    console.log('\n📋 Checking workflow files...');
    for (const workflow of WORKFLOWS_TO_DEPLOY) {
        try {
            await fs.access(workflow.file);
            console.log(`✅ Found: ${workflow.file}`);
        } catch {
            console.error(`❌ Missing: ${workflow.file}`);
            console.log('   Please create this workflow first');
            process.exit(1);
        }
    }
    
    // Sort by priority and deploy
    const sortedWorkflows = [...WORKFLOWS_TO_DEPLOY].sort((a, b) => a.priority - b.priority);
    const deploymentResults = [];
    
    console.log('\n🚀 Starting deployment...');
    for (const workflow of sortedWorkflows) {
        const result = await deployWorkflow(workflow);
        deploymentResults.push(result);
        
        // Wait between deployments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Activate workflows that should be activated
    console.log('\n⚡ Activating workflows...');
    for (const result of deploymentResults) {
        if (result.success && result.shouldActivate) {
            await activateWorkflow(result.id, result.name);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Generate summary and instructions
    const summary = createDeploymentSummary(deploymentResults);
    generateSetupInstructions(deploymentResults);
    
    if (summary.successful > 0) {
        console.log('\n🎉 Deployment completed successfully!');
        console.log('Your B2C Automation Platform is ready for configuration.');
    } else {
        console.log('\n⚠️  Deployment completed with issues.');
        console.log('Please check the errors above and retry.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}