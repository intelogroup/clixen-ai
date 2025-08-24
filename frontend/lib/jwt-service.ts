/**
 * JWT Service for User Isolation Architecture
 * Handles token generation, validation, and user context management
 * Ensures secure user identification across Telegram → AI → n8n pipeline
 */

import jwt from 'jsonwebtoken';
import { createClient } from './supabase-server';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
const JWT_ALGORITHM = 'HS256';
const DEFAULT_EXPIRY = '10m'; // 10 minutes for short-lived tokens

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SUPABASE_JWT_SECRET environment variable is required');
}

// User Context Interface
export interface UserContext {
  authUserId: string;           // Supabase Auth UID (primary identifier)
  profileId: string;            // Profile table ID
  telegramChatId: string;       // Telegram chat ID
  tier: 'free' | 'starter' | 'pro';
  quotaUsed: number;
  quotaLimit: number;
  trialActive: boolean;
  permissions: string[];        // User permissions array
  metadata: Record<string, any>; // Additional user metadata
}

// JWT Payload Interface
interface JWTPayload {
  sub: string;                  // Subject (auth_user_id)
  telegram_chat_id: string;     // Telegram identification
  profile_id: string;           // Profile ID for database operations
  tier: string;                 // Subscription tier
  quota_used: number;           // Current quota usage
  quota_limit: number;          // Quota limit
  trial_active: boolean;        // Trial status
  permissions: string[];        // User permissions
  metadata: Record<string, any>; // User metadata
  iat: number;                  // Issued at
  exp: number;                  // Expires at
  iss: string;                  // Issuer
  aud: string;                  // Audience
}

export class JWTService {
  private static instance: JWTService;

  private constructor() {}

  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  /**
   * Generate a user-specific JWT token for downstream services
   */
  async generateUserToken(
    userContext: UserContext, 
    expiresIn: string = DEFAULT_EXPIRY
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiry = this.parseExpiry(expiresIn);

    const payload: JWTPayload = {
      sub: userContext.authUserId,
      telegram_chat_id: userContext.telegramChatId,
      profile_id: userContext.profileId,
      tier: userContext.tier,
      quota_used: userContext.quotaUsed,
      quota_limit: userContext.quotaLimit,
      trial_active: userContext.trialActive,
      permissions: userContext.permissions,
      metadata: userContext.metadata,
      iat: now,
      exp: now + expiry,
      iss: 'clixen-ai',
      aud: 'n8n-workflows'
    };

    const token = jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });

    // Store token hash in database for revocation tracking
    await this.storeTokenHash(userContext.authUserId, this.hashToken(token));

    return token;
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: 'clixen-ai',
        audience: 'n8n-workflows'
      });
      
      // Cast to unknown first, then to our type
      const payload = decoded as unknown as JWTPayload;

      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(payload.sub, this.hashToken(token));
      if (isRevoked) {
        console.warn(`[JWT] Token revoked for user ${payload.sub}`);
        return null;
      }

      // Verify user still has access
      const hasAccess = await this.verifyUserAccess(payload.sub);
      if (!hasAccess) {
        console.warn(`[JWT] User ${payload.sub} access revoked`);
        return null;
      }

      return payload;
    } catch (error) {
      console.error('[JWT] Token validation failed:', error);
      return null;
    }
  }

  /**
   * Get user context by Telegram chat ID
   */
  async getUserContextByTelegramId(telegramChatId: string): Promise<UserContext | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_user_by_telegram_chat_id', { 
          chat_id: parseInt(telegramChatId) 
        })
        .single();

      if (error || !data) {
        console.error('[JWT] Failed to get user by Telegram ID:', error);
        return null;
      }

      // Type the RPC response
      const userData = data as {
        auth_user_id: string;
        profile_id: string;
        tier: 'free' | 'starter' | 'pro';
        quota_used: number;
        quota_limit: number;
        trial_active: boolean;
      };

      return {
        authUserId: userData.auth_user_id,
        profileId: userData.profile_id,
        telegramChatId: telegramChatId,
        tier: userData.tier,
        quotaUsed: userData.quota_used || 0,
        quotaLimit: userData.quota_limit || 50,
        trialActive: userData.trial_active || false,
        permissions: this.getUserPermissions(userData.tier),
        metadata: {}
      };
    } catch (error) {
      console.error('[JWT] Error getting user context:', error);
      return null;
    }
  }

  /**
   * Refresh user context from database
   */
  async refreshUserContext(authUserId: string): Promise<UserContext | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          auth_user_id,
          telegram_chat_id,
          tier,
          quota_used,
          quota_limit,
          trial_started_at,
          trial_expires_at,
          user_metadata
        `)
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !data) {
        console.error('[JWT] Failed to refresh user context:', error);
        return null;
      }

      const trialActive = data.trial_started_at && 
        data.trial_expires_at && 
        new Date(data.trial_expires_at) > new Date();

      return {
        authUserId: data.auth_user_id,
        profileId: data.id,
        telegramChatId: data.telegram_chat_id || '',
        tier: data.tier,
        quotaUsed: data.quota_used || 0,
        quotaLimit: data.quota_limit || 50,
        trialActive: trialActive || false,
        permissions: this.getUserPermissions(data.tier),
        metadata: data.user_metadata || {}
      };
    } catch (error) {
      console.error('[JWT] Error refreshing user context:', error);
      return null;
    }
  }

  /**
   * Revoke user token
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const payload = jwt.decode(token) as JWTPayload;
      if (!payload || !payload.sub) {
        return false;
      }

      const supabase = createClient();
      await supabase
        .from('user_sessions')
        .delete()
        .eq('auth_user_id', payload.sub)
        .eq('jwt_token_hash', this.hashToken(token));

      return true;
    } catch (error) {
      console.error('[JWT] Error revoking token:', error);
      return false;
    }
  }

  /**
   * Log user action with context
   */
  async logUserAction(
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
          auth_user_id: authUserId,
          telegram_chat_id: parseInt(telegramChatId),
          action_type: actionType,
          action_detail: actionDetail,
          context,
          success,
          processing_time_ms: processingTimeMs,
        });
    } catch (error) {
      console.error('[JWT] Error logging user action:', error);
    }
  }

  // Private helper methods

  private parseExpiry(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 600; // Default 10 minutes
    }
  }

  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async storeTokenHash(authUserId: string, tokenHash: string): Promise<void> {
    try {
      const supabase = createClient();
      
      await supabase
        .from('user_sessions')
        .upsert({
          auth_user_id: authUserId,
          jwt_token_hash: tokenHash,
          session_token: `session_${Date.now()}`,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        });
    } catch (error) {
      console.error('[JWT] Error storing token hash:', error);
    }
  }

  private async isTokenRevoked(authUserId: string, tokenHash: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('auth_user_id', authUserId)
        .eq('jwt_token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !data; // Token is revoked if not found in active sessions
    } catch (error) {
      return true; // Assume revoked on error for security
    }
  }

  private async verifyUserAccess(authUserId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('profiles')
        .select('tier, trial_expires_at')
        .eq('auth_user_id', authUserId)
        .single();

      if (!data) return false;

      // Check if user has paid tier or active trial
      const hasActiveTrial = data.trial_expires_at && 
        new Date(data.trial_expires_at) > new Date();
      
      const hasPaidTier = data.tier && data.tier !== 'free';

      return hasActiveTrial || hasPaidTier;
    } catch (error) {
      return false;
    }
  }

  private getUserPermissions(tier: string): string[] {
    switch (tier) {
      case 'pro':
        return ['weather', 'email_scan', 'pdf_summary', 'translate', 'reminder', 'premium_features', 'priority_support'];
      case 'starter':
        return ['weather', 'email_scan', 'pdf_summary', 'translate', 'reminder'];
      case 'free':
      default:
        return ['weather', 'translate']; // Limited permissions for free tier
    }
  }
}

// Export singleton instance
export const jwtService = JWTService.getInstance();