/**
 * Isolated Telegram Webhook Handler
 * Implements complete user isolation architecture:
 * Telegram → User Validation → JWT Generation → AI Backend → n8n Workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { telegramLinkingService } from '@/lib/telegram-linking';
import { jwtService } from '@/lib/jwt-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const N8N_BASE = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clixen.app';

// Enhanced system prompt with user context awareness
const SYSTEM_PROMPT = `You are Clixen AI, a secure automation assistant. You help authenticated users automate tasks through verified workflows.

AVAILABLE WORKFLOWS (with permissions):
1. Weather Check - Get current weather (all tiers)
2. Email Invoice Scanner - Scan inbox for spending analysis (starter+)  
3. PDF Summarizer - Summarize documents (starter+)
4. Text Translator - Translate text (all tiers)
5. Daily Reminder - Set recurring reminders (starter+)

USER CONTEXT PROVIDED:
- User tier and permissions
- Quota limits and usage
- Trial status

ROUTING DECISION:
Return JSON with:
- action: "route_to_n8n" | "direct_response" | "need_clarification" | "permission_denied"
- workflow: workflow identifier if routing
- parameters: extracted parameters
- response: message for user
- clarification: question if needed
- credits_required: estimated credits for action (1-5)

SECURITY RULES:
- Check user permissions before workflow routing
- Respect quota limits
- Provide helpful messages for permission/quota issues
- Never expose internal system details`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    document?: {
      file_id: string;
      file_name: string;
    };
  };
}

interface AIDecision {
  action: 'route_to_n8n' | 'direct_response' | 'need_clarification' | 'permission_denied';
  workflow?: string;
  parameters?: Record<string, any>;
  response?: string;
  clarification?: string;
  credits_required?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const update: TelegramUpdate = await request.json();
    
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    const firstName = message.from.first_name;
    const username = message.from.username;

    console.log(`[Telegram Isolated] Message from ${firstName} (@${username}, ${userId}): ${text}`);

    // Handle linking commands first
    if (text.startsWith('/start') || text.startsWith('/link')) {
      return await handleLinkingCommands(chatId, userId, text, message.from);
    }

    // Step 1: Validate user and get context
    const validation = await telegramLinkingService.validateTelegramUser(userId);
    
    if (!validation.success || !validation.userContext) {
      await sendTelegramMessage(chatId, validation.message);
      
      // Log failed validation
      await jwtService.logUserAction(
        'unknown',
        chatId.toString(),
        'telegram_message',
        'user_validation_failed',
        { error: validation.error, text },
        false,
        Date.now() - startTime
      );
      
      return NextResponse.json({ ok: true });
    }

    const userContext = validation.userContext;

    // Handle bot commands
    if (text.startsWith('/')) {
      return await handleBotCommands(chatId, text, userContext, startTime);
    }

    // Step 2: Use AI to classify intent with user context
    const decision = await classifyIntentWithContext(text, message.document, userContext);

    // Step 3: Check permissions and quota
    const permissionCheck = await checkUserPermissions(decision, userContext);
    
    if (!permissionCheck.allowed) {
      await sendTelegramMessage(chatId, permissionCheck.message);
      
      await jwtService.logUserAction(
        userContext.authUserId,
        chatId.toString(),
        'permission_check',
        'permission_denied',
        { workflow: decision.workflow, reason: permissionCheck.reason },
        false,
        Date.now() - startTime
      );
      
      return NextResponse.json({ ok: true });
    }

    // Step 4: Handle based on AI decision
    switch (decision.action) {
      case 'direct_response':
        await sendTelegramMessage(chatId, decision.response || 'How can I help you?');
        break;

      case 'need_clarification':
        await sendTelegramMessage(chatId, decision.clarification || 'Could you provide more details?');
        break;

      case 'permission_denied':
        await sendTelegramMessage(chatId, decision.response || 'You don\'t have permission for this action.');
        break;

      case 'route_to_n8n':
        await handleWorkflowRouting(chatId, decision, userContext, text, startTime);
        break;
    }

    // Log successful message processing
    await jwtService.logUserAction(
      userContext.authUserId,
      chatId.toString(),
      'telegram_message',
      decision.action,
      {
        workflow: decision.workflow,
        text_length: text.length,
        has_document: !!message.document
      },
      true,
      Date.now() - startTime
    );

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Telegram Isolated] Error:', error);
    
    // Log error without exposing sensitive details
    try {
      await jwtService.logUserAction(
        'system',
        '0',
        'system_error',
        'telegram_webhook_error',
        { error_type: error instanceof Error ? error.name : 'unknown' },
        false,
        Date.now() - startTime
      );
    } catch (logError) {
      console.error('[Telegram Isolated] Logging error:', logError);
    }
    
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function handleLinkingCommands(
  chatId: number,
  userId: number,
  text: string,
  telegramUser: any
): Promise<NextResponse> {
  
  if (text === '/start' || text === '/link') {
    // Check if already linked
    const validation = await telegramLinkingService.validateTelegramUser(userId);
    
    if (validation.success) {
      await sendTelegramMessage(chatId,
        `Welcome back, ${telegramUser.first_name}! 🎉\n\n` +
        `Your account is linked and ready to use.\n\n` +
        `Available commands:\n` +
        `• Send me any request in natural language\n` +
        `• /help - Show available features\n` +
        `• /status - Check your account status\n` +
        `• /unlink - Unlink your account`
      );
      return NextResponse.json({ ok: true });
    }

    // Not linked - provide linking instructions
    await sendTelegramMessage(chatId,
      `Welcome to Clixen AI! 🤖\n\n` +
      `To get started:\n` +
      `1. Sign up at ${APP_URL}\n` +
      `2. Go to your dashboard\n` +
      `3. Click "Link Telegram Account"\n` +
      `4. Send me the linking code\n\n` +
      `After linking, I'll help you with:\n` +
      `• Weather updates ☀️\n` +
      `• Email analysis 📧\n` +
      `• Document summaries 📄\n` +
      `• Text translation 🌍\n` +
      `• Daily reminders ⏰`
    );
    return NextResponse.json({ ok: true });
  }

  // Handle linking token
  const linkingTokenMatch = text.match(/^[a-f0-9]{64}$/); // 64-char hex token
  if (linkingTokenMatch) {
    const linkingResult = await telegramLinkingService.processLinkingFromTelegram(
      text.trim(),
      {
        id: userId,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username
      }
    );

    if (linkingResult.success) {
      await sendTelegramMessage(chatId,
        `🎉 Account linked successfully!\n\n` +
        `Welcome ${telegramUser.first_name}! Your Telegram is now connected to your Clixen AI account.\n\n` +
        `Try asking me something like:\n` +
        `• "What's the weather in New York?"\n` +
        `• "Translate 'hello' to Spanish"\n` +
        `• "Scan my emails for invoices"\n\n` +
        `Use /help to see all available features.`
      );
    } else {
      await sendTelegramMessage(chatId,
        `❌ ${linkingResult.message}\n\n` +
        `Please try:\n` +
        `1. Get a new linking code from ${APP_URL}\n` +
        `2. Make sure you copy the entire code\n` +
        `3. Send it within 10 minutes of generation`
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function handleBotCommands(
  chatId: number,
  text: string,
  userContext: any,
  startTime: number
): Promise<NextResponse> {
  
  const command = text.split(' ')[0].toLowerCase();

  switch (command) {
    case '/help':
      const helpMessage = `🤖 Clixen AI - Your Personal Assistant\n\n` +
        `Available Features:\n` +
        `☀️ Weather: "Weather in Tokyo"\n` +
        `🌍 Translation: "Translate 'hello' to French"\n` +
        `${userContext.tier !== 'free' ? '📧 Email Scanning: "Check my emails for invoices"\n' : ''}` +
        `${userContext.tier !== 'free' ? '📄 PDF Summary: Upload a document\n' : ''}` +
        `${userContext.tier !== 'free' ? '⏰ Reminders: "Remind me to call John tomorrow"\n' : ''}\n` +
        `Commands:\n` +
        `• /status - Account information\n` +
        `• /help - This message\n` +
        `• /unlink - Disconnect account\n\n` +
        `Usage: ${userContext.quotaUsed}/${userContext.quotaLimit} requests\n` +
        `Tier: ${userContext.tier.toUpperCase()}` +
        (userContext.trialActive ? ' (TRIAL)' : '');
      
      await sendTelegramMessage(chatId, helpMessage);
      break;

    case '/status':
      const stats = await telegramLinkingService.getUserStats(userContext.authUserId);
      const statusMessage = `📊 Account Status\n\n` +
        `👤 User: ${userContext.authUserId.substring(0, 8)}...\n` +
        `💎 Tier: ${userContext.tier.toUpperCase()}\n` +
        `🎯 Trial: ${userContext.trialActive ? '✅ Active' : '❌ Expired'}\n` +
        `📈 Usage: ${userContext.quotaUsed}/${userContext.quotaLimit}\n` +
        `🔄 Recent Actions: ${stats?.totalActions || 0}\n` +
        `✅ Success Rate: ${stats ? Math.round((stats.successfulActions / stats.totalActions) * 100) : 0}%\n\n` +
        `${userContext.tier === 'free' && !userContext.trialActive ? 
          `Upgrade at ${APP_URL}/subscription for full features!` : 
          'All systems operational! 🚀'}`;
      
      await sendTelegramMessage(chatId, statusMessage);
      break;

    case '/unlink':
      const unlinkResult = await telegramLinkingService.unlinkTelegramAccount(userContext.authUserId);
      const unlinkMessage = unlinkResult.success ?
        `🔓 Account unlinked successfully!\n\nTo use Clixen AI again, visit ${APP_URL} and re-link your Telegram account.` :
        `❌ Failed to unlink account. Please try again or contact support.`;
      
      await sendTelegramMessage(chatId, unlinkMessage);
      break;

    default:
      await sendTelegramMessage(chatId, 
        `Unknown command: ${command}\n\nUse /help to see available commands or just ask me something in natural language!`
      );
  }

  // Log command usage
  await jwtService.logUserAction(
    userContext.authUserId,
    chatId.toString(),
    'telegram_command',
    command.substring(1), // Remove /
    { full_command: text },
    true,
    Date.now() - startTime
  );

  return NextResponse.json({ ok: true });
}

async function classifyIntentWithContext(
  text: string,
  document: any,
  userContext: any
): Promise<AIDecision> {
  try {
    const contextualPrompt = SYSTEM_PROMPT + `\n\nCURRENT USER CONTEXT:\n` +
      `- Tier: ${userContext.tier}\n` +
      `- Permissions: ${userContext.permissions.join(', ')}\n` +
      `- Quota: ${userContext.quotaUsed}/${userContext.quotaLimit}\n` +
      `- Trial Active: ${userContext.trialActive}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: contextualPrompt },
        { role: 'user', content: document ? 
          `User uploaded "${document.file_name}" and said: ${text}` : text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 250
    });

    const content = completion.choices[0]?.message?.content;
    return content ? JSON.parse(content) : { 
      action: 'direct_response', 
      response: 'How can I help you today?' 
    };
  } catch (error) {
    console.error('[AI Classification] Error:', error);
    return { 
      action: 'direct_response', 
      response: 'I\'m having trouble understanding right now. Please try again.' 
    };
  }
}

async function checkUserPermissions(
  decision: AIDecision,
  userContext: any
): Promise<{ allowed: boolean; message: string; reason?: string }> {
  
  // Check workflow permissions
  if (decision.action === 'route_to_n8n' && decision.workflow) {
    if (!userContext.permissions.includes(decision.workflow)) {
      return {
        allowed: false,
        message: `🔒 ${decision.workflow} requires ${userContext.tier === 'free' ? 'Starter' : 'Pro'} tier.\n\nUpgrade at ${APP_URL}/subscription to access this feature!`,
        reason: 'insufficient_permissions'
      };
    }
  }

  // Check quota limits
  const creditsRequired = decision.credits_required || 1;
  if (userContext.quotaUsed + creditsRequired > userContext.quotaLimit) {
    return {
      allowed: false,
      message: `📊 Quota limit reached (${userContext.quotaUsed}/${userContext.quotaLimit}).\n\n${
        userContext.tier === 'free' ? 
          `Upgrade at ${APP_URL}/subscription for higher limits!` :
          `Your quota resets monthly. Contact support for assistance.`
      }`,
      reason: 'quota_exceeded'
    };
  }

  return { allowed: true, message: 'Permission granted' };
}

async function handleWorkflowRouting(
  chatId: number,
  decision: AIDecision,
  userContext: any,
  originalText: string,
  startTime: number
): Promise<void> {
  
  try {
    // Send typing indicator
    await sendTypingIndicator(chatId);

    // Generate user-specific JWT token
    const userToken = await telegramLinkingService.generateUserJWT(
      chatId,
      { 
        workflow: decision.workflow,
        parameters: decision.parameters,
        original_message: originalText
      }
    );

    if (!userToken) {
      await sendTelegramMessage(chatId, 
        'Authentication error. Please try again or contact support.'
      );
      return;
    }

    // Check and increment quota
    const quotaOk = await telegramLinkingService.checkAndIncrementQuota(
      userContext.authUserId,
      decision.workflow!,
      decision.credits_required || 1
    );

    if (!quotaOk) {
      await sendTelegramMessage(chatId, 
        '📊 Unable to process request due to quota limits.'
      );
      return;
    }

    // Forward to n8n with user context
    const result = await forwardToN8NSecure(decision.workflow!, {
      ...decision.parameters,
      telegram_chat_id: chatId,
      user_context: {
        auth_user_id: userContext.authUserId,
        profile_id: userContext.profileId,
        tier: userContext.tier,
        permissions: userContext.permissions
      },
      message_text: originalText
    }, userToken);

    if (result.success) {
      await sendTelegramMessage(chatId, result.message);
    } else {
      await sendTelegramMessage(chatId, 
        `I couldn't complete that task. Please try again or contact support.\n\n` +
        `Error: ${result.message}`
      );
    }

    // Log workflow execution
    await jwtService.logUserAction(
      userContext.authUserId,
      chatId.toString(),
      'n8n_workflow',
      decision.workflow!,
      {
        parameters: decision.parameters,
        success: result.success,
        credits_used: decision.credits_required || 1
      },
      result.success,
      Date.now() - startTime
    );

  } catch (error) {
    console.error('[Workflow Routing] Error:', error);
    await sendTelegramMessage(chatId, 
      'An unexpected error occurred. Please try again.'
    );
  }
}

async function forwardToN8NSecure(
  workflow: string,
  parameters: Record<string, any>,
  userToken: string
): Promise<{ success: boolean; message: string }> {
  
  try {
    const response = await fetch(`${N8N_BASE}/webhook/api/v1/${workflow}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`, // User-specific JWT
        'X-User-Token': userToken, // Backup header
        'X-Clixen-Source': 'telegram-bot'
      },
      body: JSON.stringify(parameters)
    });

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { 
      success: true, 
      message: data.message || 'Task completed successfully!' 
    };
    
  } catch (error) {
    console.error('[n8n Secure Forward] Error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (error) {
    console.error('[Telegram Send] Error:', error);
  }
}

async function sendTypingIndicator(chatId: number): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing'
      })
    });
  } catch (error) {
    console.error('[Telegram Typing] Error:', error);
  }
}