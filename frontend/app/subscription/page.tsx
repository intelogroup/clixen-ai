'use client'

import { useRouter } from 'next/navigation'
import { CreditCard, ArrowLeft, AlertCircle, Check, Star, Zap, Users, Shield } from 'lucide-react'

export default function Subscription() {
  const router = useRouter()

  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      period: "7 days",
      credits: "50 automations",
      features: [
        "All automation features",
        "Telegram bot access",
        "Email support",
        "No credit card required"
      ],
      popular: false,
      ctaText: "Current Plan",
      current: true
    },
    {
      name: "Starter",
      price: "$9",
      period: "per month",
      credits: "1,000 automations",
      features: [
        "All automation features",
        "Priority support",
        "Advanced analytics",
        "Custom workflows"
      ],
      popular: true,
      ctaText: "Upgrade to Starter",
      current: false
    },
    {
      name: "Pro",
      price: "$49",
      period: "per month", 
      credits: "Unlimited automations",
      features: [
        "Everything in Starter",
        "Priority queue",
        "Premium support",
        "Early access to new features"
      ],
      popular: false,
      ctaText: "Upgrade to Pro",
      current: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <CreditCard className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Migration Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🚧 Subscription Management Temporarily Unavailable
              </h3>
              <p className="text-blue-800 mb-4">
                We're setting up payment processing with our new authentication system. 
                Subscription upgrades will be available once the migration is complete!
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan Status</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Free Trial Active</h3>
                  <p className="text-sm text-green-700">5 days remaining</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">12/50</p>
                <p className="text-sm text-green-700">Credits used</p>
              </div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '24%' }}></div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-lg text-gray-600">
              Upgrade when ready to unlock unlimited automation potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`rounded-2xl p-8 relative ${
                plan.current
                  ? 'bg-green-50 border-2 border-green-200'
                  : plan.popular 
                  ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200' 
                  : 'bg-white border border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                {plan.current && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Current Plan
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-blue-600 font-medium">{plan.credits}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  disabled={!plan.current}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    plan.current
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : plan.popular
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {plan.current ? plan.ctaText : `${plan.ctaText} (Coming Soon)`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">What You Get</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Powerful Automations</h4>
              <p className="text-sm text-gray-600">
                Weather checks, email scanning, document analysis, translations, and smart reminders
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
              <p className="text-sm text-gray-600">
                Get help when you need it with our responsive support team
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Privacy First</h4>
              <p className="text-sm text-gray-600">
                Your data stays private. We don't store your messages or personal information
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
