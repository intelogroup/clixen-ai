#!/usr/bin/env node

/**
 * Clean up n8n Cloud instance by deleting all existing workflows
 * This prepares the instance for the B2C platform deployment
 */

require('dotenv').config();

const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2UyNzc1Mi05Y2Y5LTRjZmItYWUxNy0yNDNjODBjZDVmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NzAxMzUyfQ.X30AXRqDIGwjU07Pa-DdNjjOFix0zkQ9nAsitjESBJc';
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://clixen.app.n8n.cloud';

/**
 * Get all workflows
 */
async function getAllWorkflows() {
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
            method: 'GET',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.data || [];
        } else {
            const error = await response.text();
            console.error('❌ Failed to get workflows:', error);
            return [];
        }
    } catch (error) {
        console.error('❌ Error getting workflows:', error.message);
        return [];
    }
}

/**
 * Deactivate a workflow
 */
async function deactivateWorkflow(workflowId, workflowName) {
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/deactivate`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`  ⏸️  Deactivated: ${workflowName}`);
            return true;
        } else {
            console.log(`  ⚠️  Could not deactivate ${workflowName} (may already be inactive)`);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ Error deactivating ${workflowName}:`, error.message);
        return false;
    }
}

/**
 * Delete a workflow
 */
async function deleteWorkflow(workflowId, workflowName) {
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
            method: 'DELETE',
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`  ✅ Deleted: ${workflowName} (${workflowId})`);
            return true;
        } else {
            const error = await response.text();
            console.log(`  ❌ Failed to delete ${workflowName}:`, error);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ Error deleting ${workflowName}:`, error.message);
        return false;
    }
}

/**
 * Clean up all workflows
 */
async function cleanupInstance() {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 CLEANING UP N8N CLOUD INSTANCE');
    console.log('='.repeat(60));
    
    // Get all workflows
    console.log('\n📋 Getting all workflows...');
    const workflows = await getAllWorkflows();
    
    if (workflows.length === 0) {
        console.log('✅ No workflows found - instance is already clean!');
        return;
    }
    
    console.log(`📊 Found ${workflows.length} workflows to process`);
    
    // Show confirmation
    console.log('\n⚠️  WARNING: This will delete ALL workflows in the instance!');
    console.log('Workflows to be deleted:');
    workflows.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.name} (${w.id}) - Active: ${w.active}`);
    });
    
    // For safety, let's add a confirmation mechanism
    const shouldProceed = process.argv.includes('--confirm');
    if (!shouldProceed) {
        console.log('\n❌ Cleanup aborted for safety.');
        console.log('To proceed, run: node scripts/cleanup-n8n-instance.js --confirm');
        return;
    }
    
    console.log('\n🚀 Starting cleanup process...');
    
    let deactivated = 0;
    let deleted = 0;
    let errors = 0;
    
    // Process each workflow
    for (const workflow of workflows) {
        console.log(`\n🔄 Processing: ${workflow.name}`);
        
        // First deactivate if active
        if (workflow.active) {
            const deactivationResult = await deactivateWorkflow(workflow.id, workflow.name);
            if (deactivationResult) {
                deactivated++;
            }
            // Wait a moment before deletion
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Then delete
        const deletionResult = await deleteWorkflow(workflow.id, workflow.name);
        if (deletionResult) {
            deleted++;
        } else {
            errors++;
        }
        
        // Wait between deletions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total workflows processed: ${workflows.length}`);
    console.log(`Deactivated: ${deactivated}`);
    console.log(`Deleted: ${deleted}`);
    console.log(`Errors: ${errors}`);
    
    if (deleted === workflows.length) {
        console.log('\n✅ Instance cleanup completed successfully!');
        console.log('🎯 Ready for B2C platform deployment');
    } else {
        console.log('\n⚠️  Some workflows could not be deleted');
        console.log('You may need to delete them manually in the n8n UI');
    }
    
    console.log('\n📚 Next steps:');
    console.log('1. Deploy B2C platform workflows');
    console.log('2. Configure credentials');
    console.log('3. Test the platform');
}

/**
 * Verify instance is clean
 */
async function verifyCleanup() {
    console.log('\n🔍 Verifying cleanup...');
    const workflows = await getAllWorkflows();
    
    if (workflows.length === 0) {
        console.log('✅ Verification successful - instance is clean!');
    } else {
        console.log(`⚠️  Found ${workflows.length} remaining workflows:`);
        workflows.forEach(w => {
            console.log(`  - ${w.name} (${w.id})`);
        });
    }
    
    return workflows.length === 0;
}

/**
 * Main execution
 */
async function main() {
    if (process.argv.includes('--verify')) {
        await verifyCleanup();
    } else {
        await cleanupInstance();
        
        // Verify after cleanup
        console.log('\n' + '-'.repeat(40));
        await verifyCleanup();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { cleanupInstance, getAllWorkflows, deleteWorkflow };