const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger');

class JWTUtil {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
    this.issuer = 'telegram-orchestrator';
    
    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables. Using fallback secret.');
    }
  }

  /**
   * Generate JWT token for n8n workflow execution
   * @param {Object} user - User object from database
   * @param {number} expiryMinutes - Token expiry in minutes (default: 5)
   * @returns {string} JWT token
   */
  generateWorkflowToken(user, expiryMinutes = 5) {
    const payload = {
      userId: user.id,
      telegramId: user.telegram_id,
      tier: user.tier,
      credits: user.credits_remaining,
      type: 'workflow_execution'
    };

    const options = {
      issuer: this.issuer,
      expiresIn: `${expiryMinutes}m`,
      jwtid: crypto.randomUUID()
    };

    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Generate activation token for user onboarding
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateActivationToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'account_activation'
    };

    const options = {
      issuer: this.issuer,
      expiresIn: '24h',
      jwtid: crypto.randomUUID()
    };

    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Generate API access token for authenticated requests
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateApiToken(user) {
    const payload = {
      userId: user.id,
      telegramId: user.telegram_id,
      tier: user.tier,
      type: 'api_access'
    };

    const options = {
      issuer: this.issuer,
      expiresIn: '1h',
      jwtid: crypto.randomUUID()
    };

    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active yet');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Generate secure random activation code
   * @param {number} length - Length of code (default: 32)
   * @returns {string} Random hex string
   */
  generateActivationCode(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate Telegram deep link token
   * @returns {string} Short token for deep links
   */
  generateDeepLinkToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash sensitive data
   * @param {string} data - Data to hash
   * @returns {string} SHA256 hash
   */
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify token without throwing errors
   * @param {string} token - Token to verify
   * @returns {Object|null} Decoded payload or null if invalid
   */
  safeVerifyToken(token) {
    try {
      return this.verifyToken(token);
    } catch (error) {
      logger.warn('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Check if token is expired (without verifying signature)
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Get token payload without verification (unsafe - for debugging)
   * @param {string} token - JWT token
   * @returns {Object|null} Token payload
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }
}

module.exports = new JWTUtil();