'use client'

import { Bot, FileText, Calendar, Zap, MessageSquare, BarChart3, Shield, Globe, ArrowRight, Sparkles, CheckCircle, Users, TrendingUp } from 'lucide-react'
import { Badge } from './ui/badge'
import { useState, useEffect } from 'react'

const features = [
  {
    icon: MessageSquare,
    title: "Telegram-First Experience",
    description: "Chat naturally with your AI assistant. No apps to install, no complex interfaces - just message your bot.",
    benefits: ["Instant responses", "Mobile-native", "Always accessible"],
    gradient: "from-blue-500 to-cyan-500",
    color: "blue",
    stats: { value: "2.3s", label: "Avg Response Time" }
  },
  {
    icon: FileText,
    title: "Intelligent Document Processing",
    description: "Upload PDFs, images, or documents and get instant analysis, summaries, and actionable insights.",
    benefits: ["OCR technology", "Multi-format support", "Smart extraction"],
    gradient: "from-purple-500 to-pink-500",
    color: "purple",
    stats: { value: "50+", label: "File Formats" }
  },
  {
    icon: Calendar,
    title: "Smart Task Scheduling",
    description: "AI understands your preferences and schedules tasks, reminders, and workflows automatically.",
    benefits: ["Natural language", "Context-aware", "Auto-optimization"],
    gradient: "from-green-500 to-emerald-500",
    color: "green",
    stats: { value: "24/7", label: "Availability" }
  },
  {
    icon: Zap,
    title: "100+ API Integrations",
    description: "Connect your favorite tools and services. From Gmail to Notion, Slack to Salesforce.",
    benefits: ["Pre-built connectors", "Custom webhooks", "Real-time sync"],
    gradient: "from-yellow-500 to-orange-500",
    color: "yellow",
    stats: { value: "100+", label: "Integrations" }
  },
  {
    icon: BarChart3,
    title: "Usage Analytics & Insights",
    description: "Track your automation performance, cost savings, and productivity gains with detailed analytics.",
    benefits: ["Cost tracking", "Performance metrics", "ROI analysis"],
    gradient: "from-indigo-500 to-purple-500",
    color: "indigo",
    stats: { value: "40%", label: "Time Saved" }
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "SOC 2 compliant with end-to-end encryption. Your data stays private and secure.",
    benefits: ["End-to-end encryption", "SOC 2 certified", "GDPR compliant"],
    gradient: "from-red-500 to-rose-500",
    color: "red",
    stats: { value: "99.9%", label: "Uptime" }
  }
]

export default function FeatureShowcase() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('features-section')
    if (element) {
      observer.observe(element)
    }

    // Auto-rotate active feature
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 4000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <section id="features-section" className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Enhanced section header with animation */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:scale-105 transition-transform duration-300">
            <Globe className="w-4 h-4 mr-2" />
            Powerful Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything you need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient">
              automate smarter
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Built for modern businesses that want to move fast without breaking things. 
            Your AI assistant handles the complexity while you focus on what matters.
          </p>
        </div>

        {/* Enhanced features grid with staggered animation */}
        <div className="grid lg:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-200 hover:border-gray-300 transition-all duration-700 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-2 ${
                hoveredFeature === index ? 'scale-105' : 'scale-100'
              } transition-all duration-300 ${
                activeFeature === index ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(50px)'
              }}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Enhanced gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-700`} />
              
              {/* Floating sparkles effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-1 h-1 bg-${feature.color}-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700`}
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${20 + i * 20}%`,
                      animationDelay: `${i * 200}ms`,
                      animation: 'float 3s ease-in-out infinite'
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10">
                {/* Enhanced icon with better hover effects */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl ${
                  activeFeature === index ? 'animate-pulse' : ''
                }`}>
                  <feature.icon className="w-8 h-8" />
                </div>

                {/* Enhanced content with better typography */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Enhanced benefits with better visual hierarchy */}
                <div className="space-y-3 mb-6">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient} mr-3 group-hover:scale-125 transition-transform duration-300`} />
                      {benefit}
                    </div>
                  ))}
                </div>

                {/* Stats badge */}
                <div className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 mb-4 group-hover:bg-gray-100 transition-colors duration-300">
                  <span className="text-lg font-bold text-gray-900">{feature.stats.value}</span>
                  <span className="text-sm text-gray-600">{feature.stats.label}</span>
                </div>

                {/* Hover reveal arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                  <ArrowRight className={`w-5 h-5 text-${feature.color}-500`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced bottom CTA with better design */}
        <div className={`text-center mt-20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center justify-center space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full py-6 px-8 border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <Bot className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-gray-700 font-medium group-hover:text-gray-800 transition-colors duration-300">
              Ready to experience the future of automation?
            </span>
            <Sparkles className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </div>
        </div>
      </div>
    </section>
  )
}