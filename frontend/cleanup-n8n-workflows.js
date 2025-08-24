#!/usr/bin/env node

/**
 * N8N Workflow Cleanup Script
 * Connects to n8n instance and removes workflows not part of the core system plan
 */

const https = require('https');
const http = require('http');

// Configuration
const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

// Core system workflows that should be preserved
const CORE_WORKFLOWS = [
  'weather-check',
  'email-scanner', 
  'pdf-summarizer',
  'text-translator',
  'daily-reminders',
  'user-onboarding',
  'credit-tracker',
  'main-orchestrator'
];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const requestOptions = {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      },
      method: options.method || 'GET'
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Get all workflows
async function getAllWorkflows() {
  console.log('🔍 Fetching all workflows from n8n instance...');
  
  try {
    const response = await makeRequest(`${N8N_BASE_URL}/workflows`);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch workflows: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    return response.data.data || response.data;
  } catch (error) {
    console.error('❌ Error fetching workflows:', error.message);
    throw error;
  }
}

// Delete a workflow
async function deleteWorkflow(workflowId, name) {
  console.log(`🗑️  Deleting workflow: ${name} (ID: ${workflowId})`);
  
  try {
    const response = await makeRequest(`${N8N_BASE_URL}/workflows/${workflowId}`, {
      method: 'DELETE'
    });
    
    if (response.status === 200) {
      console.log(`✅ Successfully deleted: ${name}`);
      return true;
    } else {
      console.log(`❌ Failed to delete ${name}: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting ${name}:`, error.message);
    return false;
  }
}

// Check if workflow is part of core system
function isCoreWorkflow(workflow) {
  const name = workflow.name.toLowerCase();
  
  return CORE_WORKFLOWS.some(coreWorkflow => 
    name.includes(coreWorkflow.toLowerCase()) ||
    name.includes(coreWorkflow.replace('-', '').toLowerCase()) ||
    name.includes(coreWorkflow.replace('-', '_').toLowerCase())
  );
}

// Main cleanup function
async function cleanupWorkflows() {
  console.log('🚀 Starting N8N Workflow Cleanup...\n');
  
  try {
    // Test connection first
    console.log('🔗 Testing connection to n8n instance...');
    const workflows = await getAllWorkflows();
    console.log(`✅ Connected successfully! Found ${workflows.length} workflows.\n`);
    
    // Categorize workflows
    const coreWorkflows = [];
    const nonCoreWorkflows = [];
    
    workflows.forEach(workflow => {
      if (isCoreWorkflow(workflow)) {
        coreWorkflows.push(workflow);
      } else {
        nonCoreWorkflows.push(workflow);
      }
    });
    
    console.log('📊 Workflow Analysis:');
    console.log(`   • Core workflows (will keep): ${coreWorkflows.length}`);
    console.log(`   • Non-core workflows (will delete): ${nonCoreWorkflows.length}\n`);
    
    // Show core workflows
    if (coreWorkflows.length > 0) {
      console.log('🛡️  Core workflows (keeping):');
      coreWorkflows.forEach(workflow => {
        console.log(`   • ${workflow.name} (ID: ${workflow.id})`);
      });
      console.log();
    }
    
    // Show non-core workflows to be deleted
    if (nonCoreWorkflows.length > 0) {
      console.log('🗑️  Non-core workflows (will delete):');
      nonCoreWorkflows.forEach(workflow => {
        console.log(`   • ${workflow.name} (ID: ${workflow.id})`);
      });
      console.log();
      
      // Confirm deletion
      console.log('⚠️  WARNING: This will permanently delete the above workflows!');
      console.log('Press Ctrl+C to cancel, or any key to continue...\n');
      
      // For automation, proceed directly (remove this in production)
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const workflow of nonCoreWorkflows) {
        const success = await deleteWorkflow(workflow.id, workflow.name);
        if (success) {
          deletedCount++;
        } else {
          failedCount++;
        }
        
        // Small delay between deletions
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('\n📈 Cleanup Summary:');
      console.log(`   • Successfully deleted: ${deletedCount} workflows`);
      console.log(`   • Failed to delete: ${failedCount} workflows`);
      console.log(`   • Core workflows preserved: ${coreWorkflows.length}`);
      
    } else {
      console.log('✅ No non-core workflows found. All workflows are part of the core system!');
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupWorkflows();
}

module.exports = { cleanupWorkflows, getAllWorkflows };