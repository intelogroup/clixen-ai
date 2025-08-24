'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { User } from '@supabase/supabase-js'
import { Check, X, Zap, Rocket, Crown, Shield, Clock, Users, Sparkles } from 'lucide-react'
import Script from 'next/script'
import GlobalNavigation from '../../components/GlobalNavigation'

interface PricingPlan {
  id: string
  name: string
  price: number
  buyButtonId: string // Stripe Buy Button ID
  credits: number
  features: string[]
  notIncluded?: string[]
  popular?: boolean
  icon: any
  description: string
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    buyButtonId: 'buy_btn_1RzL6Z010OCMBFJxIB7eDVt3', // Replace with your actual Starter buy button ID
    credits: 100,
    icon: Zap,
    description: 'Perfect for trying out automation',
    features: [
      '100 automation credits/month',
      'Access to Telegram bot',
      'Basic templates',
      'Email support',
      '7-day free trial'
    ],
    notIncluded: [
      'Priority support',
      'Custom workflows',
      'Advanced integrations'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29,
    buyButtonId: 'buy_btn_1RzL6Z010OCMBFJxIB7eDVt3', // This is your current buy button
    credits: 500,
    icon: Rocket,
    description: 'Best for growing businesses',
    popular: true,
    features: [
      '500 automation credits/month',
      'Access to Telegram bot',
      'All templates',
      'Priority support',
      'Custom workflows',
      'Advanced integrations',
      'Analytics dashboard'
    ],
    notIncluded: [
      'Dedicated support',
      'White-label options'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    buyButtonId: 'buy_btn_enterprise_replace', // Replace with your actual Enterprise buy button ID
    credits: 2000,
    icon: Crown,
    description: 'For large-scale automation',
    features: [
      '2000 automation credits/month',
      'Access to Telegram bot',
      'All templates',
      'Dedicated support',
      'Custom workflows',
      'Advanced integrations',
      'Analytics dashboard',
      'White-label options',
      'API access',
      'Team management'
    ]
  }
]

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      console.log('💳 [SUBSCRIPTION] No user found, redirecting to auth')
      router.push('/?auth=true&redirect=/subscription')
      return
    }

    console.log('💳 [SUBSCRIPTION] User authenticated:', user.email)
    setLoading(false)
  }, [user, authLoading, router])

  const handleStripeLoad = () => {
    console.log('💳 [SUBSCRIPTION] Stripe Buy Button script loaded')
    setStripeLoaded(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Load Stripe Buy Button Script */}
      <Script
        src="https://js.stripe.com/v3/buy-button.js"
        onLoad={handleStripeLoad}
      />

      <div className="min-h-screen bg-gray-50">
        <GlobalNavigation user={user} />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Limited Time - First Month 50% OFF
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Choose Your Automation Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start automating your business workflows with our AI-powered Telegram bot. 
              No coding required.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-purple-600" />
              <span>2000+ Happy Users</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'ring-2 ring-blue-500 scale-105' 
                    : 'hover:scale-102'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                      plan.id === 'starter' ? 'bg-green-100' :
                      plan.id === 'professional' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <plan.icon className={`w-6 h-6 ${
                        plan.id === 'starter' ? 'text-green-600' :
                        plan.id === 'professional' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{plan.credits} credits/month</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded?.map((feature, index) => (
                      <div key={index} className="flex items-start opacity-50">
                        <X className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stripe Buy Button */}
                  <div className="text-center">
                    {stripeLoaded ? (
                      <stripe-buy-button
                        buy-button-id={plan.buyButtonId}
                        publishable-key="pk_test_51Qpb3I010OCMBFJxSyiNrUtC88p5ikKlyRZWoPJN4o8CAMWBdBBO3EzwNQm20uv1KR6Z47Eotb29r3VCg61mZ2f200KQ8LK6FF"
                      />
                    ) : (
                      <div className="h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="animate-pulse text-gray-500">Loading payment...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">What are automation credits?</h3>
                <p className="text-gray-600">Credits are used for each automation task performed by your bot. One credit = one workflow execution.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time from your dashboard. No questions asked.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">How do I access the Telegram bot?</h3>
                <p className="text-gray-600">After subscribing, you'll get immediate access to @clixen_bot with your personalized setup.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">The Starter plan includes a 7-day free trial. Professional and Enterprise plans offer 30-day money-back guarantee.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}