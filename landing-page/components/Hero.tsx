'use client'

import { useState } from 'react'
import { ArrowRight, Bot, Zap, FileText, Calendar } from 'lucide-react'
import AuthModal from './AuthModal'

export default function Hero() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 left-1/3 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container-padding max-w-7xl mx-auto">
        <div className="text-center">
          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            Automate Your Business{' '}
            <span className="text-gradient">
              with AI Power
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
            Transform documents into insights, schedule tasks intelligently, and connect 100+ services. 
            Start automating in minutes, not hours.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md">
              <FileText className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium">Document Analysis</span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md">
              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium">Smart Scheduling</span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md">
              <Zap className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium">API Automation</span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md">
              <Bot className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary flex items-center text-lg px-8 py-4 group"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a
              href="#how-it-works"
              className="btn-secondary flex items-center text-lg px-8 py-4"
            >
              See How It Works
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-gray-500 mb-4">
              Join thousands of businesses automating with AI
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-sm font-semibold text-gray-400">100+ API Integrations</div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="text-sm font-semibold text-gray-400">99.9% Uptime</div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="text-sm font-semibold text-gray-400">SOC 2 Compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </section>
  )
}