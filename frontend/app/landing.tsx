'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthModalSimple from '../components/AuthModalSimple'
import GlobalErrorHandler from '../components/GlobalErrorHandler'
import { Bot, Check } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalErrorHandler />
      
      {/* Simple Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Clixen AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignIn}
                className="text-gray-700 hover:text-gray-900"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Workflow Automation
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Automate your business tasks with AI. Document analysis, scheduling, API integrations via Telegram bot.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleGetStarted}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
            >
              Start Building Today
            </button>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Automation</h3>
              <p className="text-gray-600">Smart workflow automation powered by artificial intelligence.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Setup</h3>
              <p className="text-gray-600">Get started in minutes with our Telegram bot interface.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Continuous automation with reliable uptime and support.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">$9<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• 1,000 executions/month</li>
                <li>• Basic workflows</li>
                <li>• Email support</li>
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg hover:bg-gray-200"
              >
                Get Started
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">$29<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• 10,000 executions/month</li>
                <li>• Advanced workflows</li>
                <li>• Priority support</li>
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Get Started
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">$99<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Unlimited executions</li>
                <li>• Custom workflows</li>
                <li>• Dedicated support</li>
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg hover:bg-gray-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Clixen AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModalSimple
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        mode={authMode}
        onModeChange={handleAuthModeChange}
      />
    </div>
  )
}