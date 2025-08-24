'use client'

import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Activity, 
  FileText, 
  CreditCard, 
  MessageCircle, 
  Bot, 
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Users,
  Mail,
  Languages,
  CloudRain,
  Shield
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()

  // Temporary placeholder data
  const user = { email: 'demo@example.com' }
  const profile = {
    tier: 'free',
    trial_active: true,
    quota_limit: 50,
    quota_used: 12
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Clixen AI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back!</span>
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Migration Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🚧 Authentication System Migration in Progress
              </h3>
              <p className="text-blue-800 mb-4">
                We're migrating from Supabase to Neon Auth for better performance and features. 
                Your dashboard will be fully functional again shortly!
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Database migration completed
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Setting up Neon Auth + Stack Auth
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Implementing new auth UI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Credits Used</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Credits Remaining</p>
                    <p className="text-2xl font-bold text-gray-900">38</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Automations</p>
                    <p className="text-2xl font-bold text-gray-900">25</p>
                  </div>
                  <Bot className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">96%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CloudRain className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Weather Check - Tokyo</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Email Scan - Invoices</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Languages className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Translation - Spanish to English</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trial Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trial Status</h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Free Trial Active</span>
                  </div>
                  <p className="text-xs text-green-700">5 days remaining</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Credits Used</span>
                    <span className="font-medium">12/50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Bot className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">Access Telegram Bot</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-900">Upgrade Plan</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Account Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
