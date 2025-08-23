import Stripe from 'stripe'
import { loadStripe, Stripe as StripeJs } from '@stripe/stripe-js'

// Initialize Stripe (server-side)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

// Initialize Stripe (client-side)
let stripePromise: Promise<StripeJs | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Pricing configuration
export const PRICING_CONFIG = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    credits: 100,
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_test',
    features: [
      '100 automation credits/month',
      'Access to Telegram bot',
      'Basic templates',
      'Email support',
      'Usage analytics'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 29,
    credits: 500,
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_test',
    popular: true,
    features: [
      '500 automation credits/month',
      'Access to Telegram bot',
      'All templates included',
      'Priority email support',
      'Advanced analytics',
      'Custom workflows',
      'Webhook integrations',
      'Export data'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    credits: 2000,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_test',
    features: [
      '2000 automation credits/month',
      'Access to Telegram bot',
      'All templates + custom',
      'Dedicated support',
      'Advanced analytics',
      'Custom workflows',
      'API access',
      'White-label options',
      'Priority processing',
      'SLA guarantee'
    ]
  }
}