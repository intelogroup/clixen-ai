import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key for webhook handlers
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎯 [WEBHOOK] Processing checkout completion')
  
  // For Buy Buttons, we need to use customer email to find the user
  if (!session.customer_email) {
    console.error('❌ [WEBHOOK] No customer email in checkout session')
    return
  }

  console.log('📧 [WEBHOOK] Customer email:', session.customer_email)
  
  // Determine plan based on amount (Buy Button doesn't pass metadata)
  const amount = session.amount_total || 0
  let planId = 'pro' // Default to pro
  let credits = 500
  
  if (amount === 900) { // $9.00 in cents
    planId = 'starter'
    credits = 100
  } else if (amount === 2900) { // $29.00 in cents  
    planId = 'pro'
    credits = 500
  } else if (amount === 9900) { // $99.00 in cents
    planId = 'enterprise'
    credits = 2000
  }

  console.log(`💰 [WEBHOOK] Amount: $${amount/100}, Plan: ${planId}, Credits: ${credits}`)

  // Update user profile using email
  const { data, error } = await supabase
    .from('profiles')
    .update({
      tier: planId,
      credits_remaining: credits,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('email', session.customer_email)
    .select()

  if (error) {
    console.error('❌ [WEBHOOK] Error updating user profile:', error)
  } else if (data && data.length > 0) {
    console.log('✅ [WEBHOOK] User upgraded successfully:', session.customer_email)
    console.log('📊 [WEBHOOK] New tier:', planId, 'Credits:', credits)
  } else {
    console.error('⚠️ [WEBHOOK] No user found with email:', session.customer_email)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id
  const planId = subscription.metadata?.plan_id

  if (!userId || !planId) return

  const planDetails = getPlanDetails(planId)
  if (!planDetails) return

  await supabase
    .from('profiles')
    .update({
      tier: planId,
      credits_remaining: planDetails.credits,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id
  const planId = subscription.metadata?.plan_id

  if (!userId) return

  const isActive = subscription.status === 'active'
  const planDetails = planId ? getPlanDetails(planId) : null

  await supabase
    .from('profiles')
    .update({
      tier: isActive && planDetails ? planId : 'free',
      credits_remaining: isActive && planDetails ? planDetails.credits : 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) return

  // Downgrade user to free tier
  await supabase
    .from('profiles')
    .update({
      tier: 'free',
      credits_remaining: 10, // Free tier gets 10 credits
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceWithSub = invoice as any
  if (!invoiceWithSub.subscription) return

  const subscription = await stripe.subscriptions.retrieve(
    invoiceWithSub.subscription as string
  )
  
  const userId = subscription.metadata?.supabase_user_id
  const planId = subscription.metadata?.plan_id

  if (!userId || !planId) return

  const planDetails = getPlanDetails(planId)
  if (!planDetails) return

  // Refill user credits on successful payment
  await supabase
    .from('profiles')
    .update({
      credits_remaining: planDetails.credits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceWithSub = invoice as any
  if (!invoiceWithSub.subscription) return

  const subscription = await stripe.subscriptions.retrieve(
    invoiceWithSub.subscription as string
  )
  
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) return

  // Could implement grace period or immediate downgrade
  console.log('Payment failed for user:', userId)
  
  // For now, just log - implement grace period logic as needed
}

function getPlanDetails(planId: string) {
  const plans = {
    starter: { credits: 100 },
    pro: { credits: 500 },
    enterprise: { credits: 2000 }
  }
  
  return plans[planId as keyof typeof plans]
}