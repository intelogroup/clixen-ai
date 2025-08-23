'use client'

import { MessageCircle, Bot, Zap, CheckCircle, ArrowRight, Sparkles, Clock, Rocket } from 'lucide-react'
import { Badge } from './ui/badge'
import { useState, useEffect } from 'react'

const steps = [
  {
    step: 1,
    icon: MessageCircle,
    title: "Connect Telegram",
    description: "Click a link, start chatting with your personal AI assistant. No downloads, no setup.",
    time: "30 seconds",
    color: "blue",
    details: ["One-click connection", "Instant activation", "No technical setup required"],
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    step: 2, 
    icon: Bot,
    title: "Chat Naturally",
    description: "Tell your AI what you want to automate using plain English. It understands context and intent.",
    time: "1 minute",
    color: "purple", 
    details: ["Natural language processing", "Context-aware responses", "Smart suggestions"],
    gradient: "from-purple-500 to-pink-500"
  },
  {
    step: 3,
    icon: Zap,
    title: "Watch It Work",
    description: "Your automation runs in the background. Get real-time updates and results directly in Telegram.",
    time: "Ongoing",
    color: "green",
    details: ["Background processing", "Real-time notifications", "Detailed progress updates"],
    gradient: "from-green-500 to-emerald-500"
  }
]

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Start step animation sequence
          const timer = setTimeout(() => {
            setActiveStep(1)
          }, 500)
          const timer2 = setTimeout(() => {
            setActiveStep(2)
          }, 1000)
          const timer3 = setTimeout(() => {
            setActiveStep(3)
          }, 1500)
          
          return () => {
            clearTimeout(timer)
            clearTimeout(timer2)
            clearTimeout(timer3)
          }
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('how-it-works')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      
      {/* Enhanced background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Enhanced section header with animation */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Badge variant="secondary" className="mb-4 bg-blue-500/10 text-blue-300 border-blue-500/20 hover:scale-105 transition-transform duration-300">
            <CheckCircle className="w-4 h-4 mr-2" />
            Simple Process
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            From zero to automated
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient">
              in under 2 minutes
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            No complex setups, no learning curves. Just chat with your AI and watch your business automate itself.
          </p>
        </div>

        {/* Enhanced steps with better animations */}
        <div className="relative">
          {/* Enhanced connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/40 to-green-500/20 transform -translate-y-1/2 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-full opacity-0 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div key={step.step} className="group relative">
                
                {/* Enhanced step card with better hover effects */}
                <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 transition-all duration-700 hover:bg-white/10 hover:scale-105 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/25 ${
                  activeStep >= step.step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 300}ms` }}
                >
                  
                  {/* Enhanced step number and icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`
                      inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-xl font-bold shadow-lg
                      bg-gradient-to-br ${step.gradient}
                      group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
                    `}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20 group-hover:bg-white/20 transition-colors duration-300">
                      <Clock className="w-3 h-3 mr-1" />
                      {step.time}
                    </Badge>
                  </div>

                  {/* Enhanced content with better typography */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <span className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3
                        bg-gradient-to-br ${step.gradient} text-white
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        {step.step}
                      </span>
                      <h3 className="text-2xl font-bold text-white group-hover:text-gray-100 transition-colors duration-300">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300">
                      {step.description}
                    </p>
                  </div>

                  {/* Enhanced details with better visual hierarchy */}
                  <div className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        <CheckCircle className={`
                          w-4 h-4 mr-3 text-${step.color}-400
                          group-hover:scale-110 transition-transform duration-300
                        `} />
                        {detail}
                      </div>
                    ))}
                  </div>

                  {/* Hover reveal sparkles */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Sparkles className="w-5 h-5 text-white/60" />
                  </div>
                </div>

                {/* Enhanced arrow between steps (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="relative">
                      <ArrowRight className="w-8 h-8 text-white/30 group-hover:text-white/60 transition-colors duration-300" />
                      <div className="absolute inset-0 w-8 h-8 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-0 group-hover:scale-100" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced bottom section with better metrics */}
        <div className={`text-center mt-20 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex flex-col items-center space-y-6 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <div className="flex items-center space-x-2 text-blue-300 mb-2">
              <Rocket className="w-5 h-5" />
              <span className="text-lg font-semibold">Performance Metrics</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Clock, text: "Average setup time: 90 seconds", value: "90s" },
                { icon: Zap, text: "First automation running: 2 minutes", value: "2m" },
                { icon: CheckCircle, text: "ROI visible: Same day", value: "24h" }
              ].map((metric, index) => (
                <div key={metric.text} className="text-center group">
                  <div className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                    {metric.value}
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                    <metric.icon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{metric.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}