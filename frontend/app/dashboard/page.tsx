'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { createClient } from '../../lib/supabase-browser'
import { Settings, Activity, FileText, CreditCard, MessageCircle, Bot, Sparkles } from 'lucide-react'
import GlobalNavigation from '../../components/GlobalNavigation'

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
      console.log('📊 No authenticated user found, redirecting to home page...')
      router.push('/?auth=true')
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
          setStats({
            total_executions: dashboardData.total_executions || 0,
            successful_executions: dashboardData.successful_executions || 0,
            documents_analyzed: dashboardData.documents_analyzed || 0,
            total_credits_spent: dashboardData.total_credits_spent || 0,
            trial_active: dashboardData.trial_active || false,
            trial_days_remaining: dashboardData.trial_days_remaining || 0
          })
        }
        
      } catch (error) {
        console.error('📊 Error fetching user data:', error)
      }
      
      console.log('📊 Setting loading to false...')
      setLoading(false)
    }

    getUserData()
  }, [user, authLoading, router])


  const handleStartTrial = async () => {
    if (!user || !profile) return

    try {
      console.log('🔥 Starting trial for user:', user.id)
      
      const trialStart = new Date()
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 7)
      
      const response = await fetch('/api/user/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          trialStartDate: trialStart.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          trialCredits: 50
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Trial started successfully')
        // Refresh the page to show updated trial status
        router.refresh()
      } else {
        console.error('❌ Failed to start trial:', result.message)
        alert('Failed to start trial: ' + result.message)
      }
    } catch (error) {
      console.error('❌ Error starting trial:', error)
      alert('Error starting trial. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavigation user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</span>! 🚀
          </h2>
          <p className="text-lg text-gray-600">
            Access your AI automation assistant through Telegram and track your usage.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credits Remaining</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.credits_remaining || 0}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-sm">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bot Interactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_executions || 0}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Automations Created</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.documents_analyzed || 0}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-sm">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Account Tier</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{profile?.tier || 'Free'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bot Access Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              Telegram Bot Access
            </h3>
            <p className="text-sm text-gray-600 mt-1">Connect with your AI assistant to create automations</p>
          </div>
          <div className="p-6">
            {(profile?.tier && profile.tier !== 'free') || stats?.trial_active ? (
              <div className="space-y-4">
                {stats?.trial_active ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">
                      Free Trial Active - {stats.trial_days_remaining} days remaining
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Premium Access Active</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => router.push('/bot-access')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Access Telegram Bot
                  </button>
                  
                  <button 
                    onClick={() => window.open('https://t.me/clixen_bot', '_blank')}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Bot className="w-5 h-5" />
                    Open @clixen_bot
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Your Access Code:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user?.id?.slice(0, 8).toUpperCase()}</code></p>
                  <p className="mt-1">Use this code to authenticate with the bot after clicking /start</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <span className="text-orange-800 font-medium">No Active Access</span>
                </div>
                
                <p className="text-gray-600">Start a free trial or upgrade to access the Telegram bot</p>
                
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <button 
                    onClick={handleStartTrial}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start 7-Day Free Trial
                  </button>
                  
                  <button 
                    onClick={() => router.push('/subscription')}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    <CreditCard className="w-5 h-5" />
                    View Plans
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p><strong>Free Trial includes:</strong> 50 credits, full bot access, all features</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful Automations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.successful_executions || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.total_executions ? 
                    `${Math.round((stats.successful_executions / stats.total_executions) * 100)}% success rate` :
                    'No automations created yet'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.credits_used || 0}</p>
                <p className="text-xs text-gray-500">
                  {profile?.credits_used && profile?.credits_remaining ? 
                    `${profile.credits_used + profile.credits_remaining} total credits` :
                    'From initial allocation'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {profile?.onboarding_completed ? 'Active' : 'Setup'}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.onboarding_completed ? 'Ready to use' : 'Complete setup'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Overview</h3>
          </div>
          <div className="p-6">
            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Profile Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Email:</dt>
                      <dd className="text-gray-900">{profile.email}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Full Name:</dt>
                      <dd className="text-gray-900">{profile.full_name || 'Not set'}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Tier:</dt>
                      <dd className="text-gray-900 capitalize">{profile.tier}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Member Since:</dt>
                      <dd className="text-gray-900">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Usage Summary</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Bot Interactions:</dt>
                      <dd className="text-gray-900">{stats?.total_executions || 0}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Automations Created:</dt>
                      <dd className="text-gray-900">{stats?.documents_analyzed || 0}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Credits Balance:</dt>
                      <dd className="text-gray-900">{profile.credits_remaining} remaining</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">API Key:</dt>
                      <dd className="text-gray-900 font-mono text-xs">
                        {profile.api_key ? `${profile.api_key.substring(0, 8)}...` : 'Not generated'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading profile data...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
