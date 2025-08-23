const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabaseService = require('../services/supabase.service');
const jwtUtil = require('../utils/jwt.util');
const { paymentRateLimit } = require('../middleware/rate-limit.middleware');
const logger = require('../utils/logger');

/**
 * Create Stripe checkout session
 * POST /api/payment/create-session
 */
router.post('/create-session', paymentRateLimit, async (req, res) => {
  try {
    const { 
      tier = 'pro', 
      userId, 
      telegramId, 
      email, 
      successUrl, 
      cancelUrl 
    } = req.body;

    if (!userId && !telegramId) {
      return res.status(400).json({
        error: 'User ID or Telegram ID required',
        message: 'Either userId (web flow) or telegramId (Telegram flow) must be provided'
      });
    }

    // Tier pricing
    const tierPricing = {
      pro: {
        amount: 1900, // $19.00 in cents
        name: 'Pro Plan',
        description: '1,000 automation credits per month'
      },
      enterprise: {
        amount: 9900, // $99.00 in cents
        name: 'Enterprise Plan',  
        description: '10,000+ automation credits per month'
      }
    };

    const pricing = tierPricing[tier];
    if (!pricing) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: 'Tier must be either "pro" or "enterprise"'
      });
    }

    // Create Stripe checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pricing.name,
              description: pricing.description,
            },
            unit_amount: pricing.amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        tier,
        ...(userId && { userId }),
        ...(telegramId && { telegramId: telegramId.toString() }),
        ...(email && { email })
      }
    };

    // Add customer email if provided
    if (email) {
      sessionConfig.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Store payment session for tracking
    if (telegramId) {
      await supabaseService.adminClient
        .from('payment_sessions')
        .insert({
          telegram_id: telegramId,
          user_id: userId,
          session_token: session.id,
          tier,
          amount: pricing.amount / 100, // Convert to dollars
          status: 'pending',
          stripe_session_id: session.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
    }

    logger.info('Stripe checkout session created', {
      sessionId: session.id,
      tier,
      amount: pricing.amount,
      userId,
      telegramId
    });

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      tier,
      amount: pricing.amount / 100
    });

  } catch (error) {
    logger.error('Failed to create checkout session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment session',
      message: error.message
    });
  }
});

/**
 * Stripe webhook handler
 * POST /api/payment/stripe-webhook
 */
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  logger.info('Checkout session completed', {
    sessionId: session.id,
    metadata: session.metadata
  });

  const { userId, telegramId, tier, email } = session.metadata;

  try {
    if (telegramId) {
      // Telegram-first flow
      await activateTelegramUser(parseInt(telegramId), tier, session);
      
      // Send activation message via Telegram
      if (process.env.TELEGRAM_BOT_TOKEN) {
        await sendTelegramActivationMessage(parseInt(telegramId), tier);
      }
    } else if (userId) {
      // Web-first flow
      await activateWebUser(userId, tier, session);
      
      // Send activation email with Telegram deep link
      await sendActivationEmail(email || session.customer_email, userId, tier);
    }

    // Update payment session status
    await supabaseService.adminClient
      .from('payment_sessions')
      .update({ status: 'completed' })
      .eq('stripe_session_id', session.id);

  } catch (error) {
    logger.error('Failed to handle checkout completion', error);
    throw error;
  }
}

/**
 * Activate Telegram user after payment
 */
async function activateTelegramUser(telegramId, tier, session) {
  try {
    // Create user account
    const { data: user, error: userError } = await supabaseService.adminClient
      .from('users')
      .insert({
        email: session.customer_email || `telegram_${telegramId}@temp.com`,
        name: `Telegram User ${telegramId}`,
        tier: tier,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      })
      .select()
      .single();

    if (userError) throw userError;

    // Link Telegram account
    await supabaseService.adminClient
      .from('telegram_accounts')
      .insert({
        user_id: user.id,
        telegram_id: telegramId,
        activated_at: new Date().toISOString(),
        activation_method: 'telegram_to_web'
      });

    // Initialize user credits
    await supabaseService.initializeUserCredits(user.id, tier);

    logger.info('Telegram user activated', {
      userId: user.id,
      telegramId,
      tier
    });

    return user;
  } catch (error) {
    logger.error('Failed to activate Telegram user', error);
    throw error;
  }
}

/**
 * Activate web user after payment
 */
async function activateWebUser(userId, tier, session) {
  try {
    // Update user with payment info
    const { error: updateError } = await supabaseService.adminClient
      .from('users')
      .update({
        tier: tier,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Initialize user credits
    await supabaseService.initializeUserCredits(userId, tier);

    // Generate activation token for Telegram linking
    const activationToken = jwtUtil.generateDeepLinkToken();
    await supabaseService.storeActivationToken(userId, activationToken);

    logger.info('Web user activated', {
      userId,
      tier,
      activationToken
    });

    return { userId, activationToken };
  } catch (error) {
    logger.error('Failed to activate web user', error);
    throw error;
  }
}

/**
 * Send Telegram activation message
 */
async function sendTelegramActivationMessage(telegramId, tier) {
  try {
    const { Telegraf } = require('telegraf');
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    const message = `🎉 *Account Activated!*\n\nWelcome to your ${tier.toUpperCase()} plan! You now have access to all automation features.\n\n*Try these commands:*\n• "Monitor competitor prices for iPhone"\n• "Track social media mentions of my brand"\n• "Process this document"\n• "Get latest AI news"\n\nNeed help? Type /help`;

    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'Markdown'
    });

    logger.info('Activation message sent', { telegramId, tier });
  } catch (error) {
    logger.error('Failed to send Telegram message', error);
  }
}

/**
 * Send activation email with deep link
 */
async function sendActivationEmail(email, userId, tier) {
  try {
    const activationToken = jwtUtil.generateDeepLinkToken();
    await supabaseService.storeActivationToken(userId, activationToken);

    const deepLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${activationToken}`;
    
    // TODO: Implement email sending (using SendGrid, AWS SES, etc.)
    logger.info('Activation email should be sent', {
      email,
      userId,
      tier,
      deepLink
    });

    // For now, just log the deep link
    console.log(`Activation deep link for ${email}: ${deepLink}`);

  } catch (error) {
    logger.error('Failed to send activation email', error);
  }
}

/**
 * Handle subscription events
 */
async function handleSubscriptionCreated(subscription) {
  logger.info('Subscription created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });
}

async function handleSubscriptionUpdated(subscription) {
  logger.info('Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status
  });

  // Handle subscription changes (upgrade/downgrade)
  if (subscription.status === 'active') {
    // Update user tier based on subscription
    // TODO: Implement tier updates based on subscription changes
  }
}

async function handleSubscriptionDeleted(subscription) {
  logger.info('Subscription cancelled', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  try {
    // Downgrade user to free tier
    const { error } = await supabaseService.adminClient
      .from('users')
      .update({ tier: 'free' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) throw error;

    // Reset credits to free tier
    const { data: user } = await supabaseService.adminClient
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (user) {
      await supabaseService.initializeUserCredits(user.id, 'free');
    }

  } catch (error) {
    logger.error('Failed to handle subscription deletion', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  logger.info('Payment succeeded', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid
  });

  // Reset monthly credits on successful payment
  try {
    const { data: user } = await supabaseService.adminClient
      .from('users')
      .select('id, tier')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (user) {
      await supabaseService.adminClient
        .from('user_credits')
        .update({
          used_credits: 0,
          reset_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
        })
        .eq('user_id', user.id);
    }
  } catch (error) {
    logger.error('Failed to reset credits on payment', error);
  }
}

async function handlePaymentFailed(invoice) {
  logger.warn('Payment failed', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_due
  });

  // TODO: Handle payment failures (notify user, suspend service, etc.)
}

/**
 * Get payment session status
 * GET /api/payment/session/:sessionId
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        metadata: session.metadata
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve payment session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment session'
    });
  }
});

module.exports = router;