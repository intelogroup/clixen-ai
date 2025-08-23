'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import ModernHero from '../components/ModernHero'
import FeatureShowcase from '../components/FeatureShowcase'
import HowItWorks from '../components/HowItWorks'
import PricingSection from '../components/PricingSection'
import AuthModal from '../components/AuthModal'
import { Sparkles, ArrowRight, CheckCircle, Users, TrendingUp, Shield, Globe, MessageCircle, Zap, Bot, ArrowUp, Menu, X } from 'lucide-react'

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Memoize event handlers to prevent unnecessary re-renders
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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  // Memoize scroll handler to prevent recreation on every render
  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > 500)
  }, [])

  // Memoize anchor click handler
  const handleAnchorClick = useCallback((e: Event) => {
    const target = e.target as HTMLAnchorElement
    if (target.hash) {
      e.preventDefault()
      const element = document.querySelector(target.hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  // Memoize intersection observer callback
  const handleIntersection = useCallback(([entry]: IntersectionObserverEntry[]) => {
    if (entry.isIntersecting) {
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    
    // Intersection observer for final CTA section
    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.1 })

    const ctaElement = document.getElementById('final-cta')
    if (ctaElement) {
      observer.observe(ctaElement)
    }

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('click', handleAnchorClick)
    
    return () => {
      document.removeEventListener('click', handleAnchorClick)
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [handleScroll, handleAnchorClick, handleIntersection])

  if (!mounted) {
    return null // Prevent hydration issues
  }

  return (
    <main className="min-h-screen">
      
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Clixen AI</span>
                <p className="text-xs text-gray-500 -mt-1">Automation Platform</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="nav-link text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300">
                Features
              </a>
              <a href="#how-it-works" className="nav-link text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300">
                How It Works
              </a>
              <a href="#pricing" className="nav-link text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300">
                Pricing
              </a>
              <button
                onClick={handleSignIn}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300 hover:scale-105 transform"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="btn-glow px-6 py-3 rounded-xl font-semibold"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 transform"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-gray-200 bg-white/95 backdrop-blur-xl rounded-b-2xl shadow-xl">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300 hover:translate-x-2 transform">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300 hover:translate-x-2 transform">How It Works</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300 hover:translate-x-2 transform">Pricing</a>
                <button
                  onClick={handleSignIn}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-300 hover:translate-x-2 transform text-left"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="btn-glow px-6 py-3 rounded-xl font-semibold text-left"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Hero Section */}
      <ModernHero 
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
      />
      
      {/* Feature Showcase */}
      <FeatureShowcase />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Pricing Section */}
      <PricingSection 
        onGetStarted={handleGetStarted}
      />
      
      {/* Enhanced Final CTA Section */}
      <section id="final-cta" className="py-32 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className={`text-5xl lg:text-6xl font-bold text-white mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Ready to automate your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient mt-2">
              business with AI?
            </span>
          </h2>
          <p className={`text-xl lg:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Join 2,000+ entrepreneurs who've automated 50,000+ tasks and saved countless hours every month.
          </p>
          
          {/* Enhanced social proof with icons */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { icon: Users, number: "2,000+", label: "Active Users", description: "Growing community" },
              { icon: Zap, number: "50K+", label: "Tasks Automated", description: "Every month" },
              { icon: Bot, number: "24/7", label: "AI Support", description: "Always available" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 group-hover:bg-white/20 transition-all duration-500 group-hover:scale-110">
                  <stat.icon className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-lg text-gray-300 mb-1 group-hover:text-white transition-colors duration-300 font-medium">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={handleGetStarted}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-5 px-10 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 border-0 min-w-[280px]"
            >
              <span className="relative z-10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Start Your Free Account
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl scale-150 group-hover:scale-100" />
            </button>
            
            {/* Enhanced value proposition */}
            <div className="text-sm text-gray-400 flex items-center bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">100 credits included • No credit card required</span>
            </div>
          </div>

          {/* Enhanced trust indicators */}
          <div className={`transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex flex-col items-center space-y-6 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center space-x-3 text-blue-300 mb-2">
                <Shield className="w-6 h-6" />
                <span className="text-xl font-semibold">Trusted & Secure</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-300">
                {[
                  { icon: Users, text: "2,000+ Active Users", color: "blue" },
                  { icon: TrendingUp, text: "Growing 20% Monthly", color: "green" },
                  { icon: Shield, text: "SOC 2 Compliant", color: "purple" }
                ].map((item, index) => (
                  <div key={item.text} className="flex items-center space-x-3 group/item hover:opacity-100 transition-opacity duration-300">
                    <item.icon className={`w-5 h-5 text-${item.color}-400 group-hover/item:scale-110 transition-transform duration-300`} />
                    <span className="text-sm font-medium text-gray-400 group-hover/item:text-gray-300 transition-colors duration-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Clixen AI</h3>
                  <p className="text-sm text-gray-400 -mt-1">Automation Platform</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed text-lg">
                Your AI automation assistant that connects to Telegram and automates 
                your business workflows with the power of artificial intelligence.
              </p>
              <div className="flex space-x-6">
                {[
                  { name: "Twitter", href: "#", icon: "🐦" },
                  { name: "LinkedIn", href: "#", icon: "💼" },
                  { name: "GitHub", href: "#", icon: "💻" }
                ].map((social) => (
                  <a 
                    key={social.name}
                    href={social.href} 
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 transform group"
                  >
                    <span className="text-lg mr-2 group-hover:scale-110 transition-transform duration-300">{social.icon}</span>
                    {social.name}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white text-lg">Product</h4>
              <div className="space-y-3">
                {[
                  { name: "Features", href: "#features" },
                  { name: "Pricing", href: "#pricing" },
                  { name: "API Docs", href: "#" },
                  { name: "Integrations", href: "#" }
                ].map((link) => (
                  <a 
                    key={link.name}
                    href={link.href} 
                    className="block text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-2 transform group"
                  >
                    <span className="group-hover:text-blue-400 transition-colors duration-300">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white text-lg">Support</h4>
              <div className="space-y-3">
                {[
                  { name: "Help Center", href: "#" },
                  { name: "Contact Us", href: "#" },
                  { name: "Community", href: "#" },
                  { name: "Status", href: "#" }
                ].map((link) => (
                  <a 
                    key={link.name}
                    href={link.href} 
                    className="block text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-2 transform group"
                  >
                    <span className="group-hover:text-blue-400 transition-colors duration-300">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Clixen AI. All rights reserved.
            </p>
            <div className="flex space-x-8 mt-6 md:mt-0">
              {[
                { name: "Privacy Policy", href: "#" },
                { name: "Terms of Service", href: "#" },
                { name: "Cookie Policy", href: "#" }
              ].map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:scale-105 transform"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={handleGetStarted}
          className="group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-5 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:shadow-blue-500/25 animate-bounce-gentle"
        >
          <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>

      {/* Enhanced Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 z-40 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:shadow-gray-500/25 group"
        >
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      )}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        mode={authMode}
        onModeChange={handleAuthModeChange}
      />
    </main>
  )
}