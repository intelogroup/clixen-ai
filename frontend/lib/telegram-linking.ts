/**
 * Telegram Account Linking Service
 * Handles secure linking of Telegram accounts to Supabase user profiles
 * Implements the isolated user authentication flow
 */

import { createClient } from './supabase-server';
import { jwtService, UserContext } from './jwt-service';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface LinkingResult {
  success: boolean;
  message: string;
  userContext?: UserContext;
  linkingToken?: string;
  error?: string;
}

export class TelegramLinkingService {
  private static instance: TelegramLinkingService;

  private constructor() {}

  public static getInstance(): TelegramLinkingService {
    if (!TelegramLinkingService.instance) {
      TelegramLinkingService.instance = new TelegramLinkingService();
    }
    return TelegramLinkingService.instance;
  }

  /**
   * Step 1: Generate linking token for web dashboard
   * Called when user clicks "Link Telegram" in web dashboard
   */
  async generateLinkingToken(authUserId: string): Promise<LinkingResult> {
    try {
      const supabase = createClient();

      // Check if user already has Telegram linked
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_chat_id, telegram_username')
        .eq('auth_user_id', authUserId)
        .single();

      if (profile?.telegram_chat_id) {
        return {
          success: false,
          message: 'Telegram account is already linked',
          error: 'ALREADY_LINKED'
        };
      }

      // Generate secure linking token using database function
      const { data: tokenData, error } = await supabase
        .rpc('create_telegram_linking_token', { user_id: authUserId });

      if (error || !tokenData) {
        console.error('[Telegram Linking] Failed to create token:', error);
        return {
          success: false,
          message: 'Failed to generate linking token',
          error: 'TOKEN_GENERATION_FAILED'
        };
      }

      // Log the linking attempt
      await jwtService.logUserAction(
        authUserId,
        '0', // No Telegram chat ID yet
        'auth_event',
        'linking_token_generated',
        { method: 'web_dashboard' }
      );

      return {
        success: true,
        message: 'Linking token generated successfully',
        linkingToken: tokenData
      };

    } catch (error) {
      console.error('[Telegram Linking] Error generating token:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR'
      };
    }
  }

  /**
   * Step 2: Process linking request from Telegram bot
   * Called when user sends linking token to Telegram bot
   */
  async processLinkingFromTelegram(
    linkingToken: string,
    telegramUser: TelegramUser
  ): Promise<LinkingResult> {
    try {
      const supabase = createClient();

      // Call database function to link account
      const { data: linkingResult, error } = await supabase
        .rpc('link_telegram_account', {
          linking_token_param: linkingToken,
          chat_id_param: telegramUser.id,
          username_param: telegramUser.username || null,
          first_name_param: telegramUser.first_name,
          last_name_param: telegramUser.last_name || null
        });

      if (error || !linkingResult?.success) {
        console.error('[Telegram Linking] Linking failed:', error, linkingResult);
        return {
          success: false,
          message: linkingResult?.error || 'Failed to link Telegram account',
          error: 'LINKING_FAILED'
        };
      }

      // Get complete user context
      const userContext = await jwtService.refreshUserContext(
        linkingResult.user_id
      );

      if (!userContext) {
        return {
          success: false,
          message: 'Failed to retrieve user context after linking',
          error: 'CONTEXT_ERROR'
        };
      }

      return {
        success: true,
        message: 'Telegram account linked successfully!',
        userContext
      };

    } catch (error) {
      console.error('[Telegram Linking] Error processing linking:', error);
      return {
        success: false,
        message: 'Internal server error during linking',
        error: 'SERVER_ERROR'
      };
    }
  }

  /**
   * Step 3: Validate user access by Telegram chat ID
   * Called for every Telegram message to get user context
   */
  async validateTelegramUser(telegramChatId: number): Promise<LinkingResult> {
    try {
      const userContext = await jwtService.getUserContextByTelegramId(
        telegramChatId.toString()
      );

      if (!userContext) {
        return {
          success: false,
          message: 'Telegram account not linked. Please sign up at https://clixen.app and link your account.',
          error: 'NOT_LINKED'
        };
      }

      // Check if user has active access (trial or paid)
      if (!userContext.trialActive && userContext.tier === 'free') {
        return {
          success: false,
          message: 'Your trial has expired. Please upgrade at https://clixen.app/subscription',
          error: 'ACCESS_EXPIRED'
        };
      }

      return {
        success: true,
        message: 'User validated successfully',
        userContext
      };

    } catch (error) {
      console.error('[Telegram Linking] Error validating user:', error);
      return {
        success: false,
        message: 'Error validating account',
        error: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Step 4: Generate JWT token for downstream services
   * Called when forwarding requests to AI backend and n8n
   */
  async generateUserJWT(
    telegramChatId: number,
    actionContext: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      const userContext = await jwtService.getUserContextByTelegramId(
        telegramChatId.toString()
      );

      if (!userContext) {
        console.error('[Telegram Linking] No user context for JWT generation');
        return null;
      }

      // Generate short-lived JWT token
      const token = await jwtService.generateUserToken(userContext, '10m');

      // Log JWT generation
      await jwtService.logUserAction(
        userContext.authUserId,
        telegramChatId.toString(),
        'auth_event',
        'jwt_token_generated',
        {
          ...actionContext,
          token_expiry: '10m',
          permissions: userContext.permissions
        }
      );

      return token;

    } catch (error) {
      console.error('[Telegram Linking] Error generating JWT:', error);
      return null;
    }
  }

  /**
   * Check quota and increment usage
   */
  async checkAndIncrementQuota(
    authUserId: string,
    actionType: string,
    creditsRequired: number = 1
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .rpc('increment_user_quota', {
          user_id: authUserId,
          amount: creditsRequired
        });

      if (error || !data) {
        console.error('[Telegram Linking] Quota check failed:', error);
        return false;
      }

      // Log quota usage
      await jwtService.logUserAction(
        authUserId,
        '0', // Will be filled by calling function
        'quota_event',
        'quota_incremented',
        {
          action_type: actionType,
          credits_used: creditsRequired,
          quota_check_result: data
        }
      );

      return true;

    } catch (error) {
      console.error('[Telegram Linking] Error checking quota:', error);
      return false;
    }
  }

  /**
   * Unlink Telegram account
   */
  async unlinkTelegramAccount(authUserId: string): Promise<LinkingResult> {
    try {
      const supabase = createClient();

      // Remove Telegram info from profile
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: null,
          telegram_username: null,
          telegram_first_name: null,
          telegram_last_name: null,
          telegram_linked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', authUserId);

      if (error) {
        console.error('[Telegram Linking] Unlink failed:', error);
        return {
          success: false,
          message: 'Failed to unlink Telegram account',
          error: 'UNLINK_FAILED'
        };
      }

      // Revoke all active sessions for this user
      await supabase
        .from('user_sessions')
        .delete()
        .eq('auth_user_id', authUserId);

      // Log the unlinking
      await jwtService.logUserAction(
        authUserId,
        '0',
        'auth_event',
        'telegram_account_unlinked',
        { method: 'manual_unlink' }
      );

      return {
        success: true,
        message: 'Telegram account unlinked successfully'
      };

    } catch (error) {
      console.error('[Telegram Linking] Error unlinking account:', error);
      return {
        success: false,
        message: 'Internal server error during unlinking',
        error: 'SERVER_ERROR'
      };
    }
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStats(authUserId: string): Promise<Record<string, any> | null> {
    try {
      const supabase = createClient();

      const { data } = await supabase
        .from('user_audit_log')
        .select('action_type, action_detail, success, created_at')
        .eq('auth_user_id', authUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!data) return null;

      // Aggregate statistics
      const stats = {
        totalActions: data.length,
        successfulActions: data.filter(a => a.success).length,
        failedActions: data.filter(a => !a.success).length,
        actionsByType: data.reduce((acc, action) => {
          acc[action.action_type] = (acc[action.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: data.slice(0, 10),
        lastActivity: data[0]?.created_at
      };

      return stats;

    } catch (error) {
      console.error('[Telegram Linking] Error getting user stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const telegramLinkingService = TelegramLinkingService.getInstance();