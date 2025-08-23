'use client'

import { ArrowRight, Bot, Zap, FileText, Calendar, CheckCircle, Sparkles, Users, TrendingUp, Star, Play, ChevronDown, MessageCircle, Globe, Shield } from 'lucide-react'
import { Badge } from './ui/badge'
import { useState, useEffect } from 'react'

interface ModernHeroProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export default function ModernHero({ onGetStarted, onSignIn }: ModernHeroProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentFeature, setCurrentFeature] = useState(0)

  const features = [
    { icon: FileText, title: "Document Magic", subtitle: "PDF to insights in seconds", color: "blue" },
    { icon: Calendar, title: "Smart Scheduling", subtitle: "AI-powered task planning", color: "purple" },
    { icon: Zap, title: "API Automation", subtitle: "Connect any service", color: "yellow" },
    { icon: Bot, title: "24/7 AI Agent", subtitle: "Always-on assistant", color: "green" }
  ]

  useEffect(() => {
    setIsVisible(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(progress)
    }

    // Auto-rotate features
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      clearInterval(featureInterval)
    }
  }, [features.length])

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Enhanced animated background grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      </div>

      {/* Enhanced floating orbs with mouse interaction */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
          style={{ 
            animationDuration: '4s',
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`
          }}
        />
        <div 
          className="absolute -bottom-32 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
          style={{ 
            animationDuration: '6s', 
            animationDelay: '2s',
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * -0.01}px, ${(mousePosition.y - window.innerHeight / 2) * -0.01}px)`
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
          style={{ 
            animationDuration: '8s', 
            animationDelay: '4s',
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.015}px, ${(mousePosition.y - window.innerHeight / 2) * 0.015}px)`
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          
          {/* Enhanced status badge with animation */}
          <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 px-6 py-3 backdrop-blur-sm text-sm font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
              🚀 Live & Processing 10,000+ Automations Daily
            </Badge>
          </div>

          {/* Enhanced main headline with staggered animation */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-none mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className={`block text-white mb-2 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Your AI
            </span>
            <span className={`block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Automation
            </span>
            <span className={`block text-white transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Assistant
            </span>
          </h1>
          
          {/* Enhanced subheadline */}
          <p className={`text-xl sm:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Connect Telegram to your personal AI that processes documents, schedules tasks, 
            and automates workflows across 100+ services. 
            <span className="text-blue-400 font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Start in 30 seconds.</span>
          </p>

          {/* Enhanced social proof numbers with staggered animation */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { number: "2,000+", label: "Active Users", icon: Users, color: "blue" },
              { number: "50K+", label: "Tasks Automated", icon: Zap, color: "green" },
              { number: "99.9%", label: "Uptime", icon: CheckCircle, color: "purple" },
              { number: "4.9/5", label: "User Rating", icon: Star, color: "yellow" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="text-3xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                  {stat.label}
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400 mx-auto`} />
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced feature highlights with auto-rotation */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className={`group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 transition-all duration-500 hover:scale-110 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/25 ${
                  currentFeature === index ? 'ring-2 ring-blue-400/50 bg-white/10' : ''
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/10 to-${feature.color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <feature.icon className={`w-8 h-8 text-${feature.color}-400 mb-3 mx-auto group-hover:scale-125 transition-transform duration-300 ${
                  currentFeature === index ? 'animate-pulse' : ''
                }`} />
                <div className="text-white font-semibold text-sm mb-1 group-hover:text-blue-200 transition-colors duration-300">{feature.title}</div>
                <div className="text-slate-400 text-xs group-hover:text-slate-300 transition-colors duration-300">{feature.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Enhanced CTA section with better buttons */}
          <div className={`mb-12 transition-all duration-1000 delay-1400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={onGetStarted}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 border-0"
              >
                <span className="relative z-10 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Start Free - 100 Credits
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl scale-150 group-hover:scale-100" />
              </button>
              
              <button
                onClick={onSignIn}
                className="group border border-white/20 text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300 backdrop-blur-sm hover:border-white/40 hover:shadow-lg hover:shadow-white/10"
              >
                <span className="flex items-center">
                  Sign In
                  <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
                </span>
              </button>
            </div>

            {/* Enhanced value proposition list */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
              {[
                "No credit card required",
                "Setup in 30 seconds", 
                "Cancel anytime"
              ].map((prop, index) => (
                <div key={prop} className="flex items-center group">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:text-white transition-colors duration-300">{prop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced trust indicators with better layout */}
          <div className={`transition-all duration-1000 delay-1600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-slate-400 mb-6 text-sm">
              Trusted by entrepreneurs, freelancers, and growing businesses
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {[
                { icon: Users, text: "2,000+ Active Users" },
                { icon: TrendingUp, text: "Growing 20% Monthly" },
                { icon: Shield, text: "SOC 2 Compliant" }
              ].map((item, index) => (
                <div key={item.text} className="flex items-center space-x-2 group hover:opacity-100 transition-opacity duration-300">
                  <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-300" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-2000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col items-center text-slate-400 animate-bounce">
              <span className="text-sm mb-2">Scroll to explore</span>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}