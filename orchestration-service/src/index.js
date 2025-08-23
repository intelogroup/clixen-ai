const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const logger = require('./utils/logger');
const authMiddleware = require('./middleware/auth.middleware');
const loggingMiddleware = require('./middleware/logging.middleware');

// Import route handlers
const telegramRoutes = require('./routes/telegram.routes');
const workflowRoutes = require('./routes/workflow.routes');
const paymentRoutes = require('./routes/payment.routes');
const healthRoutes = require('./routes/health.routes');

class OrchestrationService {
  constructor() {
    this.app = express();
    this.bot = null;
    this.port = process.env.PORT || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupTelegramBot();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(loggingMiddleware);

    logger.info('Middleware setup completed');
  }

  setupRoutes() {
    // Health check
    this.app.use('/health', healthRoutes);
    
    // API routes
    this.app.use('/api/telegram', telegramRoutes);
    this.app.use('/api/workflow', authMiddleware, workflowRoutes);
    this.app.use('/api/payment', paymentRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Telegram N8N Orchestration Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          telegram: '/api/telegram',
          workflow: '/api/workflow',
          payment: '/api/payment'
        }
      });
    });

    logger.info('Routes setup completed');
  }

  setupTelegramBot() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logger.warn('TELEGRAM_BOT_TOKEN not configured. Bot will not start.');
      return;
    }

    try {
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      
      // Set up bot webhook endpoint
      this.app.use(this.bot.webhookCallback('/telegram-webhook'));
      
      // Import bot handlers
      require('./telegram-bot/bot')(this.bot);
      
      logger.info('Telegram bot setup completed');
    } catch (error) {
      logger.error('Failed to setup Telegram bot:', error);
    }
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message,
        requestId: req.id
      });
    });

    logger.info('Error handling setup completed');
  }

  async start() {
    try {
      // Set telegram webhook if bot is configured
      if (this.bot && process.env.WEBHOOK_URL) {
        await this.bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/telegram-webhook`);
        logger.info(`Telegram webhook set to: ${process.env.WEBHOOK_URL}/telegram-webhook`);
      }

      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 Orchestration service running on port ${this.port}`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`🤖 Telegram webhook: http://localhost:${this.port}/telegram-webhook`);
        logger.info(`🔗 API base: http://localhost:${this.port}/api`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start service:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('🛑 Shutting down orchestration service...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('✅ HTTP server closed');
      });
    }

    if (this.bot) {
      await this.bot.stop();
      logger.info('✅ Telegram bot stopped');
    }

    process.exit(0);
  }
}

// Start the service
if (require.main === module) {
  const service = new OrchestrationService();
  service.start().catch(console.error);
}

module.exports = OrchestrationService;