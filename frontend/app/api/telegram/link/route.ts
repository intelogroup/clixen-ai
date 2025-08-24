/**
 * API Route: Generate Telegram Linking Token
 * Handles secure linking token generation for web dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { telegramLinkingService } from '@/lib/telegram-linking';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user from Supabase session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`[Telegram Link API] Generating token for user: ${user.id}`);

    // Generate linking token
    const result = await telegramLinkingService.generateLinkingToken(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: result.error === 'ALREADY_LINKED' ? 409 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      linkingToken: result.linkingToken,
      instructions: [
        'Open Telegram and find @clixen_bot',
        'Send the command /start or /link',
        'Copy and paste the linking token below',
        'Your account will be linked automatically'
      ],
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('[Telegram Link API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check current linking status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_username, telegram_first_name, telegram_linked_at')
      .eq('auth_user_id', user.id)
      .single();

    if (error) {
      console.error('[Telegram Link Status] Error:', error);
      return NextResponse.json(
        { error: 'Failed to check linking status' },
        { status: 500 }
      );
    }

    const isLinked = !!profile?.telegram_chat_id;

    return NextResponse.json({
      linked: isLinked,
      telegramInfo: isLinked ? {
        username: profile.telegram_username,
        firstName: profile.telegram_first_name,
        linkedAt: profile.telegram_linked_at
      } : null
    });

  } catch (error) {
    console.error('[Telegram Link Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`[Telegram Unlink API] Unlinking for user: ${user.id}`);

    // Unlink Telegram account
    const result = await telegramLinkingService.unlinkTelegramAccount(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account unlinked successfully'
    });

  } catch (error) {
    console.error('[Telegram Unlink API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}