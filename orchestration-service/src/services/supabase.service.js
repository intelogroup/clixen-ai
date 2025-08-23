const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      logger.error('Supabase credentials not configured');
      throw new Error('Missing Supabase configuration');
    }

    // Client for general operations
    this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Admin client for service operations
    this.adminClient = this.supabaseServiceKey 
      ? createClient(this.supabaseUrl, this.supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : this.client;

    logger.info('Supabase service initialized');
  }

  /**
   * Get user by Telegram ID
   * @param {number} telegramId - Telegram user ID
   * @returns {Object|null} User object with telegram account info
   */
  async getUserByTelegramId(telegramId) {
    try {
      const { data, error } = await this.client
        .from('telegram_accounts')
        .select(`
          *,
          user:users (
            id,
            email,
            name,
            tier,
            api_key,
            created_at,
            updated_at
          )
        `)
        .eq('telegram_id', telegramId)
        .eq('activated_at', 'not.is.null')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No user found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user by telegram ID:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User UUID
   * @returns {Object|null} User object
   */
  async getUserById(userId) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user by ID:', error);
      return null;
    }
  }

  /**
   * Create or link Telegram account to user
   * @param {string} userId - User UUID
   * @param {Object} telegramData - Telegram user data
   * @returns {Object} Created telegram account record
   */
  async linkTelegramAccount(userId, telegramData) {
    try {
      const { data, error } = await this.adminClient
        .from('telegram_accounts')
        .upsert({
          user_id: userId,
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_last_name: telegramData.last_name,
          activated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }, {
          onConflict: 'user_id,telegram_id'
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Telegram account linked for user ${userId}`);
      return data;
    } catch (error) {
      logger.error('Failed to link Telegram account:', error);
      throw error;
    }
  }

  /**
   * Store activation token for user onboarding
   * @param {string} userId - User UUID
   * @param {string} token - Activation token
   * @returns {boolean} Success status
   */
  async storeActivationToken(userId, token) {
    try {
      const { error } = await this.adminClient
        .from('telegram_accounts')
        .upsert({
          user_id: userId,
          activation_token: token,
          activation_method: 'web_to_telegram',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to store activation token:', error);
      return false;
    }
  }

  /**
   * Activate user via token
   * @param {string} token - Activation token
   * @param {Object} telegramData - Telegram user data
   * @returns {Object|null} Activated user data
   */
  async activateUserByToken(token, telegramData) {
    try {
      // Find user by activation token
      const { data: telegramAccount, error: findError } = await this.adminClient
        .from('telegram_accounts')
        .select('*, user:users(*)')
        .eq('activation_token', token)
        .is('activated_at', null)
        .single();

      if (findError || !telegramAccount) {
        logger.warn('Invalid or expired activation token');
        return null;
      }

      // Update with telegram data and activate
      const { data, error } = await this.adminClient
        .from('telegram_accounts')
        .update({
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_last_name: telegramData.last_name,
          activated_at: new Date().toISOString(),
          activation_token: null // Clear token after use
        })
        .eq('id', telegramAccount.id)
        .select('*, user:users(*)')
        .single();

      if (error) throw error;

      logger.info(`User activated via token: ${telegramAccount.user.email}`);
      return data;
    } catch (error) {
      logger.error('Failed to activate user by token:', error);
      return null;
    }
  }

  /**
   * Log workflow execution start
   * @param {Object} executionData - Execution data
   * @returns {Object} Created execution record
   */
  async logWorkflowStart(executionData) {
    try {
      const { data, error } = await this.adminClient
        .from('workflow_usage')
        .insert({
          execution_id: executionData.executionId,
          user_id: executionData.userId,
          telegram_id: executionData.telegramId,
          workflow_type: executionData.workflowType,
          workflow_name: executionData.workflowName,
          status: 'started',
          credits_consumed: executionData.creditsCost,
          input_data: executionData.inputData,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to log workflow start:', error);
      throw error;
    }
  }

  /**
   * Log workflow execution completion
   * @param {string} executionId - Execution UUID
   * @param {Object} resultData - Execution result data
   * @returns {boolean} Success status
   */
  async logWorkflowCompletion(executionId, resultData) {
    try {
      const { error } = await this.adminClient
        .from('workflow_usage')
        .update({
          status: resultData.status || 'completed',
          completed_at: new Date().toISOString(),
          execution_time_ms: resultData.executionTime,
          nodes_executed: resultData.nodesExecuted,
          output_data: resultData.outputData,
          error_message: resultData.error,
          ai_models_used: resultData.aiModelsUsed,
          ai_tokens_consumed: resultData.aiTokensConsumed,
          input_size_bytes: resultData.inputSize,
          output_size_bytes: resultData.outputSize
        })
        .eq('execution_id', executionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to log workflow completion:', error);
      return false;
    }
  }

  /**
   * Get user credit balance
   * @param {string} userId - User UUID
   * @returns {Object} Credit information
   */
  async getUserCredits(userId) {
    try {
      const { data, error } = await this.client
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No credit record found, create default
          return await this.initializeUserCredits(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user credits:', error);
      return null;
    }
  }

  /**
   * Initialize user credits based on tier
   * @param {string} userId - User UUID
   * @param {string} tier - User tier (free, pro, enterprise)
   * @returns {Object} Created credit record
   */
  async initializeUserCredits(userId, tier = 'free') {
    try {
      const creditsByTier = {
        free: 100,
        pro: 1000,
        enterprise: 10000
      };

      const { data, error } = await this.adminClient
        .from('user_credits')
        .upsert({
          user_id: userId,
          tier: tier,
          total_credits: creditsByTier[tier],
          used_credits: 0,
          bonus_credits: 0,
          reset_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to initialize user credits:', error);
      throw error;
    }
  }

  /**
   * Consume user credits
   * @param {string} userId - User UUID
   * @param {number} creditsToConsume - Number of credits to consume
   * @returns {boolean} Success status
   */
  async consumeCredits(userId, creditsToConsume) {
    try {
      const { error } = await this.adminClient
        .rpc('consume_user_credits', {
          p_user_id: userId,
          p_credits: creditsToConsume
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to consume credits:', error);
      return false;
    }
  }

  /**
   * Update user's last activity
   * @param {number} telegramId - Telegram user ID
   * @returns {boolean} Success status
   */
  async updateLastActivity(telegramId) {
    try {
      const { error } = await this.adminClient
        .from('telegram_accounts')
        .update({ last_active: new Date().toISOString() })
        .eq('telegram_id', telegramId);

      return !error;
    } catch (error) {
      logger.error('Failed to update last activity:', error);
      return false;
    }
  }

  /**
   * Store user conversation state
   * @param {number} telegramId - Telegram user ID
   * @param {Object} state - Conversation state
   * @returns {boolean} Success status
   */
  async storeConversationState(telegramId, state) {
    try {
      const { error } = await this.adminClient
        .from('telegram_accounts')
        .update({ 
          conversation_state: state,
          last_active: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      return !error;
    } catch (error) {
      logger.error('Failed to store conversation state:', error);
      return false;
    }
  }

  /**
   * Get user conversation state
   * @param {number} telegramId - Telegram user ID
   * @returns {Object|null} Conversation state
   */
  async getConversationState(telegramId) {
    try {
      const { data, error } = await this.client
        .from('telegram_accounts')
        .select('conversation_state')
        .eq('telegram_id', telegramId)
        .single();

      if (error || !data) return null;
      return data.conversation_state || {};
    } catch (error) {
      logger.error('Failed to get conversation state:', error);
      return null;
    }
  }
}

module.exports = new SupabaseService();