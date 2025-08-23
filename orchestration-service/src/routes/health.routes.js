const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');
const workflowService = require('../services/workflow.service');
const logger = require('../utils/logger');

/**
 * Basic health check
 * GET /health
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {}
  };

  try {
    // Check Supabase connection
    try {
      await supabaseService.client.from('users').select('id').limit(1);
      healthCheck.services.supabase = {
        status: 'healthy',
        message: 'Connected successfully'
      };
    } catch (error) {
      healthCheck.services.supabase = {
        status: 'unhealthy',
        message: error.message
      };
      healthCheck.status = 'degraded';
    }

    // Check n8n connection
    try {
      const n8nStatus = await workflowService.testConnection();
      healthCheck.services.n8n = {
        status: n8nStatus.connected ? 'healthy' : 'unhealthy',
        message: n8nStatus.message,
        workflowCount: n8nStatus.workflowCount
      };
      
      if (!n8nStatus.connected) {
        healthCheck.status = 'degraded';
      }
    } catch (error) {
      healthCheck.services.n8n = {
        status: 'unhealthy',
        message: error.message
      };
      healthCheck.status = 'degraded';
    }

    // Check Telegram bot
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        await bot.telegram.getMe();
        
        healthCheck.services.telegram = {
          status: 'healthy',
          message: 'Bot is responding'
        };
      } catch (error) {
        healthCheck.services.telegram = {
          status: 'unhealthy',
          message: error.message
        };
        healthCheck.status = 'degraded';
      }
    } else {
      healthCheck.services.telegram = {
        status: 'not_configured',
        message: 'Telegram bot token not configured'
      };
    }

    // System resources
    healthCheck.system = {
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB'
      },
      cpu: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version
      }
    };

    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 207 : 503;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Detailed health check
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {},
    metrics: {},
    configuration: {}
  };

  try {
    // Database health with metrics
    try {
      const start = Date.now();
      const { data: userCount } = await supabaseService.client
        .from('users')
        .select('id', { count: 'exact', head: true });
      const responseTime = Date.now() - start;

      const { data: executionCount } = await supabaseService.client
        .from('workflow_usage')
        .select('id', { count: 'exact', head: true })
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      detailedHealth.services.supabase = {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        metrics: {
          totalUsers: userCount.count || 0,
          executionsLast24h: executionCount.count || 0
        }
      };

      detailedHealth.metrics.database = {
        queryResponseTime: responseTime,
        connectionStatus: 'active'
      };

    } catch (error) {
      detailedHealth.services.supabase = {
        status: 'unhealthy',
        error: error.message
      };
      detailedHealth.status = 'degraded';
    }

    // N8N health with workflow status
    try {
      const n8nStatus = await workflowService.testConnection();
      
      detailedHealth.services.n8n = {
        status: n8nStatus.connected ? 'healthy' : 'unhealthy',
        message: n8nStatus.message,
        workflowCount: n8nStatus.workflowCount || 0,
        baseUrl: process.env.N8N_BASE_URL
      };

    } catch (error) {
      detailedHealth.services.n8n = {
        status: 'unhealthy',
        error: error.message
      };
      detailedHealth.status = 'degraded';
    }

    // Telegram bot detailed status
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        const botInfo = await bot.telegram.getMe();
        
        detailedHealth.services.telegram = {
          status: 'healthy',
          botInfo: {
            username: botInfo.username,
            firstName: botInfo.first_name,
            canJoinGroups: botInfo.can_join_groups,
            canReadAllGroupMessages: botInfo.can_read_all_group_messages
          },
          webhookUrl: process.env.WEBHOOK_URL ? `${process.env.WEBHOOK_URL}/telegram-webhook` : null
        };
      } catch (error) {
        detailedHealth.services.telegram = {
          status: 'unhealthy',
          error: error.message
        };
        detailedHealth.status = 'degraded';
      }
    }

    // Payment system health
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.accounts.retrieve();
        
        detailedHealth.services.stripe = {
          status: 'healthy',
          message: 'Stripe API accessible'
        };
      } catch (error) {
        detailedHealth.services.stripe = {
          status: 'unhealthy',
          error: error.message
        };
        detailedHealth.status = 'degraded';
      }
    }

    // System metrics
    const memUsage = process.memoryUsage();
    detailedHealth.metrics.system = {
      memory: {
        heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
        external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
        unit: 'MB'
      },
      uptime: {
        process: Math.round(process.uptime()),
        system: require('os').uptime(),
        unit: 'seconds'
      },
      cpu: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        cpuCount: require('os').cpus().length
      }
    };

    // Configuration status
    detailedHealth.configuration = {
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      port: process.env.PORT || 3000,
      services: {
        n8n: !!process.env.N8N_BASE_URL && !!process.env.N8N_API_KEY,
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        jwt: !!process.env.JWT_SECRET
      }
    };

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 
                      detailedHealth.status === 'degraded' ? 207 : 503;

    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    logger.error('Detailed health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Readiness probe
 * GET /health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check essential services
    const checks = [
      // Database connection
      supabaseService.client.from('users').select('id').limit(1),
      
      // N8N connection (if configured)
      process.env.N8N_BASE_URL ? workflowService.testConnection() : Promise.resolve({ connected: true })
    ];

    await Promise.all(checks);

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Readiness check failed', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness probe
 * GET /health/live
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;