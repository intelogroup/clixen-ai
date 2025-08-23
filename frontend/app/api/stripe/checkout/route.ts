import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripe, PRICING_CONFIG } from '@/lib/stripe'
import { logApiError, logPaymentError } from '@/lib/sentry'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  console.log('🚀 [STRIPE CHECKOUT] Starting checkout session creation')
  
  try {
    // Verify user authentication
    console.log('🔐 [STRIPE CHECKOUT] Verifying user authentication')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ [STRIPE CHECKOUT] Authentication failed:', authError)
      logPaymentError('authentication', authError || 'No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [STRIPE CHECKOUT] User authenticated:', user.id)
    
    const body = await request.json()
    const { priceId, planId } = body
    console.log('📋 [STRIPE CHECKOUT] Request data:', { priceId, planId, userId: user.id })
    
    // Validate plan exists
    const plan = Object.values(PRICING_CONFIG).find(p => p.id === planId)
    if (!plan) {
      console.error('❌ [STRIPE CHECKOUT] Invalid plan ID:', planId)
      logPaymentError('validation', `Invalid plan ID: ${planId}`, user.id, planId)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    console.log('✅ [STRIPE CHECKOUT] Plan validated:', plan.name)

    // Get or create Stripe customer
    let stripeCustomerId: string
    
    console.log('👤 [STRIPE CHECKOUT] Getting user profile for customer ID')
    // Check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [STRIPE CHECKOUT] Profile fetch error:', profileError)
      logPaymentError('profile_fetch', profileError, user.id, planId)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id
      console.log('✅ [STRIPE CHECKOUT] Existing customer found:', stripeCustomerId.slice(0, 20) + '...')
    } else {
      console.log('🆕 [STRIPE CHECKOUT] Creating new Stripe customer')
      try {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        
        stripeCustomerId = customer.id
        console.log('✅ [STRIPE CHECKOUT] New customer created:', stripeCustomerId.slice(0, 20) + '...')
        
        // Save customer ID to database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', user.id)
          
        if (updateError) {
          console.error('⚠️ [STRIPE CHECKOUT] Customer ID save error:', updateError)
          logPaymentError('customer_save', updateError, user.id, planId)
        }
      } catch (customerError) {
        console.error('❌ [STRIPE CHECKOUT] Customer creation error:', customerError)
        logPaymentError('customer_creation', customerError, user.id, planId)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }
    }

    // Create Stripe checkout session
    console.log('💳 [STRIPE CHECKOUT] Creating checkout session')
    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?canceled=true`,
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            plan_id: planId,
          },
        },
      })

      console.log('✅ [STRIPE CHECKOUT] Session created successfully:', session.id)
      return NextResponse.json({ sessionId: session.id })
    } catch (sessionError) {
      console.error('❌ [STRIPE CHECKOUT] Session creation error:', sessionError)
      logPaymentError('session_creation', sessionError, user.id, planId)
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ [STRIPE CHECKOUT] Unexpected error:', error)
    logApiError('/api/stripe/checkout', error, request)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}