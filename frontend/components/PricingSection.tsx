'use client'

import { CheckCircle, Zap, Crown, Sparkles, ArrowRight, X, Star, TrendingUp, Shield, Clock } from 'lucide-react'
import { Badge } from './ui/badge'
import { useState, useEffect } from 'react'

const plans = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for trying out automation",
    credits: 100,
    features: [
      "100 automation credits",
      "Basic AI assistant",
      "Document processing",
      "5 workflow templates", 
      "Telegram integration",
      "Email support"
    ],
    limitations: [
      "Limited to 5 workflows",
      "Basic AI models only",
      "Community support"
    ],
    cta: "Start Free",
    popular: false,
    gradient: "from-gray-500 to-gray-600",
    color: "gray",
    icon: Sparkles
  },
  {
    name: "Pro",
    price: 19,
    period: "month",
    description: "For growing businesses and power users",
    credits: 1000,
    features: [
      "1,000 automation credits",
      "Advanced AI models (GPT-4, Claude)",
      "Unlimited workflows",
      "Custom integrations",
      "Priority processing",
      "Advanced analytics",
      "Priority support",
      "API access"
    ],
    limitations: [],
    cta: "Start Pro Trial",
    popular: true,
    gradient: "from-blue-500 to-purple-600",
    color: "blue",
    icon: Crown
  },
  {
    name: "Enterprise",
    price: 99,
    period: "month",
    description: "For teams and high-volume automation",
    credits: 10000,
    features: [
      "10,000+ automation credits",
      "All AI models included",
      "Custom workflow builder", 
      "White-label options",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment"
    ],
    limitations: [],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-purple-600 to-pink-600",
    color: "purple",
    icon: Shield
  }
]

interface PricingSectionProps {
  onGetStarted: () => void
}

export default function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('pricing-section')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="pricing-section" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Enhanced section header with animation */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700 hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-4 h-4 mr-2" />
            Simple Pricing
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Start free, scale as you
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient">
              grow with automation
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Pay only for what you use. No hidden fees, no complex contracts. 
            Cancel anytime with one click.
          </p>
          
          {/* Enhanced credit explanation */}
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full py-3 px-6 text-sm border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">1 Credit = 1 Automation Task</span>
            <span className="text-blue-600">(document analysis, email, API call, etc.)</span>
          </div>
        </div>

        {/* Enhanced pricing cards with staggered animation */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`
                relative rounded-3xl p-8 transition-all duration-700 hover:scale-105 group cursor-pointer
                ${plan.popular 
                  ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-2xl shadow-blue-200/50 hover:shadow-blue-300/50' 
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-2xl hover:shadow-gray-200/50'
                }
                ${hoveredPlan === index ? 'scale-105' : 'scale-100'}
              `}
              style={{ 
                transitionDelay: `${index * 200}ms`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(50px)'
              }}
              onMouseEnter={() => setHoveredPlan(index)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              
              {/* Enhanced popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 shadow-lg hover:scale-105 transition-transform duration-300">
                    <Crown className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Enhanced plan header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <plan.icon className={`w-8 h-8 text-${plan.color}-500 mr-3 group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{plan.name}</h3>
                </div>
                <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors duration-300">{plan.description}</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
                  {plan.credits.toLocaleString()} credits included
                </div>
              </div>

              {/* Enhanced features with better visual hierarchy */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start group/feature">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0 group-hover/feature:scale-110 transition-transform duration-300" />
                    <span className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start mb-2 group/limit">
                        <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0 group-hover/limit:scale-110 transition-transform duration-300" />
                        <span className="text-gray-500 text-sm group-hover:text-gray-600 transition-colors duration-300">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced CTA Button */}
              <button
                onClick={plan.name === 'Free' ? onGetStarted : undefined}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-500 flex items-center justify-center group/btn
                  ${plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
                    : plan.name === 'Free'
                    ? 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow-xl'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-xl hover:shadow-purple-500/25'
                  }
                  transform hover:scale-105
                `}
              >
                {plan.cta}
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </button>

              {/* Hover reveal sparkles */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced FAQ Section with better design */}
        <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            {[
              {
                question: "What counts as one credit?",
                answer: "One credit = one automation task like processing a document, sending an email, making an API call, or running an AI analysis."
              },
              {
                question: "Can I upgrade or downgrade anytime?",
                answer: "Yes! Change your plan anytime. Upgrades are instant, and downgrades take effect at your next billing cycle."
              },
              {
                question: "Do unused credits roll over?",
                answer: "Yes, unused credits roll over to the next month. You never lose what you've paid for."
              },
              {
                question: "Is there a long-term contract?",
                answer: "No contracts ever. Pay monthly and cancel with one click anytime. No questions asked."
              }
            ].map((faq, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h4 className="font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 flex items-center">
                  <Star className="w-4 h-4 text-blue-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {faq.question}
                </h4>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">{faq.answer}</p>
            </div>
            ))}
            </div>
            </div>

        {/* Enhanced bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex flex-col items-center space-y-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl py-8 px-12 border border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold text-gray-800">Ready to scale your automation?</span>
            </div>
            <p className="text-gray-600 text-center max-w-md">
              Join thousands of businesses automating their workflows with AI
            </p>
            <button
              onClick={onGetStarted}
              className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}