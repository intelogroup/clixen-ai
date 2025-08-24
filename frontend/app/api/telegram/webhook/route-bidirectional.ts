/**
 * Enhanced Telegram Webhook Handler with Bidirectional Sync
 * Every Telegram interaction is captured and synced back to Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';
import { jwtService } from '@/lib/jwt-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const N8N_BASE = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clixen.app';

// Enhanced system prompt with user awareness
const SYSTEM_PROMPT = `You are Clixen AI, a secure automation assistant. You help users automate tasks through verified workflows.

AVAILABLE WORKFLOWS:
1. Weather Check - Get current weather (all tiers)
2. Email Invoice Scanner - Scan inbox for spending analysis (starter+)  
3. PDF Summarizer - Summarize documents (starter+)
4. Text Translator - Translate text (all tiers)
5. Daily Reminder - Set recurring reminders (starter+)

USER CONTEXT AWARENESS:
- Distinguish between linked and unlinked users
- Provide appropriate messaging for each user type
- Guide unlinked users through account connection process

ROUTING DECISION:
Return JSON with:
- action: "route_to_n8n" | "direct_response" | "need_clarification" | "account_linking" | "permission_denied"
- workflow: workflow identifier if routing
- parameters: extracted parameters
- response: message for user
- clarification: question if needed
- credits_required: estimated credits for action (1-5)`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
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
  action: 'route_to_n8n' | 'direct_response' | 'need_clarification' | 'account_linking' | 'permission_denied';
  workflow?: string;
  parameters?: Record<string, any>;
  response?: string;
  clarification?: string;
  credits_required?: number;
}

interface UserSyncResult {
  status: 'linked' | 'unlinked';
  user_id?: string;
  profile_id?: string;
  telegram_chat_id?: number;
  interaction_count?: number;
  action: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let chatId: number | undefined;
  
  try {
    const update: TelegramUpdate = await request.json();
    
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    const telegramUser = message.from;

    console.log(`[Telegram Bidirectional] Message from ${telegramUser.first_name} (@${telegramUser.username}, ${userId}): ${text}`);

    // STEP 1: BIDIRECTIONAL SYNC - Handle every interaction
    const syncResult = await handleTelegramInteraction(
      chatId,
      telegramUser.username,
      telegramUser.first_name,
      telegramUser.last_name,
      telegramUser.language_code,
      text
    );

    console.log(`[Bidirectional Sync] Result:`, syncResult);

    // STEP 2: Handle based on sync result
    if (syncResult.status === 'linked') {
      // User is linked - proceed with normal flow
      return await handleLinkedUser(chatId, text, message, syncResult, startTime);
    } else {
      // User is unlinked - handle appropriately
      return await handleUnlinkedUser(chatId, text, message, syncResult, startTime);
    }

  } catch (error) {
    console.error('[Telegram Bidirectional] Error:', error);
    
    // Log error if we have a chatId
    if (chatId) {
      try {
        await logInteraction('system', chatId.toString(), 'system_error', 'telegram_webhook_error', {
          error_type: error instanceof Error ? error.name : 'unknown',
          message_preview: 'Error processing telegram webhook'
        }, false, Date.now() - startTime);
      } catch (logError) {
        console.error('[Telegram Bidirectional] Logging error:', logError);
      }
    }
    
    return NextResponse.json({ ok: true });
  }
}

async function handleTelegramInteraction(
  chatId: number,
  username: string | undefined,
  firstName: string,
  lastName: string | undefined,
  languageCode: string | undefined,
  messageText: string
): Promise<UserSyncResult> {
  try {
    const supabase = createClient();
    
    // Call our bidirectional sync function
    const { data, error } = await supabase.rpc('handle_telegram_interaction', {
      chat_id_param: chatId,
      username_param: username || null,
      first_name_param: firstName,
      last_name_param: lastName || null,
      language_code_param: languageCode || null,
      message_text_param: messageText
    });

    if (error) {
      console.error('[Bidirectional Sync] Error:', error);
      return {
        status: 'unlinked',
        telegram_chat_id: chatId,
        interaction_count: 1,
        action: 'sync_error'
      };
    }

    return data as UserSyncResult;
  } catch (error) {
    console.error('[Bidirectional Sync] Exception:', error);
    return {
      status: 'unlinked',
      telegram_chat_id: chatId,
      interaction_count: 1,
      action: 'sync_exception'
    };
  }
}

async function handleLinkedUser(
  chatId: number,
  text: string,
  message: any,
  syncResult: UserSyncResult,
  startTime: number
): Promise<NextResponse> {
  
  // Get user context using our JWT service
  const userContext = await jwtService.getUserContextByTelegramId(chatId.toString());
  
  if (!userContext) {
    console.error('[Linked User] Failed to get user context');
    await sendTelegramMessage(chatId, 
      'There was an issue accessing your account. Please try again or contact support.'
    );
    return NextResponse.json({ ok: true });
  }

  // Handle bot commands
  if (text.startsWith('/')) {
    return await handleBotCommands(chatId, text, userContext, startTime);
  }

  // Use AI to classify intent with user context
  const decision = await classifyIntentWithContext(text, message.document, userContext);

  // Check permissions and quota
  const permissionCheck = await checkUserPermissions(decision, userContext);
  
  if (!permissionCheck.allowed) {
    await sendTelegramMessage(chatId, permissionCheck.message);
    
    await logInteraction(
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

  // Handle based on AI decision
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

  // Log successful interaction
  await logInteraction(
    userContext.authUserId,
    chatId.toString(),
    'telegram_message',
    decision.action,
    {
      workflow: decision.workflow,
      text_length: text.length,
      has_document: !!message.document,
      user_tier: userContext.tier
    },
    true,
    Date.now() - startTime
  );

  return NextResponse.json({ ok: true });
}

async function handleUnlinkedUser(
  chatId: number,
  text: string,
  message: any,
  syncResult: UserSyncResult,
  startTime: number
): Promise<NextResponse> {
  
  const telegramUser = message.from;
  
  // Handle linking token if user sends one
  const linkingTokenMatch = text.match(/^[a-f0-9]{64}$/);
  if (linkingTokenMatch) {
    return await handleLinkingToken(chatId, text.trim(), telegramUser);
  }

  // Handle /start command for unlinked users
  if (text.startsWith('/start') || text.startsWith('/link')) {
    await sendTelegramMessage(chatId,
      `👋 Welcome to Clixen AI, ${telegramUser.first_name}!\n\n` +
      `I see this is interaction #${syncResult.interaction_count || 1} with our bot.\n\n` +
      `To unlock all features:\n` +
      `1️⃣ Sign up at ${APP_URL}\n` +
      `2️⃣ Go to your dashboard\n` +
      `3️⃣ Click "Link Telegram Account"\n` +
      `4️⃣ Send me the linking code\n\n` +
      `✨ After linking, you'll have access to:\n` +
      `• Weather updates ☀️\n` +
      `• Email analysis 📧\n` +
      `• Document summaries 📄\n` +
      `• Text translation 🌍\n` +
      `• Daily reminders ⏰\n\n` +
      `Your interactions are safely stored and will be linked to your account! 🔒`
    );
    
    return NextResponse.json({ ok: true });
  }

  // Handle help command
  if (text.startsWith('/help')) {
    await sendTelegramMessage(chatId,
      `🤖 Clixen AI - Personal Automation Assistant\n\n` +
      `I can help you with many tasks, but first you need to link your account!\n\n` +
      `📱 To get started:\n` +
      `• Sign up at ${APP_URL}\n` +
      `• Link your Telegram in the dashboard\n` +
      `• Come back and start automating!\n\n` +
      `This is interaction #${syncResult.interaction_count || 1} - all your messages are being saved for when you link your account! 💾`
    );
    
    return NextResponse.json({ ok: true });
  }

  // Handle regular messages from unlinked users
  await sendTelegramMessage(chatId,
    `Hi ${telegramUser.first_name}! 👋\n\n` +
    `I'd love to help you with that, but you need to link your Clixen AI account first.\n\n` +
    `This is interaction #${syncResult.interaction_count || 1} with our bot - ` +
    `don't worry, all your messages are safely stored! 💾\n\n` +
    `🔗 Quick setup:\n` +
    `1. Visit ${APP_URL}\n` +
    `2. Create your account\n` +
    `3. Link your Telegram\n` +
    `4. Start automating!\n\n` +
    `Once linked, I can help you with weather, translations, email analysis, and much more! 🚀`
  );

  // Log unlinked user interaction
  await logInteraction(
    'unlinked',
    chatId.toString(),
    'telegram_temp_interaction',
    'unlinked_user_message',
    {
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      interaction_count: syncResult.interaction_count,
      message_preview: text.substring(0, 100)
    },
    true,
    Date.now() - startTime
  );

  return NextResponse.json({ ok: true });
}

async function handleLinkingToken(chatId: number, token: string, telegramUser: any): Promise<NextResponse> {
  try {
    const supabase = createClient();
    
    // Call our linking function
    const { data, error } = await supabase.rpc('link_telegram_account', {
      linking_token_param: token,
      chat_id_param: chatId,
      username_param: telegramUser.username || null,
      first_name_param: telegramUser.first_name,
      last_name_param: telegramUser.last_name || null
    });

    if (error || !data?.success) {
      await sendTelegramMessage(chatId,
        `❌ Linking failed: ${data?.error || error?.message || 'Unknown error'}\n\n` +
        `Please try:\n` +
        `• Get a fresh linking code from ${APP_URL}\n` +
        `• Make sure you copy the entire code\n` +
        `• Codes expire after 10 minutes`
      );
      return NextResponse.json({ ok: true });
    }

    // Success! Send welcome message
    await sendTelegramMessage(chatId,
      `🎉 Account linked successfully!\n\n` +
      `Welcome ${telegramUser.first_name}! Your Telegram is now connected to your Clixen AI account.\n\n` +
      `✨ You now have full access to:\n` +
      `• Weather updates: "Weather in Tokyo"\n` +
      `• Translation: "Translate 'hello' to French"\n` +
      `• Email scanning: "Check my emails for invoices"\n` +
      `• PDF summaries: Upload any document\n` +
      `• Reminders: "Remind me to call John tomorrow"\n\n` +
      `🎯 Try asking me something now, or use /help to see all features!`
    );

    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('[Linking Token] Error:', error);
    await sendTelegramMessage(chatId,
      `❌ An error occurred during linking. Please try again or contact support.`
    );
    return NextResponse.json({ ok: true });
  }
}

// Existing helper functions (simplified versions)
async function handleBotCommands(chatId: number, text: string, userContext: any, startTime: number): Promise<NextResponse> {
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
        `• /help - This message\n\n` +
        `Usage: ${userContext.quotaUsed}/${userContext.quotaLimit} requests\n` +
        `Tier: ${userContext.tier.toUpperCase()}`;
      
      await sendTelegramMessage(chatId, helpMessage);
      break;

    case '/status':
      const statusMessage = `📊 Account Status\n\n` +
        `👤 User: ${userContext.authUserId.substring(0, 8)}...\n` +
        `💎 Tier: ${userContext.tier.toUpperCase()}\n` +
        `🎯 Trial: ${userContext.trialActive ? '✅ Active' : '❌ Expired'}\n` +
        `📈 Usage: ${userContext.quotaUsed}/${userContext.quotaLimit}\n\n` +
        `All systems operational! 🚀`;
      
      await sendTelegramMessage(chatId, statusMessage);
      break;

    default:
      await sendTelegramMessage(chatId, 
        `Unknown command: ${command}\n\nUse /help to see available commands or just ask me something!`
      );
  }

  return NextResponse.json({ ok: true });
}

async function classifyIntentWithContext(text: string, document: any, userContext: any): Promise<AIDecision> {
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

async function checkUserPermissions(decision: AIDecision, userContext: any): Promise<{ allowed: boolean; message: string; reason?: string }> {
  // Check workflow permissions
  if (decision.action === 'route_to_n8n' && decision.workflow) {
    if (!userContext.permissions.includes(decision.workflow)) {
      return {
        allowed: false,
        message: `🔒 ${decision.workflow} requires ${userContext.tier === 'free' ? 'Starter' : 'Pro'} tier.\n\nUpgrade at ${APP_URL}/subscription`,
        reason: 'insufficient_permissions'
      };
    }
  }

  // Check quota limits
  const creditsRequired = decision.credits_required || 1;
  if (userContext.quotaUsed + creditsRequired > userContext.quotaLimit) {
    return {
      allowed: false,
      message: `📊 Quota limit reached (${userContext.quotaUsed}/${userContext.quotaLimit}).\n\nUpgrade at ${APP_URL}/subscription`,
      reason: 'quota_exceeded'
    };
  }

  return { allowed: true, message: 'Permission granted' };
}

async function handleWorkflowRouting(chatId: number, decision: AIDecision, userContext: any, originalText: string, startTime: number): Promise<void> {
  try {
    await sendTypingIndicator(chatId);

    // Generate user-specific JWT token
    const userToken = await jwtService.generateUserToken(userContext, '10m');

    if (!userToken) {
      await sendTelegramMessage(chatId, 'Authentication error. Please try again.');
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
      
      // Update quota
      const supabase = createClient();
      await supabase.rpc('increment_user_quota', {
        user_id: userContext.authUserId,
        amount: decision.credits_required || 1
      });
    } else {
      await sendTelegramMessage(chatId, `I couldn't complete that task. Please try again.`);
    }

  } catch (error) {
    console.error('[Workflow Routing] Error:', error);
    await sendTelegramMessage(chatId, 'An unexpected error occurred. Please try again.');
  }
}

async function forwardToN8NSecure(workflow: string, parameters: Record<string, any>, userToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${N8N_BASE}/webhook/api/v1/${workflow}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'X-Clixen-Source': 'telegram-bot'
      },
      body: JSON.stringify(parameters)
    });

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Task completed successfully!' };
    
  } catch (error) {
    console.error('[n8n Forward] Error:', error);
    return { success: false, message: 'Processing failed' };
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

async function logInteraction(
  authUserId: string,
  telegramChatId: string,
  actionType: string,
  actionDetail: string,
  context: Record<string, any> = {},
  success: boolean = true,
  processingTimeMs?: number
): Promise<void> {
  try {
    const supabase = createClient();
    
    await supabase
      .from('user_audit_log')
      .insert({
        auth_user_id: authUserId === 'unlinked' ? null : authUserId,
        telegram_chat_id: parseInt(telegramChatId),
        action_type: actionType,
        action_detail: actionDetail,
        context,
        success,
        processing_time_ms: processingTimeMs,
      });
  } catch (error) {
    console.error('[Log Interaction] Error:', error);
  }
}