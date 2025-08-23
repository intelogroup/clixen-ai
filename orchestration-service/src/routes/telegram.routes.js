const express = require('express');
const router = express.Router();
const jwtUtil = require('../utils/jwt.util');
const supabaseService = require('../services/supabase.service');
const workflowService = require('../services/workflow.service');
const { telegramRateLimit } = require('../middleware/rate-limit.middleware');
const logger = require('../utils/logger');

/**
 * Activate Telegram account with token (from web signup)
 * POST /api/telegram/activate
 */
router.post('/activate', telegramRateLimit, async (req, res) => {
  try {
    const { token, telegramData } = req.body;

    if (!token || !telegramData) {
      return res.status(400).json({
        success: false,
        error: 'Token and telegram data required',
        message: 'Both activation token and Telegram user data must be provided'
      });
    }

    const activatedUser = await supabaseService.activateUserByToken(token, telegramData);

    if (!activatedUser) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Activation token is invalid or has expired'
      });
    }

    logger.info('Telegram account activated', {
      userId: activatedUser.user.id,
      telegramId: telegramData.id,
      telegramUsername: telegramData.username
    });

    res.json({
      success: true,
      message: 'Account activated successfully',
      user: {
        id: activatedUser.user.id,
        email: activatedUser.user.email,
        tier: activatedUser.user.tier,
        telegramId: activatedUser.telegram_id,
        telegramUsername: activatedUser.telegram_username
      }
    });

  } catch (error) {
    logger.error('Telegram activation failed', error);
    res.status(500).json({
      success: false,
      error: 'Activation failed',
      message: error.message
    });
  }
});

/**
 * Generate payment link for Telegram user (Telegram-first flow)
 * POST /api/telegram/payment-link
 */
router.post('/payment-link', telegramRateLimit, async (req, res) => {
  try {
    const { telegramId, telegramData, tier = 'pro' } = req.body;

    if (!telegramId || !telegramData) {
      return res.status(400).json({
        success: false,
        error: 'Telegram data required'
      });
    }

    // Generate payment session
    const sessionToken = jwtUtil.generateDeepLinkToken();
    
    // Store payment session
    const { error } = await supabaseService.adminClient
      .from('payment_sessions')
      .insert({
        telegram_id: telegramId,
        session_token: sessionToken,
        tier: tier,
        status: 'pending',
        amount: tier === 'pro' ? 19 : 99, // Pro: $19, Enterprise: $99
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (error) throw error;

    // Generate payment URL
    const paymentUrl = `${process.env.FRONTEND_URL}/payment?session=${sessionToken}&tier=${tier}`;

    logger.info('Payment link generated for Telegram user', {
      telegramId,
      tier,
      sessionToken
    });

    res.json({
      success: true,
      paymentUrl,
      tier,
      amount: tier === 'pro' ? 19 : 99,
      expiresIn: '24 hours'
    });

  } catch (error) {
    logger.error('Failed to generate payment link', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate payment link'
    });
  }
});

/**
 * Check activation status for Telegram user
 * GET /api/telegram/status/:telegramId
 */
router.get('/status/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);

    if (!telegramAccount) {
      return res.json({
        success: true,
        activated: false,
        message: 'User not found or not activated'
      });
    }

    const credits = await supabaseService.getUserCredits(telegramAccount.user.id);
    const remaining = credits ? 
      Math.max(0, credits.total_credits + credits.bonus_credits - credits.used_credits) : 0;

    res.json({
      success: true,
      activated: true,
      user: {
        id: telegramAccount.user.id,
        email: telegramAccount.user.email,
        tier: telegramAccount.user.tier,
        credits: {
          remaining,
          total: credits?.total_credits || 0
        }
      },
      telegramAccount: {
        telegramId: telegramAccount.telegram_id,
        username: telegramAccount.telegram_username,
        activatedAt: telegramAccount.activated_at,
        lastActive: telegramAccount.last_active
      }
    });

  } catch (error) {
    logger.error('Failed to get status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve status'
    });
  }
});

/**
 * Update user conversation state
 * POST /api/telegram/conversation-state
 */
router.post('/conversation-state', telegramRateLimit, async (req, res) => {
  try {
    const { telegramId, state } = req.body;

    if (!telegramId || !state) {
      return res.status(400).json({
        success: false,
        error: 'Telegram ID and state required'
      });
    }

    const success = await supabaseService.storeConversationState(telegramId, state);

    if (success) {
      res.json({
        success: true,
        message: 'Conversation state updated'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update conversation state'
      });
    }

  } catch (error) {
    logger.error('Failed to update conversation state', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation state'
    });
  }
});

/**
 * Get user conversation state
 * GET /api/telegram/conversation-state/:telegramId
 */
router.get('/conversation-state/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const state = await supabaseService.getConversationState(telegramId);

    res.json({
      success: true,
      state: state || {}
    });

  } catch (error) {
    logger.error('Failed to get conversation state', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation state'
    });
  }
});

/**
 * Natural language workflow execution
 * POST /api/telegram/execute-nlp
 */
router.post('/execute-nlp', telegramRateLimit, async (req, res) => {
  try {
    const { telegramId, message } = req.body;

    if (!telegramId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Telegram ID and message required'
      });
    }

    // Get user
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);
    if (!telegramAccount?.user) {
      return res.status(401).json({
        success: false,
        error: 'User not activated',
        message: 'Please complete account activation first'
      });
    }

    // Parse natural language intent
    const { workflowType, parameters } = parseNaturalLanguage(message);

    if (!workflowType) {
      return res.json({
        success: false,
        error: 'Intent not recognized',
        message: 'I didn\'t understand that request. Try asking about:\n• Monitoring competitor prices\n• Tracking social media mentions\n• Processing documents\n• Getting news updates',
        suggestions: [
          'Monitor competitor prices for iPhone',
          'Track mentions of my brand on Twitter',
          'Process this PDF document',
          'Get latest AI news'
        ]
      });
    }

    // Check if workflow is available for user tier
    const availableWorkflows = workflowService.getAvailableWorkflows(telegramAccount.user.tier);
    if (!availableWorkflows.includes(workflowType)) {
      return res.status(403).json({
        success: false,
        error: 'Workflow not available',
        message: `The ${workflowType} feature requires a higher tier plan.`,
        workflowType,
        userTier: telegramAccount.user.tier,
        upgradeUrl: process.env.UPGRADE_URL
      });
    }

    // Execute workflow
    const result = await workflowService.executeWorkflow(
      telegramId,
      workflowType,
      { message, ...parameters }
    );

    logger.info('NLP workflow executed', {
      telegramId,
      message: message.substring(0, 100),
      workflowType,
      executionId: result.executionId
    });

    res.json({
      success: true,
      workflowType,
      ...result,
      naturalLanguageProcessed: true
    });

  } catch (error) {
    logger.error('NLP workflow execution failed', error);
    
    const statusCode = error.message.includes('Insufficient credits') ? 402 :
                      error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Parse natural language message to extract workflow intent
 * @param {string} message - User message
 * @returns {Object} Parsed intent and parameters
 */
function parseNaturalLanguage(message) {
  const lowerMessage = message.toLowerCase();

  // Intent patterns
  const intentMappings = {
    'competitor-monitor': [
      'monitor price', 'track price', 'competitor price', 'price watch', 'price alert'
    ],
    'social-tracker': [
      'social media', 'track mention', 'brand mention', 'twitter mention', 'social monitoring'
    ],
    'document-processor': [
      'process document', 'analyze pdf', 'extract text', 'read document', 'document analysis'
    ],
    'email-automation': [
      'automate email', 'email filter', 'manage email', 'email automation', 'smart email'
    ],
    'news-aggregator': [
      'news update', 'latest news', 'news summary', 'get news', 'news briefing'
    ],
    'lead-generator': [
      'find leads', 'lead generation', 'find customers', 'prospect search', 'lead finder'
    ],
    'seo-monitor': [
      'seo report', 'keyword ranking', 'search ranking', 'seo monitor', 'website ranking'
    ],
    'calendar-assistant': [
      'schedule meeting', 'calendar', 'book appointment', 'meeting scheduler', 'time management'
    ],
    'data-reporter': [
      'generate report', 'data report', 'create report', 'analytics report', 'report generation'
    ],
    'web-scraper': [
      'scrape website', 'extract data', 'website data', 'web scraping', 'crawl website'
    ]
  };

  // Find matching workflow
  for (const [workflowType, patterns] of Object.entries(intentMappings)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return {
        workflowType,
        parameters: extractParameters(lowerMessage, workflowType)
      };
    }
  }

  return { workflowType: null, parameters: {} };
}

/**
 * Extract parameters from natural language message
 * @param {string} message - Lowercase message
 * @param {string} workflowType - Detected workflow type
 * @returns {Object} Extracted parameters
 */
function extractParameters(message, workflowType) {
  const parameters = {};

  // Extract common parameters
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    parameters.url = urlMatch[1];
  }

  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    parameters.email = emailMatch[1];
  }

  // Workflow-specific parameter extraction
  switch (workflowType) {
    case 'competitor-monitor':
      // Extract product names, company names
      const productPatterns = [
        /iphone\s*\d*/gi, /samsung\s*galaxy/gi, /macbook/gi, /ipad/gi
      ];
      productPatterns.forEach(pattern => {
        const match = message.match(pattern);
        if (match) parameters.product = match[0];
      });
      break;

    case 'social-tracker':
      // Extract brand names, hashtags
      const hashtagMatch = message.match(/#(\w+)/g);
      if (hashtagMatch) {
        parameters.hashtags = hashtagMatch;
      }
      break;

    case 'news-aggregator':
      // Extract topics, sources
      const newsTopics = ['ai', 'tech', 'crypto', 'startup', 'business'];
      newsTopics.forEach(topic => {
        if (message.includes(topic)) {
          parameters.topics = parameters.topics || [];
          parameters.topics.push(topic);
        }
      });
      break;
  }

  return parameters;
}

module.exports = router;