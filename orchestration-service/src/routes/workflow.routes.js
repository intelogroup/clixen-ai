const express = require('express');
const router = express.Router();
const workflowService = require('../services/workflow.service');
const supabaseService = require('../services/supabase.service');
const { telegramAuth, requireTier } = require('../middleware/auth.middleware');
const { workflowRateLimit } = require('../middleware/rate-limit.middleware');
const logger = require('../utils/logger');

/**
 * Execute workflow for Telegram user
 * POST /api/workflow/execute
 */
router.post('/execute', 
  workflowRateLimit, 
  telegramAuth,
  async (req, res) => {
    try {
      const { telegramId, workflowType, input = {} } = req.body;

      if (!workflowType) {
        return res.status(400).json({
          error: 'Workflow type required',
          message: 'workflowType must be specified'
        });
      }

      // Check if user has access to this workflow type
      const availableWorkflows = workflowService.getAvailableWorkflows(req.user.tier);
      if (!availableWorkflows.includes(workflowType)) {
        return res.status(403).json({
          error: 'Workflow not available',
          message: `The ${workflowType} workflow is not available for your ${req.user.tier} tier`,
          availableWorkflows,
          upgradeUrl: process.env.UPGRADE_URL
        });
      }

      const result = await workflowService.executeWorkflow(
        telegramId,
        workflowType,
        input
      );

      logger.info('Workflow executed successfully', {
        telegramId,
        workflowType,
        executionId: result.executionId,
        creditsConsumed: result.creditsConsumed
      });

      res.json({
        success: true,
        ...result,
        message: 'Workflow executed successfully'
      });

    } catch (error) {
      logger.error('Workflow execution failed', {
        error: error.message,
        telegramId: req.body.telegramId,
        workflowType: req.body.workflowType
      });

      const statusCode = error.message.includes('Insufficient credits') ? 402 :
                        error.message.includes('not found') ? 404 :
                        error.message.includes('timed out') ? 408 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message,
        workflowType: req.body.workflowType
      });
    }
  }
);

/**
 * Get available workflows for user
 * GET /api/workflow/available
 */
router.get('/available', telegramAuth, async (req, res) => {
  try {
    const availableWorkflows = workflowService.getAvailableWorkflows(req.user.tier);
    
    const workflowDetails = availableWorkflows.map(workflowType => 
      workflowService.getWorkflowInfo(workflowType)
    );

    res.json({
      success: true,
      tier: req.user.tier,
      workflows: workflowDetails,
      total: workflowDetails.length
    });

  } catch (error) {
    logger.error('Failed to get available workflows', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available workflows'
    });
  }
});

/**
 * Get workflow information
 * GET /api/workflow/info/:workflowType
 */
router.get('/info/:workflowType', async (req, res) => {
  try {
    const { workflowType } = req.params;
    const workflowInfo = workflowService.getWorkflowInfo(workflowType);

    if (!workflowInfo.type) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        workflowType
      });
    }

    res.json({
      success: true,
      workflow: workflowInfo
    });

  } catch (error) {
    logger.error('Failed to get workflow info', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow information'
    });
  }
});

/**
 * Get user's workflow execution history
 * GET /api/workflow/history
 */
router.get('/history', telegramAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, workflowType } = req.query;

    let query = supabaseService.client
      .from('workflow_usage')
      .select('*')
      .eq('user_id', req.user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (workflowType) {
      query = query.eq('workflow_type', workflowType);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      executions: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: data.length
      }
    });

  } catch (error) {
    logger.error('Failed to get workflow history', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow history'
    });
  }
});

/**
 * Get workflow execution details
 * GET /api/workflow/execution/:executionId
 */
router.get('/execution/:executionId', telegramAuth, async (req, res) => {
  try {
    const { executionId } = req.params;

    const { data, error } = await supabaseService.client
      .from('workflow_usage')
      .select('*')
      .eq('execution_id', executionId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      execution: data
    });

  } catch (error) {
    logger.error('Failed to get execution details', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve execution details'
    });
  }
});

/**
 * Cancel workflow execution (if possible)
 * POST /api/workflow/cancel/:executionId
 */
router.post('/cancel/:executionId', telegramAuth, async (req, res) => {
  try {
    const { executionId } = req.params;

    // Check if execution exists and belongs to user
    const { data: execution, error } = await supabaseService.client
      .from('workflow_usage')
      .select('*')
      .eq('execution_id', executionId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed execution',
        status: execution.status
      });
    }

    // Update status to cancelled
    await supabaseService.logWorkflowCompletion(executionId, {
      status: 'cancelled',
      error: 'Cancelled by user'
    });

    // Refund credits if execution was cancelled
    if (execution.credits_consumed > 0) {
      // Note: You might want to implement a refund mechanism
      logger.info('Credits should be refunded for cancelled execution', {
        executionId,
        creditsToRefund: execution.credits_consumed
      });
    }

    res.json({
      success: true,
      message: 'Execution cancelled successfully',
      executionId
    });

  } catch (error) {
    logger.error('Failed to cancel execution', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel execution'
    });
  }
});

/**
 * Get user's credit balance and usage
 * GET /api/workflow/credits
 */
router.get('/credits', telegramAuth, async (req, res) => {
  try {
    const credits = await supabaseService.getUserCredits(req.user.id);
    
    if (!credits) {
      return res.status(404).json({
        success: false,
        error: 'Credit information not found'
      });
    }

    const remaining = credits.total_credits + credits.bonus_credits - credits.used_credits;

    res.json({
      success: true,
      credits: {
        total: credits.total_credits,
        used: credits.used_credits,
        bonus: credits.bonus_credits,
        remaining: Math.max(0, remaining),
        tier: credits.tier,
        resetDate: credits.reset_date
      }
    });

  } catch (error) {
    logger.error('Failed to get user credits', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve credit information'
    });
  }
});

/**
 * Get workflow usage statistics
 * GET /api/workflow/stats
 */
router.get('/stats', telegramAuth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let startDate = new Date();
    if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const { data, error } = await supabaseService.client
      .from('workflow_usage')
      .select('workflow_type, status, credits_consumed, started_at')
      .eq('user_id', req.user.id)
      .gte('started_at', startDate.toISOString());

    if (error) throw error;

    // Calculate statistics
    const stats = {
      totalExecutions: data.length,
      successfulExecutions: data.filter(e => e.status === 'completed').length,
      failedExecutions: data.filter(e => e.status === 'failed').length,
      totalCreditsConsumed: data.reduce((sum, e) => sum + (e.credits_consumed || 0), 0),
      workflowBreakdown: {},
      dailyUsage: {}
    };

    // Group by workflow type
    data.forEach(execution => {
      if (!stats.workflowBreakdown[execution.workflow_type]) {
        stats.workflowBreakdown[execution.workflow_type] = 0;
      }
      stats.workflowBreakdown[execution.workflow_type]++;

      // Group by day
      const day = execution.started_at.split('T')[0];
      if (!stats.dailyUsage[day]) {
        stats.dailyUsage[day] = 0;
      }
      stats.dailyUsage[day]++;
    });

    res.json({
      success: true,
      timeframe,
      stats
    });

  } catch (error) {
    logger.error('Failed to get workflow stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow statistics'
    });
  }
});

/**
 * Test n8n connection (admin only)
 * GET /api/workflow/test-connection
 */
router.get('/test-connection', requireTier(['admin']), async (req, res) => {
  try {
    const connectionStatus = await workflowService.testConnection();
    res.json({
      success: true,
      ...connectionStatus
    });
  } catch (error) {
    logger.error('Connection test failed', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed'
    });
  }
});

module.exports = router;