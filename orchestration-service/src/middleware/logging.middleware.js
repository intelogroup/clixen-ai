const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Request logging middleware
 * Logs all incoming requests and responses
 */
const loggingMiddleware = (req, res, next) => {
  // Generate unique request ID if not already set
  req.id = req.id || crypto.randomUUID();
  req.startTime = req.startTime || Date.now();

  // Extract client information
  const clientInfo = {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    origin: req.headers.origin
  };

  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    ...clientInfo,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'authorization': req.headers.authorization ? 'Bearer ***' : undefined,
      'x-api-key': req.headers['x-api-key'] ? '***' : undefined
    }
  });

  // Log request body for non-GET requests (but sanitize sensitive data)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = sanitizeRequestBody(req.body);
    logger.debug('Request body', {
      requestId: req.id,
      body: sanitizedBody
    });
  }

  // Hook into response to log completion
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || (data ? data.length : 0),
      userId: req.user?.id,
      telegramId: req.telegramAccount?.telegram_id
    });

    // Log response body for errors or debug mode
    if (res.statusCode >= 400 || process.env.LOG_LEVEL === 'debug') {
      const sanitizedResponse = sanitizeResponseBody(data, res.statusCode);
      logger.debug('Response body', {
        requestId: req.id,
        statusCode: res.statusCode,
        body: sanitizedResponse
      });
    }

    // Performance warning for slow requests
    if (responseTime > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode
      });
    }

    // Call original send
    originalSend.call(this, data);
  };

  // Hook into response for errors
  const originalStatus = res.status;
  res.status = function(code) {
    res.statusCode = code;
    return originalStatus.call(this, code);
  };

  next();
};

/**
 * Error logging middleware
 * Should be placed after all routes
 */
const errorLoggingMiddleware = (err, req, res, next) => {
  const responseTime = Date.now() - (req.startTime || Date.now());
  
  logger.error('Request error', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    },
    responseTime: `${responseTime}ms`,
    userId: req.user?.id,
    telegramId: req.telegramAccount?.telegram_id,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  next(err);
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    'password', 'token', 'apiKey', 'api_key', 'secret', 'key',
    'authorization', 'auth', 'credentials', 'creditCard', 'ssn'
  ];

  // Recursively sanitize nested objects
  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    }

    if (obj && typeof obj === 'object') {
      const sanitizedObj = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          sanitizedObj[key] = '***';
        } else if (typeof value === 'object') {
          sanitizedObj[key] = sanitizeObject(value);
        } else {
          sanitizedObj[key] = value;
        }
      }
      return sanitizedObj;
    }

    return obj;
  };

  return sanitizeObject(sanitized);
}

/**
 * Sanitize response body for logging
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {any} Sanitized response
 */
function sanitizeResponseBody(data, statusCode) {
  // Don't log large successful responses
  if (statusCode < 400 && data && data.length > 1000) {
    return `[Response too large: ${data.length} characters]`;
  }

  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return sanitizeRequestBody(parsed);
  } catch {
    // If not JSON, return as-is but truncate if too long
    return typeof data === 'string' && data.length > 500
      ? data.substring(0, 500) + '...'
      : data;
  }
}

/**
 * API metrics middleware
 * Collects metrics for monitoring
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log metrics (can be sent to monitoring service)
    logger.debug('API metrics', {
      method: req.method,
      path: req.route?.path || req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      tier: req.user?.tier,
      timestamp: new Date().toISOString()
    });

    // Track API usage by user
    if (req.user?.id) {
      // This could be sent to a metrics collection service
      // or stored in database for billing/analytics
    }
  });

  next();
};

module.exports = {
  loggingMiddleware,
  errorLoggingMiddleware,
  metricsMiddleware
};