#!/usr/bin/env node

/**
 * Clean workflow JSON files to remove properties that n8n API doesn't accept
 */

const fs = require('fs').promises;
const path = require('path');

const WORKFLOW_FILES = [
    './workflows/global-error-handler.json',
    './workflows/front-llm-router.json',
    './workflows/document-analytics.json',
    './workflows/main-orchestrator.json',
    './workflows/execution-logger.json'
];

/**
 * Clean a single workflow JSON
 */
async function cleanWorkflow(filePath) {
    console.log(`🧹 Cleaning: ${filePath}`);
    
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const workflow = JSON.parse(content);
        
        // Remove properties that n8n API doesn't accept
        const cleanedWorkflow = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: {}  // Use minimal settings as per working n8n API examples
        }
        
        // Clean nodes - remove node-level properties that might cause issues
        cleanedWorkflow.nodes = cleanedWorkflow.nodes.map(node => {
            const cleanedNode = {
                parameters: node.parameters,
                id: node.id,
                name: node.name,
                type: node.type,
                typeVersion: node.typeVersion,
                position: node.position
            };
            
            // Include credentials if present
            if (node.credentials) {
                cleanedNode.credentials = node.credentials;
            }
            
            // Include webhookId if present (for webhook nodes)
            if (node.webhookId) {
                cleanedNode.webhookId = node.webhookId;
            }
            
            // Include continueOnFail if present
            if (node.continueOnFail !== undefined) {
                cleanedNode.continueOnFail = node.continueOnFail;
            }
            
            return cleanedNode;
        });
        
        // Save cleaned workflow
        await fs.writeFile(filePath, JSON.stringify(cleanedWorkflow, null, 2));
        console.log(`✅ Cleaned: ${filePath}`);
        
        return true;
    } catch (error) {
        console.error(`❌ Error cleaning ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Clean all workflows
 */
async function main() {
    console.log('\n🧹 CLEANING WORKFLOW FILES FOR N8N API\n');
    
    let cleaned = 0;
    let failed = 0;
    
    for (const file of WORKFLOW_FILES) {
        const success = await cleanWorkflow(file);
        if (success) {
            cleaned++;
        } else {
            failed++;
        }
    }
    
    console.log('\n📊 CLEANING SUMMARY');
    console.log(`✅ Successfully cleaned: ${cleaned} files`);
    console.log(`❌ Failed to clean: ${failed} files`);
    
    if (cleaned > 0) {
        console.log('\n✨ Workflows are now ready for deployment!');
    }
}

if (require.main === module) {
    main().catch(console.error);
}