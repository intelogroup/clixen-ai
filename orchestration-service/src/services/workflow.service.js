const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const jwtUtil = require('../utils/jwt.util');
const supabaseService = require('./supabase.service');

// Workflow credit costs configuration
const WORKFLOW_CREDITS = {
  'competitor-monitor': 5,
  'social-tracker': 3,
  'document-processor': 10,
  'email-automation': 2,
  'news-aggregator': 1,
  'lead-generator': 8,
  'seo-monitor': 4,
  'calendar-assistant': 2,
  'data-reporter': 6,
  'web-scraper': 3,
  'telegram-test': 1 // For testing
};

// AI model cost multipliers
const AI_MODEL_COSTS = {
  'gpt-4': 5,
  'gpt-4-turbo': 3,
  'gpt-3.5-turbo': 1,
  'claude-3-opus': 4,
  'claude-3-sonnet': 2,
  'claude-3-haiku': 1
};

class WorkflowService {
  constructor() {
    this.n8nBaseUrl = process.env.N8N_BASE_URL;
    this.n8nApiKey = process.env.N8N_API_KEY;
    
    if (!this.n8nBaseUrl) {
      logger.error('N8N_BASE_URL not configured');
    }
  }

  /**
   * Execute n8n workflow for a Telegram user
   * @param {number} telegramId - Telegram user ID
   * @param {string} workflowType - Type of workflow to execute
   * @param {Object} input - Input data for the workflow
   * @returns {Object} Workflow execution result
   */
  async executeWorkflow(telegramId, workflowType, input) {
    const executionId = crypto.randomUUID();
    
    try {
      logger.info(`Starting workflow execution: ${workflowType}`, { 
        telegramId, 
        executionId,
        workflowType 
      });

      // 1. Get and validate user
      const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);
      if (!telegramAccount?.user) {
        throw new Error('User not found or not activated');
      }

      const user = telegramAccount.user;

      // 2. Check if workflow type exists
      if (!WORKFLOW_CREDITS[workflowType]) {
        throw new Error(`Unknown workflow type: ${workflowType}`);
      }

      // 3. Calculate credit cost
      const baseCreditCost = WORKFLOW_CREDITS[workflowType];
      const aiMultiplier = this.calculateAIMultiplier(input);
      const totalCreditCost = Math.ceil(baseCreditCost * aiMultiplier);

      // 4. Check user credits
      const userCredits = await supabaseService.getUserCredits(user.id);
      if (!userCredits || (userCredits.total_credits - userCredits.used_credits) < totalCreditCost) {
        throw new Error('Insufficient credits. Please upgrade your plan.');
      }

      // 5. Generate authentication token for n8n
      const authToken = jwtUtil.generateWorkflowToken(user);

      // 6. Log execution start
      await supabaseService.logWorkflowStart({
        executionId,
        userId: user.id,
        telegramId: telegramId,
        workflowType,
        workflowName: this.getWorkflowDisplayName(workflowType),
        creditsCost: totalCreditCost,
        inputData: input
      });

      // 7. Execute n8n workflow
      const startTime = Date.now();
      const result = await this.callN8nWorkflow(workflowType, {
        ...input,
        _context: {
          userId: user.id,
          telegramId: telegramId,
          executionId: executionId,
          tier: user.tier
        }
      }, authToken, telegramId, executionId);

      const executionTime = Date.now() - startTime;

      // 8. Log execution completion
      await supabaseService.logWorkflowCompletion(executionId, {
        status: 'completed',
        executionTime,
        outputData: result,
        nodesExecuted: result.nodesExecuted || 1,
        inputSize: JSON.stringify(input).length,
        outputSize: JSON.stringify(result).length
      });

      // 9. Consume credits
      await supabaseService.consumeCredits(user.id, totalCreditCost);

      // 10. Update user activity
      await supabaseService.updateLastActivity(telegramId);

      logger.info(`Workflow execution completed: ${workflowType}`, {
        telegramId,
        executionId,
        executionTime,
        creditsConsumed: totalCreditCost
      });

      return {
        success: true,
        executionId,
        result: result.data || result,
        creditsConsumed: totalCreditCost,
        executionTime
      };

    } catch (error) {
      logger.error(`Workflow execution failed: ${workflowType}`, {
        telegramId,
        executionId,
        error: error.message
      });

      // Log execution failure
      await supabaseService.logWorkflowCompletion(executionId, {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - (this.startTime || Date.now())
      });

      throw error;
    }
  }

  /**
   * Call n8n workflow via webhook
   * @param {string} workflowType - Workflow type
   * @param {Object} payload - Request payload
   * @param {string} authToken - JWT token
   * @param {number} telegramId - Telegram user ID
   * @param {string} executionId - Execution ID
   * @returns {Object} n8n response
   */
  async callN8nWorkflow(workflowType, payload, authToken, telegramId, executionId) {
    const webhookUrl = `${this.n8nBaseUrl}/webhook/${workflowType}`;
    const timeout = 120000; // 2 minutes

    try {
      const response = await axios.post(webhookUrl, payload, {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': payload._context.userId,
          'X-Telegram-Id': telegramId,
          'X-Execution-Id': executionId,
          'X-Auth-Token': authToken,
          'X-User-Tier': payload._context.tier,
          'User-Agent': 'Telegram-Orchestrator/1.0'
        },
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });

      if (response.status >= 400) {
        throw new Error(`n8n workflow returned ${response.status}: ${response.data?.message || 'Unknown error'}`);
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Workflow execution timed out after 2 minutes');
      } else if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        throw new Error(`n8n workflow failed (${status}): ${message}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to n8n instance');
      } else {
        throw new Error(`Workflow execution failed: ${error.message}`);
      }
    }
  }

  /**
   * Calculate AI model cost multiplier based on input
   * @param {Object} input - Workflow input
   * @returns {number} Cost multiplier
   */
  calculateAIMultiplier(input) {
    // Default multiplier
    let multiplier = 1;

    // Check if specific AI model is requested
    if (input.aiModel) {
      multiplier = AI_MODEL_COSTS[input.aiModel] || 1;
    }

    // Check for large document processing
    if (input.documentSize && input.documentSize > 1000000) { // 1MB
      multiplier *= 2;
    }

    // Check for batch processing
    if (input.batchSize && input.batchSize > 10) {
      multiplier *= 1.5;
    }

    return multiplier;
  }

  /**
   * Get human-readable workflow name
   * @param {string} workflowType - Workflow type
   * @returns {string} Display name
   */
  getWorkflowDisplayName(workflowType) {
    const displayNames = {
      'competitor-monitor': 'Competitor Price Monitor',
      'social-tracker': 'Social Media Tracker',
      'document-processor': 'Document Processor',
      'email-automation': 'Email Automation',
      'news-aggregator': 'News Aggregator',
      'lead-generator': 'Lead Generator',
      'seo-monitor': 'SEO Monitor',
      'calendar-assistant': 'Calendar Assistant',
      'data-reporter': 'Data Reporter',
      'web-scraper': 'Web Scraper',
      'telegram-test': 'Test Workflow'
    };

    return displayNames[workflowType] || workflowType;
  }

  /**
   * Get available workflows for a user tier
   * @param {string} tier - User tier (free, pro, enterprise)
   * @returns {Array} Available workflows
   */
  getAvailableWorkflows(tier = 'free') {
    const workflowsByTier = {
      free: [
        'news-aggregator',
        'telegram-test',
        'web-scraper'
      ],
      pro: [
        'competitor-monitor',
        'social-tracker',
        'document-processor',
        'email-automation',
        'news-aggregator',
        'seo-monitor',
        'telegram-test',
        'web-scraper'
      ],
      enterprise: Object.keys(WORKFLOW_CREDITS) // All workflows
    };

    return workflowsByTier[tier] || workflowsByTier.free;
  }

  /**
   * Get workflow information
   * @param {string} workflowType - Workflow type
   * @returns {Object} Workflow info
   */
  getWorkflowInfo(workflowType) {
    const descriptions = {
      'competitor-monitor': 'Track competitor prices and get alerts when they change',
      'social-tracker': 'Monitor brand mentions across social media platforms',
      'document-processor': 'Extract and analyze data from PDFs, images, and documents',
      'email-automation': 'Smart email filtering, responses, and organization',
      'news-aggregator': 'Curated news updates based on your interests',
      'lead-generator': 'Find and qualify potential customers from various sources',
      'seo-monitor': 'Track keyword rankings and SEO performance',
      'calendar-assistant': 'Smart meeting scheduling and calendar management',
      'data-reporter': 'Generate automated reports from your data sources',
      'web-scraper': 'Extract structured data from websites',
      'telegram-test': 'Test workflow for development'
    };

    return {
      type: workflowType,
      name: this.getWorkflowDisplayName(workflowType),
      description: descriptions[workflowType] || 'Workflow description not available',
      creditCost: WORKFLOW_CREDITS[workflowType] || 5,
      estimatedTime: '30-120 seconds'
    };
  }

  /**
   * Test n8n connection
   * @returns {Object} Connection status
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.n8nBaseUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey
        },
        timeout: 10000
      });

      return {
        connected: true,
        workflowCount: response.data?.data?.length || 0,
        message: 'Connected to n8n successfully'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        message: 'Failed to connect to n8n'
      };
    }
  }
}

module.exports = new WorkflowService();