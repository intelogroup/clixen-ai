'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthModalSimple from '../components/AuthModalSimple'
import GlobalErrorHandler from '../components/GlobalErrorHandler'
import {
  Bot,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Cloud,
  Mail,
  FileText,
  Languages,
  Calendar,
  CloudRain,
  Sparkles,
  Users,
  Star
} from 'lucide-react'
import { getBotButtonProps, trackBotAccess, BotAccessPresets } from '../lib/telegram-utils'

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [mounted, setMounted] = useState(false)

  const handleGetStarted = useCallback(() => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }, [])

  const handleSignIn = useCallback(() => {
    setAuthMode('signin')
    setShowAuthModal(true)
  }, [])

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  const handleAuthModeChange = useCallback((mode: 'signin' | 'signup') => {
    setAuthMode(mode)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const automations = [
    {
      icon: CloudRain,
      title: "Weather Check",
      description: "Get real-time weather for any city worldwide",
      example: "\"What's the weather in Tokyo?\""
    },
    {
      icon: Mail,
      title: "Email Scanner",
      description: "Scan inbox for invoices and summarize spending",
      example: "\"Scan my emails for invoices this month\""
    },
    {
      icon: FileText,
      title: "PDF Summarizer", 
      description: "Upload and get AI-powered document summaries",
      example: "Upload a PDF and get instant insights"
    },
    {
      icon: Languages,
      title: "Text Translator",
      description: "Translate text between 100+ languages instantly",
      example: "\"Translate 'Hello' to French\""
    },
    {
      icon: Calendar,
      title: "Smart Reminders",
      description: "Set up intelligent recurring reminders",
      example: "\"Remind me to call John every Friday at 3pm\""
    }
  ]

  const features = [
    {
      icon: Shield,
      title: "Privacy First",
      description: "No message storage. Your conversations stay private."
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Pre-built workflows deliver results in seconds."
    },
    {
      icon: Bot,
      title: "AI-Powered",
      description: "Natural language commands. Just tell us what you need."
    },
    {
      icon: Cloud,
      title: "Always Available",
      description: "24/7 automation through Telegram. Works anywhere."
    }
  ]

  const pricing = [
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
      ctaText: "Start Free Trial"
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
      ctaText: "Get Started"
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
      ctaText: "Go Pro"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <GlobalErrorHandler />
      
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Clixen AI</h1>
                <p className="text-xs text-gray-500">Telegram Automation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Automation Platform</span>
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Automate Anything with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Telegram</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              No complex interfaces. Just chat with <strong>@clixen_bot</strong> on Telegram and automate your daily tasks using natural language. From weather checks to document analysis, get instant results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <a
                {...getBotButtonProps('LANDING_HERO')}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
              >
                <Bot className="w-5 h-5" />
                <span>Try @clixen_bot</span>
              </a>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Automations Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              5 Powerful Automations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pre-built workflows that work instantly. Just describe what you need in plain English.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {automations.map((automation, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <automation.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {automation.title}
                </h3>
                <p className="text-gray-600 mb-3">
                  {automation.description}
                </p>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 italic">
                    {automation.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Clixen AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for privacy, speed, and simplicity. No complex interfaces or learning curves.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees or complex tiers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <div key={index} className={`rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 relative' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
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
                  onClick={handleGetStarted}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Automate Your Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who've automated their daily tasks with Clixen AI. Start your free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <a 
              href="https://t.me/clixen_bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border-2 border-white/20 hover:border-white/40 flex items-center justify-center space-x-2"
            >
              <Bot className="w-5 h-5" />
              <span>Try @clixen_bot</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Clixen AI</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The simplest way to automate your daily tasks through Telegram. No complex interfaces, just natural conversation.
              </p>
              <div className="flex items-center space-x-4">
                <a href="https://t.me/clixen_bot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                  @clixen_bot
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#automations" className="hover:text-white transition-colors">Automations</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="mailto:support@clixen.app" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="mailto:support@clixen.app" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Clixen AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModalSimple
          isOpen={showAuthModal}
          onClose={handleCloseAuthModal}
          mode={authMode}
          onModeChange={handleAuthModeChange}
        />
      )}
    </div>
  )
}
