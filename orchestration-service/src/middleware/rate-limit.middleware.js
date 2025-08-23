const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Create rate limiter based on user tier
 */
const createTierBasedLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Default limits for unauthenticated requests
      if (!req.user) return 20;

      // Tier-based limits
      const limits = {
        free: 100,      // 100 requests per 15 minutes
        pro: 500,       // 500 requests per 15 minutes  
        enterprise: 2000 // 2000 requests per 15 minutes
      };

      return limits[req.user.tier] || limits.free;
    },
    message: (req) => {
      const userTier = req.user?.tier || 'unauthenticated';
      return {
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit for ${userTier} tier exceeded.`,
        tier: userTier,
        retryAfter: Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000)
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        userId: req.user?.id,
        tier: req.user?.tier,
        ip: req.ip,
        path: req.path,
        userAgent: req.headers['user-agent']
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${Math.ceil(req.rateLimit.resetTime / 1000)} seconds.`,
        tier: req.user?.tier || 'unauthenticated',
        limit: req.rateLimit.limit,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(req.rateLimit.resetTime).toISOString()
      });
    }
  });
};

/**
 * Workflow execution rate limiter
 * Prevents abuse of expensive workflow operations
 */
const workflowRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: (req) => {
    if (!req.user) return 2;

    const limits = {
      free: 10,      // 10 workflow executions per 5 minutes
      pro: 50,       // 50 workflow executions per 5 minutes
      enterprise: 200 // 200 workflow executions per 5 minutes
    };

    return limits[req.user.tier] || limits.free;
  },
  keyGenerator: (req) => `workflow:${req.user?.id || req.ip}`,
  message: {
    error: 'Workflow rate limit exceeded',
    message: 'Too many workflow executions. Please wait before running more automations.',
    type: 'workflow_rate_limit'
  },
  handler: (req, res) => {
    logger.warn('Workflow rate limit exceeded', {
      userId: req.user?.id,
      tier: req.user?.tier,
      telegramId: req.body?.telegramId,
      workflowType: req.body?.workflowType,
      ip: req.ip
    });

    res.status(429).json({
      error: 'Workflow rate limit exceeded',
      message: 'You\'ve reached the limit for workflow executions. Please upgrade your plan or wait before trying again.',
      tier: req.user?.tier || 'free',
      upgradeUrl: process.env.UPGRADE_URL
    });
  }
});

/**
 * Telegram-specific rate limiter
 * Prevents spam from individual Telegram users
 */
const telegramRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute per Telegram user
  keyGenerator: (req) => `telegram:${req.body?.telegramId || req.ip}`,
  message: {
    error: 'Too many messages',
    message: 'Please slow down. You\'re sending messages too quickly.',
    type: 'telegram_rate_limit'
  },
  handler: (req, res) => {
    logger.warn('Telegram rate limit exceeded', {
      telegramId: req.body?.telegramId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(429).json({
      error: 'Too many messages',
      message: 'Please slow down and try again in a minute.'
    });
  }
});

/**
 * Payment/signup rate limiter
 * Prevents abuse of payment and registration endpoints
 */
const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour per IP
  keyGenerator: (req) => `payment:${req.ip}`,
  message: {
    error: 'Payment rate limit exceeded',
    message: 'Too many payment attempts. Please try again later.',
    type: 'payment_rate_limit'
  },
  handler: (req, res) => {
    logger.warn('Payment rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });

    res.status(429).json({
      error: 'Payment rate limit exceeded',
      message: 'Too many payment attempts from this location. Please try again in an hour.'
    });
  }
});

/**
 * API key rate limiter
 * For external API access
 */
const apiKeyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (!req.user) return 50;

    const limits = {
      free: 200,
      pro: 1000,
      enterprise: 5000
    };

    return limits[req.user.tier] || limits.free;
  },
  keyGenerator: (req) => `apikey:${req.user?.id || req.ip}`,
  message: {
    error: 'API rate limit exceeded',
    message: 'API rate limit exceeded for your tier.',
    type: 'api_rate_limit'
  }
});

/**
 * Global rate limiter for all endpoints
 * Prevents basic DDoS attempts
 */
const globalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: 'Global rate limit exceeded',
    message: 'Too many requests from this IP address.',
    type: 'global_rate_limit'
  },
  handler: (req, res) => {
    logger.error('Global rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });

    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }
});

/**
 * Create custom rate limiter
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limiter middleware
 */
const createCustomRateLimit = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded'
  };

  return rateLimit({ ...defaults, ...options });
};

module.exports = {
  createTierBasedLimiter,
  workflowRateLimit,
  telegramRateLimit,
  paymentRateLimit,
  apiKeyRateLimit,
  globalRateLimit,
  createCustomRateLimit
};