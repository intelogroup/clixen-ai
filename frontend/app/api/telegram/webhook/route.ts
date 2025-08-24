import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const N8N_BASE = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// System prompt for AI routing
const SYSTEM_PROMPT = `You are Clixen AI, a Telegram automation assistant. You help users automate tasks through pre-built workflows.

AVAILABLE WORKFLOWS:
1. Weather Check - Get current weather for any city
2. Email Invoice Scanner - Read inbox for payment/invoice emails and summarize spending  
3. PDF Summarizer - Summarize uploaded PDF documents
4. Text Translator - Translate text between languages
5. Daily Reminder - Set up recurring reminders

ROUTING DECISION:
Return a JSON object with:
- action: "route_to_n8n" | "direct_response" | "need_clarification"
- workflow: (if routing) "weather" | "email_scan" | "pdf_summary" | "translate" | "reminder" | null
- parameters: extracted parameters as object
- response: (if direct response) the message to send
- clarification: (if needed) the question to ask user

IMPORTANT: 
- Extract parameters from user message
- Ask for clarification if parameters missing
- Decline requests outside our capabilities
- Be friendly and helpful`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
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
  action: 'route_to_n8n' | 'direct_response' | 'need_clarification';
  workflow?: string;
  parameters?: Record<string, any>;
  response?: string;
  clarification?: string;
}

export async function POST(request: NextRequest) {
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

    console.log(`[Telegram] Message from ${firstName} (${userId}): ${text}`);

    // Check if user is registered
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_chat_id', userId.toString())
      .single();

    // Handle /start command
    if (text.startsWith('/start')) {
      if (!profile) {
        await sendTelegramMessage(chatId, 
          `Welcome to Clixen AI! 🤖\n\n` +
          `Please sign up at https://clixen.app to start your free trial.\n\n` +
          `After signing up, come back here and use /start again to link your account.`
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(chatId, 
        `Welcome back, ${firstName}! 🎉\n\n` +
        `I can help you with:\n` +
        `• Weather updates\n` +
        `• Email invoice scanning\n` +
        `• PDF summarization\n` +
        `• Text translation\n` +
        `• Daily reminders\n\n` +
        `Just tell me what you need!`
      );
      return NextResponse.json({ ok: true });
    }

    // Check user access
    if (!profile) {
      await sendTelegramMessage(chatId, 
        `Please sign up at https://clixen.app to use this bot.`
      );
      return NextResponse.json({ ok: true });
    }

    // Check trial/subscription status
    const hasAccess = profile.trial_active || profile.tier !== 'free';
    if (!hasAccess) {
      await sendTelegramMessage(chatId, 
        `Your trial has expired. Please upgrade at https://clixen.app/subscription`
      );
      return NextResponse.json({ ok: true });
    }

    // Use AI to classify and route the message
    const decision = await classifyIntent(text, message.document);

    // Handle based on AI decision
    switch (decision.action) {
      case 'direct_response':
        await sendTelegramMessage(chatId, decision.response || 'How can I help you?');
        break;

      case 'need_clarification':
        await sendTelegramMessage(chatId, decision.clarification || 'Could you provide more details?');
        break;

      case 'route_to_n8n':
        // Send typing indicator
        await sendTypingIndicator(chatId);
        
        // Forward to n8n
        const result = await forwardToN8N(decision.workflow!, {
          ...decision.parameters,
          telegram_chat_id: chatId,
          user_id: profile.id,
          message_text: text
        });

        if (result.success) {
          await sendTelegramMessage(chatId, result.message);
        } else {
          await sendTelegramMessage(chatId, 
            `I couldn't complete that task. Please try again or type /help for assistance.`
          );
        }
        break;
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: profile.id,
      action: decision.workflow || 'chat',
      telegram_message_id: message.message_id,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function classifyIntent(text: string, document?: any): Promise<AIDecision> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: document ? `User uploaded a file named "${document.file_name}" and said: ${text}` : text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200
    });

    const content = completion.choices[0]?.message?.content;
    return content ? JSON.parse(content) : { action: 'direct_response', response: 'How can I help you?' };
  } catch (error) {
    console.error('[AI Classification] Error:', error);
    return { action: 'direct_response', response: 'How can I help you today?' };
  }
}

async function forwardToN8N(workflow: string, parameters: Record<string, any>) {
  try {
    const response = await fetch(`${N8N_BASE}/webhook/api/v1/${workflow}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.N8N_API_KEY || 'clixen-secret-key'
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
    return { success: false, message: 'Failed to process request' };
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (error) {
    console.error('[Telegram Send] Error:', error);
  }
}

async function sendTypingIndicator(chatId: number) {
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