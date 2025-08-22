#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

/**
 * N8N Workflow Orchestrator
 * Uses czlonkowski n8n-mcp for intent validation, node search, and workflow healing
 */
class N8nWorkflowOrchestrator {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
    this.mcpServer = null;
  }

  /**
   * Initialize n8n-mcp database for node operations
   */
  async initializeMCP() {
    console.log(chalk.blue('🚀 Initializing n8n-MCP database...'));
    
    try {
      // Load n8n-mcp database directly
      const Database = require('better-sqlite3');
      const mcpDbPath = path.join(__dirname, '../node_modules/n8n-mcp/data/nodes.db');
      
      if (fs.existsSync(mcpDbPath)) {
        this.mcpDb = new Database(mcpDbPath, { readonly: true });
        console.log(chalk.green('✓ n8n-MCP database connected'));
        return true;
      } else {
        console.log(chalk.yellow('⚠ n8n-MCP database not found, using fallback mode'));
        return true; // Continue without MCP
      }
    } catch (error) {
      console.error(chalk.red(`Failed to initialize MCP: ${error.message}`));
      console.log(chalk.yellow('⚠ Continuing without MCP database'));
      return true; // Don't fail completely
    }
  }

  /**
   * Validate workflow intent using n8n-mcp database
   */
  async validateIntent(workflowDescription) {
    console.log(chalk.blue('🔍 Validating workflow intent...'));
    
    try {
      const nodeResults = await this.searchNodes(workflowDescription);
      
      if (!nodeResults || nodeResults.length === 0) {
        console.log(chalk.yellow('⚠ No matching nodes found for intent'));
        return { valid: false, suggestions: [] };
      }

      console.log(chalk.green(`✓ Found ${nodeResults.length} relevant nodes`));
      return { 
        valid: true, 
        nodes: nodeResults,
        recommendations: nodeResults.map(node => ({
          type: node.type,
          category: node.category,
          description: node.description,
          displayName: node.displayName
        }))
      };
    } catch (error) {
      console.error(chalk.red(`Intent validation error: ${error.message}`));
      return { valid: false, error: error.message };
    }
  }

  /**
   * Search for nodes in the n8n-mcp database
   */
  async searchNodes(query, limit = 10) {
    if (!this.mcpDb) {
      // Fallback to basic node mapping
      return this.getFallbackNodes(query);
    }

    try {
      // Search in the nodes database with text matching
      const stmt = this.mcpDb.prepare(`
        SELECT 
          node_type,
          display_name,
          description,
          category,
          version,
          properties_schema
        FROM nodes 
        WHERE 
          LOWER(display_name) LIKE LOWER(?) OR
          LOWER(description) LIKE LOWER(?) OR
          LOWER(node_type) LIKE LOWER(?) OR
          LOWER(category) LIKE LOWER(?)
        ORDER BY 
          CASE 
            WHEN LOWER(display_name) LIKE LOWER(?) THEN 1
            WHEN LOWER(description) LIKE LOWER(?) THEN 2
            WHEN LOWER(node_type) LIKE LOWER(?) THEN 3
            ELSE 4
          END
        LIMIT ?
      `);

      const searchPattern = `%${query}%`;
      const results = stmt.all(
        searchPattern, searchPattern, searchPattern, searchPattern,
        searchPattern, searchPattern, searchPattern,
        limit
      );

      return results.map(node => ({
        type: `n8n-${node.node_type}`,
        displayName: node.display_name,
        description: node.description,
        category: node.category,
        version: node.version || 1,
        properties: node.properties_schema ? JSON.parse(node.properties_schema) : {}
      }));
    } catch (error) {
      console.error(chalk.red(`Database search error: ${error.message}`));
      return this.getFallbackNodes(query);
    }
  }

  /**
   * Fallback node suggestions when MCP database is not available
   */
  getFallbackNodes(query) {
    const commonNodes = [
      {
        type: 'n8n-nodes-base.httpRequest',
        displayName: 'HTTP Request',
        description: 'Make HTTP requests to any URL',
        category: 'Communication',
        version: 1,
        properties: {}
      },
      {
        type: 'n8n-nodes-base.gmail',
        displayName: 'Gmail',
        description: 'Send and receive emails via Gmail',
        category: 'Communication',
        version: 1,
        properties: {}
      },
      {
        type: 'n8n-nodes-base.webhook',
        displayName: 'Webhook',
        description: 'Receive HTTP requests',
        category: 'Communication',
        version: 1,
        properties: {}
      },
      {
        type: 'n8n-nodes-base.slack',
        displayName: 'Slack',
        description: 'Send messages to Slack channels',
        category: 'Communication',
        version: 1,
        properties: {}
      },
      {
        type: 'n8n-nodes-base.scheduleTrigger',
        displayName: 'Schedule Trigger',
        description: 'Triggers workflows on a schedule',
        category: 'Trigger',
        version: 1,
        properties: {}
      }
    ];

    // Simple keyword matching
    const queryLower = query.toLowerCase();
    return commonNodes.filter(node => 
      node.displayName.toLowerCase().includes(queryLower) ||
      node.description.toLowerCase().includes(queryLower) ||
      node.category.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Create workflow JSON based on validated intent and nodes
   */
  async createWorkflowJSON(intent, validatedNodes, workflowName) {
    console.log(chalk.blue('🔨 Creating workflow JSON...'));
    
    try {
      // Generate workflow structure
      const workflow = {
        name: workflowName || `Generated_Workflow_${Date.now()}`,
        nodes: [],
        connections: {},
        settings: {
          executionOrder: 'v1'
        },
        staticData: {},
        meta: {
          created_by: 'n8n-workflow-orchestrator',
          intent: intent,
          generated_at: new Date().toISOString()
        }
      };

      // Create nodes with proper positioning
      validatedNodes.forEach((nodeDetail, index) => {
        const node = {
          name: `${nodeDetail.displayName.replace(/\s+/g, '_')}_${index}`,
          type: nodeDetail.type,
          typeVersion: nodeDetail.version || 1,
          position: [250 + (index * 200), 300],
          parameters: {}
        };
        
        workflow.nodes.push(node);
      });

      // Create basic connections (sequential flow)
      for (let i = 0; i < workflow.nodes.length - 1; i++) {
        const currentNode = workflow.nodes[i];
        const nextNode = workflow.nodes[i + 1];
        
        workflow.connections[currentNode.name] = {
          main: [[{
            node: nextNode.name,
            type: 'main',
            index: 0
          }]]
        };
      }

      console.log(chalk.green('✓ Workflow JSON created'));
      return { success: true, workflow };
      
    } catch (error) {
      console.error(chalk.red(`Workflow creation error: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate and heal workflow
   */
  async validateAndHealWorkflow(workflow) {
    console.log(chalk.blue('🩺 Validating and healing workflow...'));
    
    try {
      const validation = this.validateWorkflowStructure(workflow);
      
      if (validation.valid) {
        console.log(chalk.green('✓ Workflow is valid'));
        return { valid: true, workflow };
      }

      // Attempt to heal workflow
      console.log(chalk.yellow('🔧 Attempting to heal workflow...'));
      const healedWorkflow = this.healWorkflow(workflow, validation.errors);
      
      if (healedWorkflow.success) {
        console.log(chalk.green('✓ Workflow healed successfully'));
        return { valid: true, workflow: healedWorkflow.workflow, healed: true };
      } else {
        console.log(chalk.red('✗ Workflow healing failed'));
        return { valid: false, errors: validation.errors };
      }
      
    } catch (error) {
      console.error(chalk.red(`Validation/healing error: ${error.message}`));
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate workflow structure
   */
  validateWorkflowStructure(workflow) {
    const errors = [];
    
    // Required fields
    if (!workflow.name) errors.push('Missing name');
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) errors.push('Invalid nodes');
    if (!workflow.connections || typeof workflow.connections !== 'object') errors.push('Invalid connections');
    if (!workflow.settings || typeof workflow.settings !== 'object') errors.push('Missing settings');
    
    // Node validation
    if (workflow.nodes) {
      workflow.nodes.forEach((node, i) => {
        if (!node.type) errors.push(`Node ${i} missing type`);
        if (!node.typeVersion) errors.push(`Node ${i} missing typeVersion`);
        if (!node.position) errors.push(`Node ${i} missing position`);
        if (node.parameters === undefined) errors.push(`Node ${i} missing parameters`);
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Heal workflow issues
   */
  healWorkflow(workflow, errors) {
    try {
      const healed = JSON.parse(JSON.stringify(workflow)); // Deep copy
      
      // Fix missing required fields
      if (!healed.name) healed.name = 'Untitled Workflow';
      if (!healed.nodes) healed.nodes = [];
      if (!healed.connections) healed.connections = {};
      if (!healed.settings) healed.settings = { executionOrder: 'v1' };
      
      // Fix nodes
      healed.nodes = healed.nodes.map((node, i) => {
        if (!node.name) node.name = node.id || `Node_${i}`;
        if (!node.type) node.type = 'n8n-nodes-base.noOp';
        if (!node.typeVersion) node.typeVersion = 1;
        if (!node.position) node.position = [250 + (i * 200), 300];
        if (node.parameters === undefined) node.parameters = {};
        
        // Remove meta field if it exists (not allowed in n8n)
        delete node.meta;
        
        return node;
      });
      
      // Remove meta from workflow (not standard n8n field)
      delete healed.meta;
      
      return { success: true, workflow: healed };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy workflow to n8n instance via API
   */
  async deployWorkflow(workflow, activate = false) {
    console.log(chalk.blue('🚀 Deploying workflow to n8n...'));
    
    try {
      // Remove meta data before deployment
      const deployWorkflow = { ...workflow };
      delete deployWorkflow.meta;
      
      const response = await axios.post(
        `${this.apiUrl}/workflows`,
        deployWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const workflowId = response.data?.data?.id || response.data?.id;
      console.log(chalk.green(`✓ Workflow deployed (ID: ${workflowId})`));
      
      // Activate workflow if requested
      if (activate) {
        await this.activateWorkflow(workflowId);
      }
      
      return { success: true, workflowId, response: response.data };
      
    } catch (error) {
      console.error(chalk.red(`Deployment error: ${error.response?.data?.message || error.message}`));
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Activate workflow and get node-level errors
   */
  async activateWorkflow(workflowId) {
    console.log(chalk.blue(`🔄 Activating workflow ${workflowId}...`));
    
    try {
      // Activate workflow
      const activateResponse = await axios.patch(
        `${this.apiUrl}/workflows/${workflowId}`,
        { active: true },
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(chalk.green(`✓ Workflow activated`));
      
      // Check for node-level errors by attempting a test execution
      await this.getNodeLevelErrors(workflowId);
      
      return { success: true, response: activateResponse.data };
      
    } catch (error) {
      console.error(chalk.red(`Activation error: ${error.response?.data?.message || error.message}`));
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Get node-level errors by testing workflow execution
   */
  async getNodeLevelErrors(workflowId) {
    console.log(chalk.blue('🔍 Checking for node-level errors...'));
    
    try {
      // Execute workflow to detect node errors
      const executeResponse = await axios.post(
        `${this.apiUrl}/workflows/${workflowId}/execute`,
        {},
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const executionId = executeResponse.data?.data?.executionId || executeResponse.data?.executionId;
      
      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get execution results
      const resultResponse = await axios.get(
        `${this.apiUrl}/executions/${executionId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );
      
      const execution = resultResponse.data?.data || resultResponse.data;
      
      if (execution.finished === false || execution.stoppedAt) {
        console.log(chalk.yellow('⚠ Execution completed with issues:'));
        
        // Analyze node errors
        if (execution.data?.resultData?.error) {
          console.log(chalk.red(`Node Error: ${execution.data.resultData.error.message}`));
          console.log(chalk.gray(`Stack: ${execution.data.resultData.error.stack}`));
        }
        
        return { hasErrors: true, execution };
      } else {
        console.log(chalk.green('✓ No node-level errors detected'));
        return { hasErrors: false, execution };
      }
      
    } catch (error) {
      console.error(chalk.red(`Error checking node-level errors: ${error.response?.data?.message || error.message}`));
      return { hasErrors: true, error: error.message };
    }
  }

  /**
   * Complete workflow orchestration pipeline
   */
  async orchestrateWorkflow(intent, workflowName, activate = false) {
    console.log(chalk.bold.cyan(`\n🎯 Starting Workflow Orchestration\n`));
    console.log(chalk.gray(`Intent: ${intent}`));
    console.log(chalk.gray(`Name: ${workflowName}`));
    console.log(chalk.gray(`Auto-activate: ${activate}\n`));
    
    try {
      // 1. Initialize MCP
      const mcpReady = await this.initializeMCP();
      if (!mcpReady) {
        throw new Error('Failed to initialize MCP server');
      }

      // 2. Validate intent and search nodes
      const intentValidation = await this.validateIntent(intent);
      if (!intentValidation.valid) {
        throw new Error('Intent validation failed: ' + intentValidation.error);
      }

      // 3. Create workflow JSON
      const workflowResult = await this.createWorkflowJSON(
        intent, 
        intentValidation.nodes, 
        workflowName
      );
      if (!workflowResult.success) {
        throw new Error('Workflow creation failed: ' + workflowResult.error);
      }

      // 4. Validate and heal workflow
      const validation = await this.validateAndHealWorkflow(workflowResult.workflow);
      if (!validation.valid) {
        throw new Error('Workflow validation failed: ' + validation.error);
      }

      // 5. Deploy to n8n
      const deployment = await this.deployWorkflow(validation.workflow, activate);
      if (!deployment.success) {
        throw new Error('Deployment failed: ' + deployment.error);
      }

      // 6. Get final status
      if (activate) {
        const errorCheck = await this.getNodeLevelErrors(deployment.workflowId);
        if (errorCheck.hasErrors) {
          console.log(chalk.yellow('⚠ Workflow deployed but has runtime errors'));
        }
      }

      console.log(chalk.bold.green('\n🎉 Workflow Orchestration Complete!\n'));
      console.log(chalk.green(`✓ Workflow ID: ${deployment.workflowId}`));
      console.log(chalk.green(`✓ Status: ${activate ? 'Active' : 'Inactive'}`));
      
      if (validation.healed) {
        console.log(chalk.yellow(`✓ Workflow was automatically healed`));
      }

      return {
        success: true,
        workflowId: deployment.workflowId,
        workflow: validation.workflow,
        healed: validation.healed || false
      };

    } catch (error) {
      console.log(chalk.bold.red('\n❌ Orchestration Failed\n'));
      console.error(chalk.red(`Error: ${error.message}`));
      return { success: false, error: error.message };
    } finally {
      // Cleanup MCP server
      if (this.mcpServer) {
        this.mcpServer.kill();
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.mcpDb) {
      this.mcpDb.close();
      console.log(chalk.gray('MCP database connection closed'));
    }
  }
}

// CLI Interface
if (require.main === module) {
  const { Command } = require('commander');
  const program = new Command();

  program
    .name('n8n-workflow-orchestrator')
    .description('N8N Workflow Orchestrator using czlonkowski n8n-mcp')
    .version('1.0.0');

  program
    .command('create')
    .description('Create and deploy a workflow from intent')
    .requiredOption('-i, --intent <intent>', 'Workflow intent description')
    .option('-n, --name <name>', 'Workflow name')
    .option('-a, --activate', 'Activate workflow after deployment')
    .action(async (options) => {
      const orchestrator = new N8nWorkflowOrchestrator();
      
      process.on('SIGINT', () => {
        orchestrator.cleanup();
        process.exit(0);
      });
      
      const result = await orchestrator.orchestrateWorkflow(
        options.intent,
        options.name || `Workflow_${Date.now()}`,
        options.activate || false
      );
      
      orchestrator.cleanup();
      process.exit(result.success ? 0 : 1);
    });

  program
    .command('validate-intent')
    .description('Validate workflow intent and suggest nodes')
    .requiredOption('-i, --intent <intent>', 'Workflow intent description')
    .action(async (options) => {
      const orchestrator = new N8nWorkflowOrchestrator();
      
      const mcpReady = await orchestrator.initializeMCP();
      if (!mcpReady) {
        console.error('Failed to initialize MCP');
        process.exit(1);
      }
      
      const validation = await orchestrator.validateIntent(options.intent);
      console.log(JSON.stringify(validation, null, 2));
      
      orchestrator.cleanup();
      process.exit(0);
    });

  program.parse();
}

module.exports = N8nWorkflowOrchestrator;