const jwtUtil = require('../utils/jwt.util');
const supabaseService = require('../services/supabase.service');
const logger = require('../utils/logger');

/**
 * Authentication middleware for API endpoints
 * Validates JWT tokens and loads user context
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.headers['x-auth-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwtUtil.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    // Load user from database if not a service token
    if (decoded.type !== 'service') {
      const user = await supabaseService.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'Token valid but user does not exist'
        });
      }

      // Attach user to request
      req.user = user;
      req.tokenPayload = decoded;
    } else {
      // Service token - no user lookup needed
      req.tokenPayload = decoded;
    }

    // Add request tracking
    req.requestId = require('crypto').randomUUID();
    req.startTime = Date.now();

    logger.debug('Authentication successful', {
      userId: decoded.userId,
      tokenType: decoded.type,
      requestId: req.requestId
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path
    });

    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Optional authentication middleware
 * Loads user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.headers['x-auth-token'] || req.query.token;

    if (token) {
      const decoded = jwtUtil.safeVerifyToken(token);
      if (decoded && decoded.userId) {
        const user = await supabaseService.getUserById(decoded.userId);
        if (user) {
          req.user = user;
          req.tokenPayload = decoded;
        }
      }
    }

    req.requestId = require('crypto').randomUUID();
    req.startTime = Date.now();
    next();
  } catch (error) {
    // Continue without authentication
    req.requestId = require('crypto').randomUUID();
    req.startTime = Date.now();
    next();
  }
};

/**
 * Telegram-specific authentication middleware
 * Validates requests from Telegram users
 */
const telegramAuth = async (req, res, next) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({
        error: 'Telegram ID required',
        message: 'telegramId must be provided in request body'
      });
    }

    // Get user by Telegram ID
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);
    if (!telegramAccount?.user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'No active user found for this Telegram ID'
      });
    }

    // Attach user and telegram account to request
    req.user = telegramAccount.user;
    req.telegramAccount = telegramAccount;
    req.requestId = require('crypto').randomUUID();
    req.startTime = Date.now();

    logger.debug('Telegram authentication successful', {
      telegramId,
      userId: telegramAccount.user.id,
      requestId: req.requestId
    });

    next();
  } catch (error) {
    logger.warn('Telegram authentication failed', {
      error: error.message,
      telegramId: req.body.telegramId,
      ip: req.ip
    });

    return res.status(401).json({
      error: 'Telegram authentication failed',
      message: error.message
    });
  }
};

/**
 * Admin authentication middleware
 * Requires admin-level permissions
 */
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.tier !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    });
  }
  next();
};

/**
 * Tier-based authorization middleware
 * @param {string|Array} requiredTiers - Required user tier(s)
 */
const requireTier = (requiredTiers) => {
  const tiers = Array.isArray(requiredTiers) ? requiredTiers : [requiredTiers];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    if (!tiers.includes(req.user.tier)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This feature requires ${tiers.join(' or ')} tier`,
        userTier: req.user.tier,
        requiredTiers: tiers
      });
    }

    next();
  };
};

/**
 * API key authentication middleware
 * For external API access
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Provide API key in X-API-Key header or apiKey query parameter'
      });
    }

    // Look up user by API key
    const { data: user, error } = await supabaseService.client
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key not found or inactive'
      });
    }

    req.user = user;
    req.requestId = require('crypto').randomUUID();
    req.startTime = Date.now();

    logger.debug('API key authentication successful', {
      userId: user.id,
      requestId: req.requestId
    });

    next();
  } catch (error) {
    logger.error('API key authentication failed:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal error during authentication'
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  telegramAuth,
  adminAuth,
  requireTier,
  apiKeyAuth
};