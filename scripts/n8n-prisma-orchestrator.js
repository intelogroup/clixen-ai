#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

/**
 * Enhanced N8N Workflow Orchestrator using Prisma MCP
 * Provides better database queries and n8n node management
 */
class N8nPrismaOrchestrator {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
    this.prisma = null;
    this.prismaMcpServer = null;
  }

  /**
   * Initialize Prisma client and MCP server
   */
  async initializePrisma() {
    console.log(chalk.blue('🚀 Initializing Prisma MCP...'));
    
    try {
      // Initialize Prisma client for direct database access
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: `file:${path.join(__dirname, '../node_modules/n8n-mcp/data/nodes.db')}`
          }
        }
      });

      // Test connection
      await this.prisma.$connect();
      console.log(chalk.green('✓ Prisma client connected to n8n-mcp database'));

      // Start Prisma MCP server for advanced queries
      await this.startPrismaMcpServer();

      return true;
    } catch (error) {
      console.error(chalk.red(`Failed to initialize Prisma: ${error.message}`));
      return false;
    }
  }

  /**
   * Start Prisma MCP server for enhanced query capabilities
   */
  async startPrismaMcpServer() {
    try {
      // Start local Prisma MCP server
      this.prismaMcpServer = spawn('npx', ['-y', 'prisma', 'mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname
      });

      // Wait for server initialization
      await new Promise((resolve, reject) => {
        let initialized = false;
        const timeout = setTimeout(() => {
          if (!initialized) {
            console.log(chalk.yellow('⚠ Prisma MCP server timeout, continuing without it'));
            resolve();
          }
        }, 10000);

        this.prismaMcpServer.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Server running') || output.includes('started')) {
            initialized = true;
            clearTimeout(timeout);
            console.log(chalk.green('✓ Prisma MCP server started'));
            resolve();
          }
        });

        this.prismaMcpServer.stderr.on('data', (data) => {
          console.log(chalk.gray(`Prisma MCP: ${data}`));
        });
      });

    } catch (error) {
      console.log(chalk.yellow(`⚠ Prisma MCP server failed to start: ${error.message}`));
    }
  }

  /**
   * Enhanced node search using Prisma with advanced filtering
   */
  async searchNodes(query, options = {}) {
    const {
      limit = 10,
      category = null,
      isAiTool = null,
      isTrigger = null,
      isWebhook = null
    } = options;

    console.log(chalk.blue(`🔍 Searching nodes for: "${query}"`));
    
    try {
      // Build dynamic where clause (SQLite doesn't support mode: 'insensitive')
      const where = {
        OR: [
          { displayName: { contains: query } },
          { description: { contains: query } },
          { nodeType: { contains: query } },
          { category: { contains: query } }
        ]
      };

      // Add filters
      if (category) where.category = category;
      if (isAiTool !== null) where.isAiTool = isAiTool ? 1 : 0;
      if (isTrigger !== null) where.isTrigger = isTrigger ? 1 : 0;
      if (isWebhook !== null) where.isWebhook = isWebhook ? 1 : 0;

      const nodes = await this.prisma.node.findMany({
        where,
        orderBy: [
          { displayName: 'asc' }
        ],
        take: limit
      });

      console.log(chalk.green(`✓ Found ${nodes.length} matching nodes`));

      return nodes.map(node => ({
        type: `n8n-${node.nodeType}`,
        displayName: node.displayName,
        description: node.description,
        category: node.category,
        version: node.version || '1',
        isAiTool: Boolean(node.isAiTool),
        isTrigger: Boolean(node.isTrigger),
        isWebhook: Boolean(node.isWebhook),
        properties: node.propertiesSchema ? JSON.parse(node.propertiesSchema) : {},
        operations: node.operations ? JSON.parse(node.operations) : []
      }));

    } catch (error) {
      console.error(chalk.red(`Prisma search error: ${error.message}`));
      return this.getFallbackNodes(query);
    }
  }

  /**
   * Get nodes by category with Prisma
   */
  async getNodesByCategory(category, limit = 20) {
    try {
      const nodes = await this.prisma.node.findMany({
        where: { category },
        orderBy: { displayName: 'asc' },
        take: limit
      });

      return nodes.map(node => ({
        type: `n8n-${node.nodeType}`,
        displayName: node.displayName,
        description: node.description,
        category: node.category,
        isAiTool: Boolean(node.isAiTool),
        isTrigger: Boolean(node.isTrigger)
      }));
    } catch (error) {
      console.error(chalk.red(`Error getting nodes by category: ${error.message}`));
      return [];
    }
  }

  /**
   * Get AI-capable nodes
   */
  async getAiNodes(limit = 20) {
    try {
      const nodes = await this.prisma.node.findMany({
        where: { isAiTool: 1 },
        orderBy: { displayName: 'asc' },
        take: limit
      });

      return nodes.map(node => ({
        type: `n8n-${node.nodeType}`,
        displayName: node.displayName,
        description: node.description,
        category: node.category
      }));
    } catch (error) {
      console.error(chalk.red(`Error getting AI nodes: ${error.message}`));
      return [];
    }
  }

  /**
   * Get workflow templates using Prisma
   */
  async searchTemplates(query, limit = 10) {
    try {
      const templates = await this.prisma.template.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        orderBy: { views: 'desc' },
        take: limit
      });

      return templates.map(template => ({
        id: template.id,
        workflowId: template.workflowId,
        name: template.name,
        description: template.description,
        author: template.authorName,
        views: template.views,
        nodesUsed: template.nodesUsed ? JSON.parse(template.nodesUsed) : [],
        workflow: template.workflowJson ? JSON.parse(template.workflowJson) : null
      }));
    } catch (error) {
      console.error(chalk.red(`Error searching templates: ${error.message}`));
      return [];
    }
  }

  /**
   * Enhanced intent validation with Prisma-powered analysis
   */
  async validateIntent(workflowDescription) {
    console.log(chalk.blue('🔍 Validating workflow intent with Prisma...'));
    
    try {
      // Extract keywords from intent
      const keywords = this.extractKeywords(workflowDescription);
      console.log(chalk.gray(`Keywords: ${keywords.join(', ')}`));

      // Search for relevant nodes using individual keywords for better matching
      const nodeResults = [];
      for (const keyword of keywords) {
        const keywordResults = await this.searchNodes(keyword, { limit: 5 });
        nodeResults.push(...keywordResults);
      }
      
      // Also search with combined keywords
      const combinedResults = await this.searchNodes(keywords.join(' '), { limit: 5 });
      nodeResults.push(...combinedResults);
      
      // Get category-specific recommendations
      const categories = this.inferCategories(workflowDescription);
      const categoryNodes = await Promise.all(
        categories.map(cat => this.getNodesByCategory(cat, 5))
      );
      
      const allNodes = [...nodeResults, ...categoryNodes.flat()];
      const uniqueNodes = this.deduplicateNodes(allNodes);

      // Check for AI tool requirements
      if (this.requiresAiTools(workflowDescription)) {
        const aiNodes = await this.getAiNodes(5);
        uniqueNodes.push(...aiNodes);
      }

      if (uniqueNodes.length === 0) {
        console.log(chalk.yellow('⚠ No matching nodes found for intent'));
        return { valid: false, suggestions: [] };
      }

      console.log(chalk.green(`✓ Found ${uniqueNodes.length} relevant nodes`));
      
      // Search for similar templates
      const templates = await this.searchTemplates(workflowDescription, 3);
      
      return { 
        valid: true, 
        nodes: uniqueNodes.slice(0, 10), // Limit to top 10
        templates,
        recommendations: uniqueNodes.map(node => ({
          type: node.type,
          displayName: node.displayName,
          category: node.category,
          description: node.description,
          reason: this.getRecommendationReason(node, workflowDescription)
        }))
      };
    } catch (error) {
      console.error(chalk.red(`Intent validation error: ${error.message}`));
      return { valid: false, error: error.message };
    }
  }

  /**
   * Extract keywords from workflow description
   */
  extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'when', 'where', 'how', 'what', 'why'];
    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Infer likely categories from description
   */
  inferCategories(description) {
    const categoryMap = {
      'email': ['communication'],
      'webhook': ['communication', 'trigger'],
      'http': ['communication'],
      'database': ['transform'],
      'schedule': ['trigger'],
      'slack': ['communication'],
      'discord': ['communication'],
      'twitter': ['communication'],
      'api': ['communication', 'transform'],
      'file': ['transform'],
      'csv': ['transform'],
      'json': ['transform']
    };

    const categories = new Set();
    const descLower = description.toLowerCase();
    
    Object.entries(categoryMap).forEach(([keyword, cats]) => {
      if (descLower.includes(keyword)) {
        cats.forEach(cat => categories.add(cat));
      }
    });

    return Array.from(categories);
  }

  /**
   * Check if workflow requires AI tools
   */
  requiresAiTools(description) {
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'nlp', 'analysis', 'generate', 'classify', 'sentiment'];
    const descLower = description.toLowerCase();
    return aiKeywords.some(keyword => descLower.includes(keyword));
  }

  /**
   * Remove duplicate nodes
   */
  deduplicateNodes(nodes) {
    const seen = new Set();
    return nodes.filter(node => {
      if (seen.has(node.type)) return false;
      seen.add(node.type);
      return true;
    });
  }

  /**
   * Get recommendation reason
   */
  getRecommendationReason(node, description) {
    const descLower = description.toLowerCase();
    const nodeName = node.displayName.toLowerCase();
    
    if (descLower.includes(nodeName)) {
      return `Direct match: "${nodeName}" found in description`;
    }
    if (node.category && descLower.includes(node.category)) {
      return `Category match: ${node.category} functionality needed`;
    }
    if (node.isAiTool && this.requiresAiTools(description)) {
      return 'AI-powered node for intelligent processing';
    }
    if (node.isTrigger && (descLower.includes('when') || descLower.includes('trigger'))) {
      return 'Trigger node for workflow initiation';
    }
    return 'Relevant functionality match';
  }

  /**
   * Fallback node suggestions when Prisma fails
   */
  getFallbackNodes(query) {
    console.log(chalk.yellow('Using fallback node suggestions'));
    return [
      {
        type: 'n8n-nodes-base.webhook',
        displayName: 'Webhook',
        description: 'Receive HTTP requests',
        category: 'trigger'
      },
      {
        type: 'n8n-nodes-base.httpRequest',
        displayName: 'HTTP Request',
        description: 'Make HTTP requests to any URL',
        category: 'communication'
      },
      {
        type: 'n8n-nodes-base.emailSend',
        displayName: 'Send Email',
        description: 'Send emails using SMTP',
        category: 'communication'
      }
    ];
  }

  /**
   * Create enhanced workflow JSON with template support
   */
  async createWorkflowJSON(intent, validatedNodes, workflowName, templateWorkflow = null) {
    console.log(chalk.blue('🔨 Creating enhanced workflow JSON...'));
    
    try {
      let workflow;
      
      if (templateWorkflow) {
        // Use template as base and customize
        workflow = JSON.parse(JSON.stringify(templateWorkflow));
        workflow.name = workflowName || `${workflow.name}_${Date.now()}`;
        console.log(chalk.green('✓ Using template as base'));
      } else {
        // Create from scratch
        workflow = {
          name: workflowName || `Generated_Workflow_${Date.now()}`,
          nodes: [],
          connections: {},
          settings: {
            executionOrder: 'v1'
          },
          staticData: {}
        };

        // Create nodes with enhanced positioning
        validatedNodes.forEach((nodeDetail, index) => {
          const node = {
            name: `${nodeDetail.displayName.replace(/\s+/g, '_')}_${index}`,
            type: nodeDetail.type,
            typeVersion: parseInt(nodeDetail.version) || 1,
            position: [250 + (index * 200), 300],
            parameters: this.getDefaultParameters(nodeDetail)
          };
          
          workflow.nodes.push(node);
        });

        // Create intelligent connections
        this.createIntelligentConnections(workflow);
      }

      console.log(chalk.green('✓ Enhanced workflow JSON created'));
      return { success: true, workflow };
      
    } catch (error) {
      console.error(chalk.red(`Workflow creation error: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Get default parameters for a node
   */
  getDefaultParameters(nodeDetail) {
    const params = {};
    
    // Set intelligent defaults based on node type
    if (nodeDetail.isTrigger) {
      if (nodeDetail.displayName.includes('Schedule')) {
        params.rule = { interval: [{ field: 'cronExpression', expression: '0 9 * * *' }] };
      }
    }
    
    if (nodeDetail.displayName.includes('HTTP')) {
      params.url = 'https://example.com/api';
      params.requestMethod = 'GET';
    }
    
    return params;
  }

  /**
   * Create intelligent node connections
   */
  createIntelligentConnections(workflow) {
    if (workflow.nodes.length < 2) return;

    // Sort nodes by type priority (triggers first, then regular nodes)
    const sortedNodes = [...workflow.nodes].sort((a, b) => {
      const aIsTrigger = a.type.includes('trigger') || a.type.includes('webhook');
      const bIsTrigger = b.type.includes('trigger') || b.type.includes('webhook');
      
      if (aIsTrigger && !bIsTrigger) return -1;
      if (!aIsTrigger && bIsTrigger) return 1;
      return 0;
    });

    // Create sequential connections
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const currentNode = sortedNodes[i];
      const nextNode = sortedNodes[i + 1];
      
      workflow.connections[currentNode.name] = {
        main: [[{
          node: nextNode.name,
          type: 'main',
          index: 0
        }]]
      };
    }
  }

  /**
   * Deploy workflow to n8n instance with enhanced error handling
   */
  async deployWorkflow(workflow, activate = false) {
    console.log(chalk.blue('🚀 Deploying enhanced workflow to n8n...'));
    
    try {
      // Clean workflow for deployment
      const deployWorkflow = JSON.parse(JSON.stringify(workflow));
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
   * Activate workflow with enhanced monitoring
   */
  async activateWorkflow(workflowId) {
    console.log(chalk.blue(`🔄 Activating workflow ${workflowId}...`));
    
    try {
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
      return { success: true, response: activateResponse.data };
      
    } catch (error) {
      console.error(chalk.red(`Activation error: ${error.response?.data?.message || error.message}`));
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Enhanced workflow orchestration with Prisma
   */
  async orchestrateWorkflow(intent, workflowName, activate = false, useTemplate = false) {
    console.log(chalk.bold.cyan(`\n🎯 Enhanced Workflow Orchestration with Prisma\n`));
    console.log(chalk.gray(`Intent: ${intent}`));
    console.log(chalk.gray(`Name: ${workflowName}`));
    console.log(chalk.gray(`Auto-activate: ${activate}`));
    console.log(chalk.gray(`Use template: ${useTemplate}\n`));
    
    try {
      // 1. Initialize Prisma
      const prismaReady = await this.initializePrisma();
      if (!prismaReady) {
        throw new Error('Failed to initialize Prisma MCP');
      }

      // 2. Enhanced intent validation
      const intentValidation = await this.validateIntent(intent);
      if (!intentValidation.valid) {
        throw new Error('Intent validation failed: ' + intentValidation.error);
      }

      // 3. Select template if requested and available
      let templateWorkflow = null;
      if (useTemplate && intentValidation.templates.length > 0) {
        templateWorkflow = intentValidation.templates[0].workflow;
        console.log(chalk.green(`✓ Using template: ${intentValidation.templates[0].name}`));
      }

      // 4. Create enhanced workflow
      const workflowResult = await this.createWorkflowJSON(
        intent, 
        intentValidation.nodes, 
        workflowName,
        templateWorkflow
      );
      if (!workflowResult.success) {
        throw new Error('Workflow creation failed: ' + workflowResult.error);
      }

      // 5. Deploy to n8n
      const deployment = await this.deployWorkflow(workflowResult.workflow, activate);
      if (!deployment.success) {
        throw new Error('Deployment failed: ' + deployment.error);
      }

      console.log(chalk.bold.green('\n🎉 Enhanced Workflow Orchestration Complete!\n'));
      console.log(chalk.green(`✓ Workflow ID: ${deployment.workflowId}`));
      console.log(chalk.green(`✓ Status: ${activate ? 'Active' : 'Inactive'}`));
      console.log(chalk.green(`✓ Nodes used: ${intentValidation.nodes.length}`));
      
      if (templateWorkflow) {
        console.log(chalk.yellow(`✓ Based on template`));
      }

      return {
        success: true,
        workflowId: deployment.workflowId,
        workflow: workflowResult.workflow,
        recommendations: intentValidation.recommendations,
        templates: intentValidation.templates
      };

    } catch (error) {
      console.log(chalk.bold.red('\n❌ Enhanced Orchestration Failed\n'));
      console.error(chalk.red(`Error: ${error.message}`));
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Enhanced cleanup with Prisma
   */
  async cleanup() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
        console.log(chalk.gray('Prisma client disconnected'));
      }
      if (this.prismaMcpServer) {
        this.prismaMcpServer.kill();
        console.log(chalk.gray('Prisma MCP server stopped'));
      }
    } catch (error) {
      console.error(chalk.gray(`Cleanup error: ${error.message}`));
    }
  }
}

// CLI Interface
if (require.main === module) {
  const { Command } = require('commander');
  const program = new Command();

  program
    .name('n8n-prisma-orchestrator')
    .description('Enhanced N8N Workflow Orchestrator using Prisma MCP')
    .version('1.0.0');

  program
    .command('create')
    .description('Create and deploy a workflow from intent using Prisma')
    .requiredOption('-i, --intent <intent>', 'Workflow intent description')
    .option('-n, --name <name>', 'Workflow name')
    .option('-a, --activate', 'Activate workflow after deployment')
    .option('-t, --template', 'Use template if available')
    .action(async (options) => {
      const orchestrator = new N8nPrismaOrchestrator();
      
      process.on('SIGINT', async () => {
        await orchestrator.cleanup();
        process.exit(0);
      });
      
      const result = await orchestrator.orchestrateWorkflow(
        options.intent,
        options.name || `Workflow_${Date.now()}`,
        options.activate || false,
        options.template || false
      );
      
      process.exit(result.success ? 0 : 1);
    });

  program
    .command('validate-intent')
    .description('Validate workflow intent using Prisma')
    .requiredOption('-i, --intent <intent>', 'Workflow intent description')
    .action(async (options) => {
      const orchestrator = new N8nPrismaOrchestrator();
      
      const prismaReady = await orchestrator.initializePrisma();
      if (!prismaReady) {
        console.error('Failed to initialize Prisma');
        process.exit(1);
      }
      
      const validation = await orchestrator.validateIntent(options.intent);
      console.log(JSON.stringify(validation, null, 2));
      
      await orchestrator.cleanup();
      process.exit(0);
    });

  program
    .command('search-nodes')
    .description('Search nodes using Prisma')
    .requiredOption('-q, --query <query>', 'Search query')
    .option('-c, --category <category>', 'Filter by category')
    .option('-l, --limit <limit>', 'Limit results', parseInt, 10)
    .action(async (options) => {
      const orchestrator = new N8nPrismaOrchestrator();
      
      const prismaReady = await orchestrator.initializePrisma();
      if (!prismaReady) {
        console.error('Failed to initialize Prisma');
        process.exit(1);
      }
      
      const nodes = await orchestrator.searchNodes(options.query, {
        category: options.category,
        limit: options.limit
      });
      
      console.log(JSON.stringify(nodes, null, 2));
      
      await orchestrator.cleanup();
      process.exit(0);
    });

  program.parse();
}

module.exports = N8nPrismaOrchestrator;