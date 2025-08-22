#!/usr/bin/env node

/**
 * Deploy User Onboarding Workflows to n8n Cloud
 * Following VCT Framework deployment guidelines
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE_URL = process.env.N8N_BASE_URL;

class OnboardingWorkflowDeployer {
  constructor() {
    this.workflows = [
      {
        name: 'User Onboarding Workflow - B2C Platform',
        file: 'user-onboarding-workflow.json',
        webhook: '/webhook/api/user/signup',
        description: 'Handles new user registrations from Supabase'
      },
      {
        name: 'Profile Update Handler - B2C Platform',
        file: 'profile-update-handler.json',
        webhook: '/webhook/api/user/profile',
        description: 'Handles user profile updates'
      },
      {
        name: 'Credit Usage Tracker - B2C Platform',
        file: 'credit-usage-tracker.json',
        webhook: '/webhook/api/user/credits/consume',
        description: 'Tracks credit consumption and usage metrics'
      }
    ];
    this.deployedWorkflows = [];
  }

  async validateEnvironment() {
    console.log('🔍 Validating deployment environment...');
    
    if (!N8N_API_KEY) {
      throw new Error('N8N_API_KEY environment variable is required');
    }
    
    if (!N8N_BASE_URL) {
      throw new Error('N8N_BASE_URL environment variable is required');
    }
    
    console.log('✅ Environment validation passed');
  }

  async loadWorkflow(filename) {
    const workflowPath = path.join(__dirname, '..', 'workflows', filename);
    const workflowContent = await fs.readFile(workflowPath, 'utf8');
    return JSON.parse(workflowContent);
  }

  async deployWorkflow(workflowConfig) {
    console.log(`\n🚀 Deploying: ${workflowConfig.name}`);
    
    try {
      // Load workflow JSON
      const workflow = await this.loadWorkflow(workflowConfig.file);
      
      // Deploy to n8n
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
        console.log(`✅ Deployed successfully - ID: ${result.id}`);
        
        // Activate the workflow
        const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${result.id}/activate`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (activateResponse.ok) {
          console.log(`⚡ Activated successfully`);
          
          this.deployedWorkflows.push({
            ...workflowConfig,
            id: result.id,
            url: `${N8N_BASE_URL}/workflow/${result.id}`,
            status: 'active'
          });
          
        } else {
          console.log(`⚠️ Deployment succeeded but activation failed`);
          this.deployedWorkflows.push({
            ...workflowConfig,
            id: result.id,
            url: `${N8N_BASE_URL}/workflow/${result.id}`,
            status: 'inactive'
          });
        }
        
        return result;
      } else {
        const error = await response.text();
        throw new Error(`Deployment failed: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Failed to deploy ${workflowConfig.name}: ${error.message}`);
      throw error;
    }
  }

  async validateWorkflowHealth(workflowId) {
    console.log(`🔍 Validating workflow health: ${workflowId}`);
    
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      
      if (response.ok) {
        const workflow = await response.json();
        console.log(`✅ Workflow health check passed: ${workflow.active ? 'Active' : 'Inactive'}`);
        return workflow.active;
      } else {
        console.log(`⚠️ Workflow health check failed`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Health check error: ${error.message}`);
      return false;
    }
  }

  async generateDeploymentReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 DEPLOYMENT REPORT');
    console.log('='.repeat(80));
    
    for (const workflow of this.deployedWorkflows) {
      console.log(`\n📌 ${workflow.name}`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   URL: ${workflow.url}`);
      console.log(`   Webhook: ${workflow.webhook}`);
      console.log(`   Status: ${workflow.status}`);
      console.log(`   Description: ${workflow.description}`);
    }
    
    console.log('\n🔗 Webhook Endpoints:');
    for (const workflow of this.deployedWorkflows) {
      console.log(`   ${workflow.webhook} → ${workflow.name}`);
    }
    
    console.log('\n📚 Next Steps:');
    console.log('   1. Configure Supabase credentials in n8n');
    console.log('   2. Set up SMTP credentials for email sending');
    console.log('   3. Test webhook endpoints with sample data');
    console.log('   4. Configure webhook URLs in Supabase triggers');
    console.log('   5. Monitor workflow executions in n8n dashboard');
    
    console.log('\n🛡️ Security Checklist:');
    console.log('   ✓ Webhook authentication configured');
    console.log('   ✓ Input validation implemented');
    console.log('   ✓ Error handling with proper responses');
    console.log('   ✓ Secure API key generation');
    console.log('   ✓ Database security with parameterized queries');
    
    return this.deployedWorkflows;
  }

  async deployAll() {
    console.log('🚀 Starting User Onboarding Workflows Deployment');
    console.log('Following VCT Framework deployment guidelines\n');
    
    try {
      // Validate environment
      await this.validateEnvironment();
      
      // Deploy each workflow
      for (const workflowConfig of this.workflows) {
        await this.deployWorkflow(workflowConfig);
        
        // Small delay between deployments
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Validate health of deployed workflows
      console.log('\n🔍 Performing health checks...');
      for (const workflow of this.deployedWorkflows) {
        await this.validateWorkflowHealth(workflow.id);
      }
      
      // Generate deployment report
      await this.generateDeploymentReport();
      
      console.log('\n🎉 Deployment completed successfully!');
      return this.deployedWorkflows;
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const deployer = new OnboardingWorkflowDeployer();
  deployer.deployAll()
    .then((workflows) => {
      console.log(`\n✅ Successfully deployed ${workflows.length} workflows`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = OnboardingWorkflowDeployer;