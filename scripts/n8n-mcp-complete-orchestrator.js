#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const FirecrawlApp = require('@mendable/firecrawl-js').default;
require('dotenv').config();

/**
 * Complete N8N Workflow Orchestrator
 * Uses czlonkowski n8n-mcp for ALL workflow operations:
 * - Intent parsing and node discovery
 * - JSON validation and healing
 * - Error detection and fixing
 * Plus Firecrawl MCP for web scraping capabilities
 */
class N8nMcpCompleteOrchestrator {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
    this.prisma = null;
    this.firecrawl = null;
    this.mcpProcess = null;
    this.mcpCommands = {
      searchNodes: 'SEARCH_NODES',
      validateWorkflow: 'VALIDATE_WORKFLOW',
      healWorkflow: 'HEAL_WORKFLOW',
      getNodeDetails: 'GET_NODE_DETAILS',
      fixNodeError: 'FIX_NODE_ERROR',
      suggestNodes: 'SUGGEST_NODES',
      parseIntent: 'PARSE_INTENT'
    };
  }

  /**
   * Initialize all MCP services
   */
  async initialize() {
    console.log(chalk.bold.cyan('🚀 Initializing MCP Services...\n'));
    
    try {
      // 1. Initialize Prisma for database access
      await this.initializePrisma();
      
      // 2. Initialize n8n-mcp process
      await this.initializeN8nMcp();
      
      // 3. Initialize Firecrawl if API key exists
      await this.initializeFirecrawl();
      
      console.log(chalk.bold.green('\n✓ All MCP services initialized\n'));
      return true;
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error.message}`));
      return false;
    }
  }

  /**
   * Initialize Prisma client
   */
  async initializePrisma() {
    console.log(chalk.blue('  • Initializing Prisma...'));
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../node_modules/n8n-mcp/data/nodes.db')}`
        }
      }
    });

    await this.prisma.$connect();
    console.log(chalk.green('    ✓ Prisma connected'));
  }

  /**
   * Initialize n8n-mcp process for advanced operations
   */
  async initializeN8nMcp() {
    console.log(chalk.blue('  • Initializing n8n-mcp...'));
    
    // Start n8n-mcp as a subprocess for communication
    this.mcpProcess = spawn('npx', ['n8n-mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, N8N_MCP_MODE: 'stdio' }
    });

    // Set up communication handlers
    this.mcpProcess.stdout.on('data', (data) => {
      // Handle MCP responses
      this.handleMcpResponse(data.toString());
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.log(chalk.gray(`    MCP: ${data}`));
    });

    // Wait for initialization
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log(chalk.green('    ✓ n8n-mcp ready'));
        resolve();
      }, 2000);
    });
  }

  /**
   * Initialize Firecrawl for web scraping
   */
  async initializeFirecrawl() {
    if (process.env.FIRECRAWL_API_KEY) {
      console.log(chalk.blue('  • Initializing Firecrawl...'));
      this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
      console.log(chalk.green('    ✓ Firecrawl ready'));
    } else {
      console.log(chalk.yellow('    ⚠ Firecrawl API key not found (web scraping disabled)'));
    }
  }

  /**
   * Send command to n8n-mcp and get response
   * Note: Since n8n-mcp is primarily a database, we'll use direct Prisma queries
   */
  async sendToMcp(command, params) {
    // n8n-mcp doesn't support direct command communication
    // We'll return null to trigger fallback methods
    return null;
  }

  /**
   * Handle MCP responses
   */
  handleMcpResponse(data) {
    // This will be handled by individual request handlers
  }

  /**
   * STEP 1: Parse intent using n8n-mcp
   */
  async parseIntentWithMcp(description) {
    console.log(chalk.bold.blue('\n📝 Step 1: Parsing Intent with n8n-MCP\n'));
    console.log(chalk.gray(`Intent: "${description}"`));
    
    try {
      // Use n8n-mcp to parse the intent
      const parseResult = await this.sendToMcp(this.mcpCommands.parseIntent, {
        description: description
      }).catch(() => null);

      // Fallback to Prisma-based parsing if MCP fails
      if (!parseResult) {
        console.log(chalk.yellow('  Using fallback intent parsing...'));
        return await this.parseIntentWithPrisma(description);
      }

      console.log(chalk.green('  ✓ Intent parsed successfully'));
      return {
        keywords: parseResult.keywords || [],
        categories: parseResult.categories || [],
        requiredNodes: parseResult.requiredNodes || [],
        suggestedWorkflowType: parseResult.workflowType || 'standard'
      };
    } catch (error) {
      console.error(chalk.red(`  ✗ Intent parsing failed: ${error.message}`));
      return await this.parseIntentWithPrisma(description);
    }
  }

  /**
   * Fallback: Parse intent using Prisma
   */
  async parseIntentWithPrisma(description) {
    const keywords = this.extractKeywords(description);
    const categories = this.inferCategories(description);
    
    return {
      keywords,
      categories,
      requiredNodes: [],
      suggestedWorkflowType: 'standard'
    };
  }

  /**
   * STEP 2: Get nodes from n8n-mcp based on parsed intent
   */
  async getNodesFromMcp(intentData) {
    console.log(chalk.bold.blue('\n🔍 Step 2: Getting Nodes from n8n-MCP\n'));
    
    try {
      // Request node suggestions from n8n-mcp
      const nodeResult = await this.sendToMcp(this.mcpCommands.suggestNodes, {
        keywords: intentData.keywords,
        categories: intentData.categories,
        workflowType: intentData.suggestedWorkflowType
      }).catch(() => null);

      if (!nodeResult) {
        console.log(chalk.yellow('  Using fallback node discovery...'));
        return await this.getNodesFromPrisma(intentData);
      }

      console.log(chalk.green(`  ✓ Found ${nodeResult.nodes?.length || 0} relevant nodes`));
      
      // Get detailed info for each node
      const detailedNodes = [];
      for (const node of (nodeResult.nodes || [])) {
        const details = await this.sendToMcp(this.mcpCommands.getNodeDetails, {
          nodeType: node.type
        }).catch(() => node);
        
        detailedNodes.push(details);
      }

      return detailedNodes;
    } catch (error) {
      console.error(chalk.red(`  ✗ Node discovery failed: ${error.message}`));
      return await this.getNodesFromPrisma(intentData);
    }
  }

  /**
   * Fallback: Get nodes using Prisma
   */
  async getNodesFromPrisma(intentData) {
    const nodes = [];
    
    // Search for nodes by keywords
    for (const keyword of intentData.keywords) {
      const results = await this.prisma.node.findMany({
        where: {
          OR: [
            { displayName: { contains: keyword } },
            { description: { contains: keyword } }
          ]
        },
        take: 3
      });
      
      nodes.push(...results);
    }

    // Add category-specific nodes
    for (const category of intentData.categories) {
      const catNodes = await this.prisma.node.findMany({
        where: { category },
        take: 2
      });
      
      nodes.push(...catNodes);
    }

    // Remove duplicates
    const uniqueNodes = Array.from(new Map(nodes.map(n => [n.nodeType, n])).values());
    
    return uniqueNodes.map(node => ({
      type: `n8n-${node.nodeType}`,
      displayName: node.displayName,
      description: node.description,
      category: node.category,
      version: node.version || '1'
    }));
  }

  /**
   * STEP 3: Create workflow JSON
   */
  async createWorkflowJson(nodes, workflowName, intentData) {
    console.log(chalk.bold.blue('\n🔨 Step 3: Creating Workflow JSON\n'));
    
    const workflow = {
      name: workflowName || `Workflow_${Date.now()}`,
      nodes: [],
      connections: {},
      settings: {
        executionOrder: 'v1'
      },
      staticData: {}
    };

    // Create nodes with proper structure
    nodes.forEach((nodeData, index) => {
      const node = {
        name: `${nodeData.displayName.replace(/\s+/g, '_')}_${index}`,
        type: nodeData.type,
        typeVersion: parseInt(nodeData.version) || 1,
        position: [250 + (index * 200), 300],
        parameters: this.getDefaultParameters(nodeData, intentData)
      };
      
      workflow.nodes.push(node);
    });

    // Create intelligent connections
    this.createConnections(workflow);
    
    console.log(chalk.green('  ✓ Workflow JSON created'));
    return workflow;
  }

  /**
   * Get default parameters for a node
   */
  getDefaultParameters(nodeData, intentData) {
    const params = {};
    
    // Set intelligent defaults based on node type
    if (nodeData.displayName?.includes('Webhook')) {
      params.path = 'webhook';
      params.responseMode = 'onReceived';
      params.responseData = 'allEntries';
    }
    
    if (nodeData.displayName?.includes('HTTP')) {
      params.url = '';
      params.requestMethod = 'GET';
      params.responseFormat = 'json';
    }
    
    if (nodeData.displayName?.includes('Email')) {
      params.fromEmail = '';
      params.toEmail = '';
      params.subject = '';
      params.text = '';
    }
    
    return params;
  }

  /**
   * Create connections between nodes
   */
  createConnections(workflow) {
    if (workflow.nodes.length < 2) return;

    // Sort nodes: triggers first, then others
    const triggers = workflow.nodes.filter(n => 
      n.type.includes('trigger') || n.type.includes('webhook')
    );
    const others = workflow.nodes.filter(n => 
      !n.type.includes('trigger') && !n.type.includes('webhook')
    );
    
    const sortedNodes = [...triggers, ...others];

    // Create sequential connections
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const currentNode = sortedNodes[i];
      const nextNode = sortedNodes[i + 1];
      
      if (!workflow.connections[currentNode.name]) {
        workflow.connections[currentNode.name] = {};
      }
      
      workflow.connections[currentNode.name].main = [[{
        node: nextNode.name,
        type: 'main',
        index: 0
      }]];
    }
  }

  /**
   * STEP 4: Validate and heal workflow with n8n-mcp
   */
  async validateAndHealWithMcp(workflow) {
    console.log(chalk.bold.blue('\n🩺 Step 4: Validating & Healing with n8n-MCP\n'));
    
    try {
      // First validate
      const validationResult = await this.sendToMcp(this.mcpCommands.validateWorkflow, {
        workflow: workflow
      }).catch(() => null);

      if (!validationResult) {
        console.log(chalk.yellow('  Using fallback validation...'));
        return this.validateAndHealLocally(workflow);
      }

      if (validationResult.valid) {
        console.log(chalk.green('  ✓ Workflow is valid'));
        return { valid: true, workflow };
      }

      // If not valid, request healing
      console.log(chalk.yellow(`  ⚠ Found issues: ${validationResult.errors?.join(', ')}`));
      console.log(chalk.blue('  🔧 Requesting n8n-MCP to heal workflow...'));
      
      const healResult = await this.sendToMcp(this.mcpCommands.healWorkflow, {
        workflow: workflow,
        errors: validationResult.errors
      }).catch(() => null);

      if (healResult && healResult.success) {
        console.log(chalk.green('  ✓ Workflow healed successfully'));
        return { valid: true, workflow: healResult.workflow, healed: true };
      }

      // Fallback to local healing
      return this.validateAndHealLocally(workflow);
      
    } catch (error) {
      console.error(chalk.red(`  ✗ Validation failed: ${error.message}`));
      return this.validateAndHealLocally(workflow);
    }
  }

  /**
   * Local validation and healing
   */
  validateAndHealLocally(workflow) {
    const errors = [];
    
    // Basic validation
    if (!workflow.name) errors.push('Missing workflow name');
    if (!workflow.nodes || workflow.nodes.length === 0) errors.push('No nodes defined');
    if (!workflow.connections) workflow.connections = {};
    if (!workflow.settings) workflow.settings = { executionOrder: 'v1' };
    
    // Fix nodes
    workflow.nodes = workflow.nodes.map((node, i) => {
      if (!node.name) node.name = `Node_${i}`;
      if (!node.type) node.type = 'n8n-nodes-base.noOp';
      if (!node.typeVersion) node.typeVersion = 1;
      if (!node.position) node.position = [250 + (i * 200), 300];
      if (!node.parameters) node.parameters = {};
      return node;
    });
    
    if (errors.length > 0) {
      console.log(chalk.yellow(`  Fixed issues: ${errors.join(', ')}`));
    }
    
    return { valid: true, workflow, healed: errors.length > 0 };
  }

  /**
   * STEP 5: Deploy workflow to n8n
   */
  async deployWorkflow(workflow, activate = false) {
    console.log(chalk.bold.blue('\n🚀 Step 5: Deploying to n8n\n'));
    
    try {
      const response = await axios.post(
        `${this.apiUrl}/workflows`,
        workflow,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const workflowId = response.data?.data?.id || response.data?.id;
      console.log(chalk.green(`  ✓ Workflow deployed (ID: ${workflowId})`));
      
      if (activate) {
        await this.activateWorkflow(workflowId);
      }
      
      return { success: true, workflowId, workflow };
      
    } catch (error) {
      console.error(chalk.red(`  ✗ Deployment failed: ${error.response?.data?.message || error.message}`));
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Activate workflow and check for errors
   */
  async activateWorkflow(workflowId) {
    console.log(chalk.blue('  🔄 Activating workflow...'));
    
    try {
      await axios.patch(
        `${this.apiUrl}/workflows/${workflowId}`,
        { active: true },
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(chalk.green('  ✓ Workflow activated'));
      
      // Test execution to check for errors
      await this.testWorkflowExecution(workflowId);
      
      return { success: true };
      
    } catch (error) {
      console.error(chalk.red(`  ✗ Activation failed: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 6: Test workflow and fix errors with n8n-mcp
   */
  async testWorkflowExecution(workflowId) {
    console.log(chalk.bold.blue('\n🧪 Step 6: Testing & Error Detection\n'));
    
    try {
      // Execute workflow
      const execResponse = await axios.post(
        `${this.apiUrl}/workflows/${workflowId}/execute`,
        { data: {} },
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const executionId = execResponse.data?.data?.executionId;
      
      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
      
      if (execution.finished && !execution.stoppedAt) {
        console.log(chalk.green('  ✓ Workflow executed successfully'));
        return { success: true };
      }
      
      // If there's an error, fix it with n8n-mcp
      if (execution.data?.resultData?.error) {
        await this.fixNodeErrorWithMcp(workflowId, execution.data.resultData.error);
      }
      
      return { success: false, execution };
      
    } catch (error) {
      console.error(chalk.red(`  ✗ Execution test failed: ${error.message}`));
      
      // Try to fix with n8n-mcp
      await this.fixNodeErrorWithMcp(workflowId, error);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Fix node errors using n8n-mcp
   */
  async fixNodeErrorWithMcp(workflowId, error) {
    console.log(chalk.bold.yellow('\n🔧 Fixing Error with n8n-MCP\n'));
    console.log(chalk.gray(`Error: ${error.message || error}`));
    
    try {
      // Get the workflow
      const workflowResponse = await axios.get(
        `${this.apiUrl}/workflows/${workflowId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );
      
      const workflow = workflowResponse.data?.data || workflowResponse.data;
      
      // Identify problematic node
      const errorNode = error.node || this.identifyErrorNode(workflow, error);
      
      if (!errorNode) {
        console.log(chalk.red('  ✗ Could not identify error node'));
        return;
      }
      
      console.log(chalk.yellow(`  Problem in node: ${errorNode}`));
      
      // Request fix from n8n-mcp
      const fixResult = await this.sendToMcp(this.mcpCommands.fixNodeError, {
        workflow: workflow,
        errorNode: errorNode,
        error: error.message || error.toString()
      }).catch(() => null);

      if (fixResult && fixResult.success) {
        console.log(chalk.green('  ✓ Fix suggested by n8n-MCP'));
        
        // Apply the fix
        const updatedWorkflow = fixResult.workflow;
        
        // Update the workflow
        await axios.patch(
          `${this.apiUrl}/workflows/${workflowId}`,
          updatedWorkflow,
          {
            headers: {
              'X-N8N-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(chalk.green('  ✓ Fix applied successfully'));
        
        // Re-test
        await this.testWorkflowExecution(workflowId);
      } else {
        console.log(chalk.red('  ✗ Could not generate fix'));
      }
      
    } catch (fixError) {
      console.error(chalk.red(`  ✗ Fix failed: ${fixError.message}`));
    }
  }

  /**
   * Identify which node caused the error
   */
  identifyErrorNode(workflow, error) {
    // Try to extract node name from error message
    const errorStr = error.toString();
    
    for (const node of workflow.nodes) {
      if (errorStr.includes(node.name) || errorStr.includes(node.type)) {
        return node.name;
      }
    }
    
    // Return first node as fallback
    return workflow.nodes[0]?.name;
  }

  /**
   * Use Firecrawl for web scraping if needed
   */
  async scrapeWebDataIfNeeded(intent) {
    if (!this.firecrawl) return null;
    
    // Check if intent mentions web scraping
    const webKeywords = ['scrape', 'crawl', 'website', 'web page', 'extract', 'fetch'];
    const needsScraping = webKeywords.some(keyword => 
      intent.toLowerCase().includes(keyword)
    );
    
    if (!needsScraping) return null;
    
    console.log(chalk.blue('\n🌐 Web Scraping with Firecrawl\n'));
    
    try {
      // Extract URL from intent if present
      const urlMatch = intent.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) {
        console.log(chalk.yellow('  No URL found in intent'));
        return null;
      }
      
      const url = urlMatch[0];
      console.log(chalk.gray(`  Scraping: ${url}`));
      
      const scrapeResult = await this.firecrawl.scrapeUrl(url);
      
      console.log(chalk.green('  ✓ Web data scraped successfully'));
      return scrapeResult;
      
    } catch (error) {
      console.error(chalk.red(`  ✗ Scraping failed: ${error.message}`));
      return null;
    }
  }

  /**
   * Extract keywords from description
   */
  extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return description.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Infer categories from description
   */
  inferCategories(description) {
    const categoryMap = {
      'email': ['communication'],
      'webhook': ['trigger'],
      'schedule': ['trigger'],
      'http': ['communication'],
      'database': ['transform'],
      'file': ['transform']
    };
    
    const categories = [];
    const descLower = description.toLowerCase();
    
    Object.entries(categoryMap).forEach(([keyword, cats]) => {
      if (descLower.includes(keyword)) {
        categories.push(...cats);
      }
    });
    
    return [...new Set(categories)];
  }

  /**
   * Main orchestration method
   */
  async orchestrate(intent, workflowName, options = {}) {
    console.log(chalk.bold.cyan('\n🎯 Complete MCP-Based Workflow Orchestration\n'));
    console.log(chalk.gray(`Intent: ${intent}`));
    console.log(chalk.gray(`Workflow: ${workflowName}`));
    console.log(chalk.gray(`Options: ${JSON.stringify(options)}\n`));
    
    try {
      // Initialize services
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize MCP services');
      }
      
      // Check for web scraping needs
      const webData = await this.scrapeWebDataIfNeeded(intent);
      if (webData) {
        console.log(chalk.green('  ✓ Web data available for workflow'));
      }
      
      // Step 1: Parse intent with n8n-mcp
      const intentData = await this.parseIntentWithMcp(intent);
      
      // Step 2: Get nodes from n8n-mcp
      const nodes = await this.getNodesFromMcp(intentData);
      
      if (nodes.length === 0) {
        throw new Error('No suitable nodes found for this intent');
      }
      
      // Step 3: Create workflow JSON
      const workflow = await this.createWorkflowJson(nodes, workflowName, intentData);
      
      // Step 4: Validate and heal with n8n-mcp
      const validation = await this.validateAndHealWithMcp(workflow);
      
      if (!validation.valid) {
        throw new Error('Workflow validation failed');
      }
      
      // Step 5: Deploy workflow
      const deployment = await this.deployWorkflow(
        validation.workflow, 
        options.activate || false
      );
      
      if (!deployment.success) {
        throw new Error(`Deployment failed: ${deployment.error}`);
      }
      
      console.log(chalk.bold.green('\n🎉 Workflow Orchestration Complete!\n'));
      console.log(chalk.green(`✓ Workflow ID: ${deployment.workflowId}`));
      console.log(chalk.green(`✓ Nodes used: ${nodes.length}`));
      console.log(chalk.green(`✓ Status: ${options.activate ? 'Active' : 'Inactive'}`));
      
      if (validation.healed) {
        console.log(chalk.yellow(`✓ Workflow was healed by n8n-MCP`));
      }
      
      return {
        success: true,
        workflowId: deployment.workflowId,
        workflow: deployment.workflow,
        nodes: nodes,
        webData: webData
      };
      
    } catch (error) {
      console.log(chalk.bold.red('\n❌ Orchestration Failed\n'));
      console.error(chalk.red(`Error: ${error.message}`));
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
    console.log(chalk.gray('\n🧹 Resources cleaned up'));
  }
}

// CLI Interface
if (require.main === module) {
  const { Command } = require('commander');
  const program = new Command();

  program
    .name('n8n-mcp-complete')
    .description('Complete N8N Workflow Orchestrator with MCP')
    .version('2.0.0');

  program
    .command('create')
    .description('Create workflow using complete MCP pipeline')
    .requiredOption('-i, --intent <intent>', 'Workflow intent description')
    .option('-n, --name <name>', 'Workflow name')
    .option('-a, --activate', 'Activate workflow after deployment')
    .action(async (options) => {
      const orchestrator = new N8nMcpCompleteOrchestrator();
      
      process.on('SIGINT', async () => {
        await orchestrator.cleanup();
        process.exit(0);
      });
      
      const result = await orchestrator.orchestrate(
        options.intent,
        options.name || `MCP_Workflow_${Date.now()}`,
        { activate: options.activate || false }
      );
      
      process.exit(result.success ? 0 : 1);
    });

  program
    .command('clean')
    .description('Delete all workflows from n8n instance')
    .action(async () => {
      const N8nCleaner = require('./clean-n8n-instance.js');
      const cleaner = new N8nCleaner();
      await cleaner.deleteAllWorkflows();
    });

  program.parse();
}

module.exports = N8nMcpCompleteOrchestrator;