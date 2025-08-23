const { Telegraf, Scenes, session } = require('telegraf');
const workflowService = require('../src/services/workflow.service');
const supabaseService = require('../src/services/supabase.service');
const logger = require('../src/utils/logger');

/**
 * Main Telegram Bot Setup
 * Handles all bot interactions, commands, and workflow execution
 */
module.exports = (bot) => {
  
  // Middleware for session management
  bot.use(session());

  // Middleware for user authentication and activity tracking
  bot.use(async (ctx, next) => {
    const telegramId = ctx.from?.id;
    if (telegramId) {
      // Update last activity
      await supabaseService.updateLastActivity(telegramId);
      
      // Log interaction
      await logTelegramInteraction(ctx);
    }
    return next();
  });

  // Error handling
  bot.catch((err, ctx) => {
    logger.error('Telegram bot error', {
      error: err.message,
      telegramId: ctx.from?.id,
      chatId: ctx.chat?.id,
      update: ctx.update
    });

    ctx.reply('Sorry, something went wrong. Please try again or contact support.');
  });

  // ======================
  // COMMAND HANDLERS
  // ======================

  /**
   * Start command - Handle activation tokens and welcome users
   */
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id;
    const telegramData = {
      id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name
    };

    // Check for activation token
    const startPayload = ctx.message.text.split(' ')[1];

    if (startPayload) {
      // User coming from activation link
      try {
        const activatedUser = await supabaseService.activateUserByToken(startPayload, telegramData);
        
        if (activatedUser) {
          await ctx.reply(
            `🎉 *Welcome to your automation assistant!*\n\n` +
            `Your account has been activated successfully.\n` +
            `Plan: *${activatedUser.user.tier.toUpperCase()}*\n\n` +
            `*What can I help you with?*\n` +
            `• "Monitor competitor prices for iPhone"\n` +
            `• "Track social media mentions of my brand"\n` +
            `• "Process this document"\n` +
            `• "Get latest AI news"\n\n` +
            `Type /help for more commands or just tell me what you need!`,
            { parse_mode: 'Markdown' }
          );
          return;
        } else {
          await ctx.reply('Invalid or expired activation link. Please check your email or website for the correct link.');
          return;
        }
      } catch (error) {
        logger.error('Activation error', error);
        await ctx.reply('There was an error activating your account. Please try again or contact support.');
        return;
      }
    }

    // Check if user is already activated
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);
    
    if (telegramAccount?.user) {
      // Existing user
      const credits = await supabaseService.getUserCredits(telegramAccount.user.id);
      const remaining = credits ? 
        Math.max(0, credits.total_credits + credits.bonus_credits - credits.used_credits) : 0;

      await ctx.reply(
        `👋 Welcome back, ${ctx.from.first_name}!\n\n` +
        `*Account Status:* Active\n` +
        `*Plan:* ${telegramAccount.user.tier.toUpperCase()}\n` +
        `*Credits remaining:* ${remaining}\n\n` +
        `What would you like to automate today?\n\n` +
        `Type /workflows to see available automations or just tell me what you need!`,
        { parse_mode: 'Markdown' }
      );
    } else {
      // New user - need to sign up
      await ctx.reply(
        `👋 Hello ${ctx.from.first_name}!\n\n` +
        `I'm your personal automation assistant. I can help you:\n` +
        `• Monitor competitor prices\n` +
        `• Track social media mentions\n` +
        `• Process documents with AI\n` +
        `• Get curated news updates\n` +
        `• And much more!\n\n` +
        `To get started, please visit our website to create your account:\n` +
        `${process.env.FRONTEND_URL}\n\n` +
        `Once you sign up, you'll get a link to activate me!`
      );
    }
  });

  /**
   * Help command
   */
  bot.command('help', async (ctx) => {
    const helpText = `
🤖 *Automation Assistant Commands*

*Available Commands:*
/start - Get started or activate account
/workflows - See available automations
/status - Check your account status
/credits - View credit balance
/help - Show this help message

*Natural Language Examples:*
• "Monitor iPhone prices on Amazon"
• "Track mentions of my brand on Twitter" 
• "Process this PDF document"
• "Get latest tech news"
• "Find leads in the SaaS industry"
• "Generate a report from my data"

*How it works:*
1️⃣ Just tell me what you want to automate
2️⃣ I'll understand and run the right workflow
3️⃣ You'll get results in minutes

*Need more credits?*
Type /upgrade or visit ${process.env.FRONTEND_URL}

*Support:*
If you have issues, contact us at support@yourdomain.com
    `;

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  });

  /**
   * Status command - Show account status
   */
  bot.command('status', async (ctx) => {
    const telegramId = ctx.from.id;
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);

    if (!telegramAccount?.user) {
      await ctx.reply(
        'Your account is not activated yet. Please visit our website to sign up:\n' +
        `${process.env.FRONTEND_URL}`
      );
      return;
    }

    const credits = await supabaseService.getUserCredits(telegramAccount.user.id);
    const remaining = credits ? 
      Math.max(0, credits.total_credits + credits.bonus_credits - credits.used_credits) : 0;

    // Get recent usage
    const { data: recentUsage } = await supabaseService.client
      .from('workflow_usage')
      .select('*')
      .eq('user_id', telegramAccount.user.id)
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false });

    const totalExecutions = recentUsage?.length || 0;
    const successfulExecutions = recentUsage?.filter(e => e.status === 'completed').length || 0;

    await ctx.reply(
      `📊 *Account Status*\n\n` +
      `*Plan:* ${telegramAccount.user.tier.toUpperCase()}\n` +
      `*Email:* ${telegramAccount.user.email}\n` +
      `*Activated:* ${new Date(telegramAccount.activated_at).toLocaleDateString()}\n\n` +
      `💳 *Credits*\n` +
      `*Remaining:* ${remaining}\n` +
      `*Total:* ${credits?.total_credits || 0}\n` +
      `*Used this month:* ${credits?.used_credits || 0}\n` +
      `*Resets:* ${credits?.reset_date ? new Date(credits.reset_date).toLocaleDateString() : 'N/A'}\n\n` +
      `📈 *Usage (Last 30 days)*\n` +
      `*Total workflows:* ${totalExecutions}\n` +
      `*Successful:* ${successfulExecutions}\n` +
      `*Success rate:* ${totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0}%`,
      { parse_mode: 'Markdown' }
    );
  });

  /**
   * Credits command - Show credit information
   */
  bot.command('credits', async (ctx) => {
    const telegramId = ctx.from.id;
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);

    if (!telegramAccount?.user) {
      await ctx.reply('Please activate your account first. Type /start to begin.');
      return;
    }

    const credits = await supabaseService.getUserCredits(telegramAccount.user.id);
    if (!credits) {
      await ctx.reply('Credit information not available. Please contact support.');
      return;
    }

    const remaining = Math.max(0, credits.total_credits + credits.bonus_credits - credits.used_credits);
    const resetDate = new Date(credits.reset_date);

    await ctx.reply(
      `💳 *Credit Balance*\n\n` +
      `*Available:* ${remaining} credits\n` +
      `*Plan credits:* ${credits.total_credits}\n` +
      `*Bonus credits:* ${credits.bonus_credits}\n` +
      `*Used this month:* ${credits.used_credits}\n\n` +
      `📅 *Billing Cycle*\n` +
      `*Resets:* ${resetDate.toLocaleDateString()}\n` +
      `*Days remaining:* ${Math.ceil((resetDate - new Date()) / (1000 * 60 * 60 * 24))}\n\n` +
      `${remaining < 10 ? '⚠️ *Low credits!* Consider upgrading your plan.' : '✅ You have plenty of credits.'}\n\n` +
      `*Need more?* Visit ${process.env.FRONTEND_URL} to upgrade.`,
      { parse_mode: 'Markdown' }
    );
  });

  /**
   * Workflows command - Show available workflows
   */
  bot.command('workflows', async (ctx) => {
    const telegramId = ctx.from.id;
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);

    if (!telegramAccount?.user) {
      await ctx.reply('Please activate your account first. Type /start to begin.');
      return;
    }

    const availableWorkflows = workflowService.getAvailableWorkflows(telegramAccount.user.tier);
    
    let workflowText = `🔧 *Available Automations*\n\n`;
    workflowText += `*Your plan: ${telegramAccount.user.tier.toUpperCase()}*\n\n`;

    availableWorkflows.forEach(workflowType => {
      const info = workflowService.getWorkflowInfo(workflowType);
      workflowText += `• *${info.name}* (${info.creditCost} credits)\n`;
      workflowText += `  ${info.description}\n\n`;
    });

    workflowText += `*How to use:*\n`;
    workflowText += `Just tell me what you want to do in plain English!\n\n`;
    workflowText += `*Examples:*\n`;
    workflowText += `"Monitor Tesla stock price"\n`;
    workflowText += `"Track mentions of my brand"\n`;
    workflowText += `"Get daily AI news summary"`;

    await ctx.reply(workflowText, { parse_mode: 'Markdown' });
  });

  /**
   * Upgrade command
   */
  bot.command('upgrade', async (ctx) => {
    const telegramId = ctx.from.id;
    
    // Generate payment link for Telegram user
    try {
      const response = await fetch(`${process.env.ORCHESTRATION_URL}/api/telegram/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          telegramData: {
            id: ctx.from.id,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name
          },
          tier: 'pro'
        })
      });

      const result = await response.json();

      if (result.success) {
        await ctx.reply(
          `💎 *Upgrade to Pro Plan*\n\n` +
          `*Benefits:*\n` +
          `• 1,000 automation credits/month\n` +
          `• Access to all workflows\n` +
          `• Priority support\n` +
          `• Advanced AI models\n\n` +
          `*Price:* $19/month\n\n` +
          `Click here to upgrade:\n${result.paymentUrl}\n\n` +
          `After payment, I'll be automatically activated with your Pro features!`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply('Error generating payment link. Please try again or visit our website.');
      }
    } catch (error) {
      logger.error('Upgrade command error', error);
      await ctx.reply('Error processing upgrade. Please visit our website or contact support.');
    }
  });

  // ======================
  // NATURAL LANGUAGE PROCESSING
  // ======================

  /**
   * Handle all text messages for natural language processing
   */
  bot.on('text', async (ctx) => {
    // Skip if it's a command
    if (ctx.message.text.startsWith('/')) return;

    const telegramId = ctx.from.id;
    const message = ctx.message.text;

    // Check if user is activated
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);
    
    if (!telegramAccount?.user) {
      await ctx.reply(
        'I\'d love to help, but you need to activate your account first!\n\n' +
        `Visit ${process.env.FRONTEND_URL} to sign up, then come back here.`
      );
      return;
    }

    // Show typing indicator
    await ctx.sendChatAction('typing');

    try {
      // Process with natural language understanding
      const response = await fetch(`${process.env.ORCHESTRATION_URL}/api/telegram/execute-nlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          message
        })
      });

      const result = await response.json();

      if (result.success) {
        // Successful workflow execution
        const workflowInfo = workflowService.getWorkflowInfo(result.workflowType);
        
        await ctx.reply(
          `✅ *${workflowInfo.name} completed successfully!*\n\n` +
          `*Execution ID:* \`${result.executionId}\`\n` +
          `*Credits used:* ${result.creditsConsumed}\n` +
          `*Execution time:* ${Math.round(result.executionTime / 1000)}s\n\n` +
          `${formatWorkflowResult(result.result)}`,
          { parse_mode: 'Markdown' }
        );
      } else if (result.error === 'Intent not recognized') {
        // Couldn't understand the request
        await ctx.reply(
          `🤔 I didn't quite understand that request.\n\n` +
          `*Try asking about:*\n` +
          `• Monitoring competitor prices\n` +
          `• Tracking social media mentions\n` +
          `• Processing documents\n` +
          `• Getting news updates\n\n` +
          `*Or type:* /workflows to see all options`
        );
      } else if (result.error?.includes('Insufficient credits')) {
        // Not enough credits
        await ctx.reply(
          `💳 *Insufficient credits*\n\n` +
          `You don't have enough credits for this automation.\n\n` +
          `Type /credits to check your balance or /upgrade to get more.`
        );
      } else if (result.error === 'Workflow not available') {
        // Workflow not available for user tier
        await ctx.reply(
          `🔒 *Feature not available*\n\n` +
          `This automation requires a higher plan.\n\n` +
          `*Your plan:* ${result.userTier}\n` +
          `*Required:* Pro or higher\n\n` +
          `Type /upgrade to unlock all features!`
        );
      } else {
        // Other errors
        await ctx.reply(
          `❌ *Something went wrong*\n\n` +
          `${result.error || 'Unknown error occurred'}\n\n` +
          `Please try again or contact support if the problem persists.`
        );
      }

    } catch (error) {
      logger.error('NLP processing error', error);
      await ctx.reply(
        '❌ *Error processing your request*\n\n' +
        'Please try again in a moment or contact support.'
      );
    }
  });

  // ======================
  // DOCUMENT HANDLING
  // ======================

  /**
   * Handle document uploads
   */
  bot.on('document', async (ctx) => {
    const telegramId = ctx.from.id;
    const telegramAccount = await supabaseService.getUserByTelegramId(telegramId);
    
    if (!telegramAccount?.user) {
      await ctx.reply('Please activate your account first to process documents.');
      return;
    }

    const document = ctx.message.document;
    const supportedTypes = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'];
    const fileExtension = document.file_name?.split('.').pop()?.toLowerCase();

    if (!supportedTypes.includes(fileExtension)) {
      await ctx.reply(
        `📄 *Unsupported file type*\n\n` +
        `I can process: PDF, DOC, DOCX, TXT, CSV, XLSX files.\n\n` +
        `Your file: ${document.file_name || 'unknown'}`
      );
      return;
    }

    await ctx.sendChatAction('typing');
    
    try {
      // Get file URL from Telegram
      const file = await ctx.telegram.getFile(document.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      // Process document
      const response = await fetch(`${process.env.ORCHESTRATION_URL}/api/workflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          workflowType: 'document-processor',
          input: {
            documentUrl: fileUrl,
            documentName: document.file_name,
            documentType: fileExtension,
            fileSize: document.file_size
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        await ctx.reply(
          `📄 *Document processed successfully!*\n\n` +
          `*File:* ${document.file_name}\n` +
          `*Size:* ${Math.round(document.file_size / 1024)}KB\n` +
          `*Credits used:* ${result.creditsConsumed}\n\n` +
          `${formatDocumentResult(result.result)}`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          `❌ *Failed to process document*\n\n` +
          `${result.error || 'Unknown error occurred'}`
        );
      }

    } catch (error) {
      logger.error('Document processing error', error);
      await ctx.reply('❌ Error processing document. Please try again.');
    }
  });

  // ======================
  // HELPER FUNCTIONS
  // ======================

  /**
   * Log Telegram interactions for analytics
   */
  async function logTelegramInteraction(ctx) {
    try {
      const telegramAccount = await supabaseService.getUserByTelegramId(ctx.from.id);
      
      await supabaseService.adminClient
        .from('telegram_interactions')
        .insert({
          telegram_id: ctx.from.id,
          user_id: telegramAccount?.user?.id,
          interaction_type: ctx.updateType,
          command: ctx.message?.text?.startsWith('/') ? ctx.message.text.split(' ')[0] : null,
          message_text: ctx.message?.text?.substring(0, 500), // Truncate long messages
          message_type: ctx.message ? Object.keys(ctx.message).find(key => 
            ['text', 'photo', 'document', 'voice', 'video'].includes(key)
          ) : null,
          chat_id: ctx.chat.id,
          chat_type: ctx.chat.type,
          message_id: ctx.message?.message_id,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      // Don't let logging errors break the bot
      logger.error('Failed to log interaction', error);
    }
  }

  /**
   * Format workflow results for display
   */
  function formatWorkflowResult(result) {
    if (typeof result === 'string') {
      return result.substring(0, 1000) + (result.length > 1000 ? '...' : '');
    }

    if (result && typeof result === 'object') {
      if (result.summary) {
        return result.summary;
      }
      if (result.message) {
        return result.message;
      }
      if (result.data) {
        return JSON.stringify(result.data, null, 2).substring(0, 1000);
      }
    }

    return 'Workflow completed successfully!';
  }

  /**
   * Format document processing results
   */
  function formatDocumentResult(result) {
    if (result?.extracted_text) {
      const text = result.extracted_text.substring(0, 500);
      return `*Extracted text:*\n${text}${result.extracted_text.length > 500 ? '...' : ''}`;
    }

    if (result?.summary) {
      return `*Summary:*\n${result.summary}`;
    }

    return formatWorkflowResult(result);
  }

  logger.info('Telegram bot handlers configured successfully');
};