'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { createClient } from '../../lib/supabase-browser'
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
import GlobalNavigation from '../../components/GlobalNavigation'
import { getBotButtonProps, trackBotAccess, BotAccessPresets } from '../../lib/telegram-utils'

interface DashboardStats {
  total_executions: number
  successful_executions: number
  documents_analyzed: number
  total_credits_spent: number
  trial_active: boolean
  trial_days_remaining: number
}

export default function Dashboard() {
  console.log('📊 Dashboard component initializing...')
  
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.log('📊 No authenticated user found, middleware will handle redirect')
      return
    }

    console.log('📊 Dashboard useEffect triggered - fetching user data...')
    
    const getUserData = async () => {
      console.log('📊 User found:', user.email)
      
      try {
        const supabase = createClient()
        console.log('📊 Fetching user profile from database...')
        // Fetch user profile from database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('📊 Error fetching profile:', profileError)
        } else {
          console.log('📊 Profile data received:', profileData?.email, 'credits:', profileData?.credits_remaining)
          setProfile(profileData)
        }

        console.log('📊 Fetching dashboard stats from user_dashboard view...')
        // Fetch dashboard stats from the view including trial information
        const { data: dashboardData, error: dashboardError } = await supabase
          .from('user_dashboard')
          .select('total_executions, successful_executions, documents_analyzed, total_credits_spent, trial_active, trial_days_remaining')
          .eq('id', user.id)
          .single()
        
        if (dashboardError) {
          console.error('📊 Error fetching dashboard stats:', dashboardError)
          console.log('📊 Using default stats...')
          // Set default stats if query fails
          setStats({
            total_executions: 0,
            successful_executions: 0,
            documents_analyzed: 0,
            total_credits_spent: 0,
            trial_active: false,
            trial_days_remaining: 0
          })
        } else {
          console.log('📊 Dashboard stats received:', dashboardData)
          setStats(dashboardData)
        }
      } catch (error) {
        console.error('📊 Error in getUserData:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserData()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Getting your automation data...</p>
        </div>
      </div>
    )
  }

  const automations = [
    { name: 'Weather Check', icon: CloudRain, usage: stats?.total_executions ? Math.floor(stats.total_executions * 0.3) : 0 },
    { name: 'Email Scanner', icon: Mail, usage: stats?.total_executions ? Math.floor(stats.total_executions * 0.25) : 0 },
    { name: 'PDF Summarizer', icon: FileText, usage: stats?.total_executions ? Math.floor(stats.total_executions * 0.2) : 0 },
    { name: 'Text Translator', icon: Languages, usage: stats?.total_executions ? Math.floor(stats.total_executions * 0.15) : 0 },
    { name: 'Smart Reminders', icon: Calendar, usage: stats?.total_executions ? Math.floor(stats.total_executions * 0.1) : 0 }
  ]

  const quickActions = [
    {
      title: 'Message @clixen_bot',
      description: 'Start automating right now',
      icon: Bot,
      href: getBotButtonProps('DASHBOARD').href,
      onClick: getBotButtonProps('DASHBOARD').onClick,
      external: true,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    {
      title: 'Link Telegram',
      description: 'Connect your account',
      icon: MessageCircle,
      href: '/bot-access',
      external: false,
      color: 'bg-green-50 text-green-600 hover:bg-green-100'
    },
    {
      title: 'Manage Subscription',
      description: 'Billing & plans',
      icon: CreditCard,
      href: '/subscription',
      external: false,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    },
    {
      title: 'Account Settings',
      description: 'Profile & preferences',
      icon: Settings,
      href: '/profile',
      external: false,
      color: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
    }
  ]

  const creditsUsed = profile?.quota_used || 0
  const creditsLimit = profile?.quota_limit || 50
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed)
  const usagePercentage = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-3">
              {stats?.trial_active && (
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{stats.trial_days_remaining} days left in trial</span>
                </div>
              )}
              <a 
                href="https://t.me/clixen_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span>Open Bot</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <p className="text-gray-600">Welcome back, {user?.email}! Here's your automation overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.total_executions || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Total Automations</h3>
            <p className="text-sm text-gray-600">Lifetime executions</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.successful_executions || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Successful</h3>
            <p className="text-sm text-gray-600">
              {stats?.total_executions > 0 
                ? `${Math.round(((stats?.successful_executions || 0) / stats.total_executions) * 100)}% success rate`
                : 'No executions yet'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.documents_analyzed || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600">PDFs analyzed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{creditsRemaining}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Credits Left</h3>
            <p className="text-sm text-gray-600">Out of {creditsLimit} available</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Usage Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Credit Usage</h2>
                <div className="text-sm text-gray-600">
                  {creditsUsed} / {creditsLimit} used
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Current usage</span>
                  <span className="font-medium text-gray-900">{Math.round(usagePercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      usagePercentage > 90 ? 'bg-red-500' :
                      usagePercentage > 70 ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {usagePercentage > 80 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Running low on credits</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You've used {Math.round(usagePercentage)}% of your credits. Consider upgrading to avoid interruptions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Automations Usage */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Automation Usage</h2>
              
              <div className="space-y-4">
                {automations.map((automation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <automation.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{automation.name}</h3>
                        <p className="text-sm text-gray-600">{automation.usage} times used</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${stats?.total_executions > 0 ? (automation.usage / stats.total_executions) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <a
                    key={index}
                    href={action.href}
                    target={action.external ? '_blank' : '_self'}
                    rel={action.external ? 'noopener noreferrer' : undefined}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${action.color}`}
                  >
                    <action.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm opacity-80">{action.description}</p>
                    </div>
                    {action.external && <ExternalLink className="w-4 h-4" />}
                  </a>
                ))}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {stats?.trial_active ? 'Free Trial' : profile?.tier || 'Free'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-700">Active</span>
                  </div>
                </div>
                
                {profile?.telegram_chat_id ? (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Telegram</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-700">Connected</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Link Telegram</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Connect your Telegram account to start using automations.
                    </p>
                    <a 
                      href="/bot-access"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Link Now →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
              </div>
              <p className="text-sm text-gray-600">
                We don't store your messages. All conversations with @clixen_bot remain private and are processed in real-time only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
