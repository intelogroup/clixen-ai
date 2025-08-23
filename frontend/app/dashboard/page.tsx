'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '../../lib/supabase'
import { LogOut, User as UserIcon, Settings, Activity, FileText, CreditCard } from 'lucide-react'

interface DashboardStats {
  total_executions: number
  successful_executions: number
  documents_analyzed: number
  total_credits_spent: number
}

export default function Dashboard() {
  console.log('📊 Dashboard component initializing...')
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered - fetching user data...')
    
    // Check if user is authenticated and fetch real data
    const getUserData = async () => {
      console.log('📊 Getting user from Supabase auth...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('📊 No user found, but showing dashboard anyway for demo...')
        // Temporarily disabled for demo: window.location.href = '/'
        // Set mock user data for demo
        setUser({ id: 'demo', email: 'demo@example.com' } as any)
        setProfile({
          id: 'demo',
          email: 'demo@example.com',
          full_name: 'Demo User',
          credits_remaining: 98,
          credits_used: 2,
          tier: 'free',
          onboarding_completed: true,
          api_key: 'demo_api_key_123',
          created_at: new Date().toISOString()
        } as any)
        setStats({
          total_executions: 12,
          successful_executions: 11,
          documents_analyzed: 5,
          total_credits_spent: 2
        })
        setLoading(false)
        return
      }

      console.log('📊 User found:', user.email)
      setUser(user)
      
      try {
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
        // Fetch dashboard stats from the view
        const { data: dashboardData, error: dashboardError } = await supabase
          .from('user_dashboard')
          .select('total_executions, successful_executions, documents_analyzed, total_credits_spent')
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
            total_credits_spent: 0
          })
        } else {
          console.log('📊 Dashboard stats received:', dashboardData)
          setStats({
            total_executions: dashboardData.total_executions || 0,
            successful_executions: dashboardData.successful_executions || 0,
            documents_analyzed: dashboardData.documents_analyzed || 0,
            total_credits_spent: dashboardData.total_credits_spent || 0
          })
        }
        
      } catch (error) {
        console.error('📊 Error fetching user data:', error)
      }
      
      console.log('📊 Setting loading to false...')
      setLoading(false)
    }

    getUserData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    } else {
      window.location.href = '/'
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
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">B2C Automation Platform</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/profile'}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <UserIcon className="w-5 h-5 mr-2" />
                Profile
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{profile?.full_name || 'User'}</span>! 🚀
          </h2>
          <p className="text-lg text-gray-600">
            Manage your automations and track your usage from this beautiful dashboard.
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
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
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
                <p className="text-sm font-medium text-gray-600">Documents Processed</p>
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

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-primary">
                Create New Workflow
              </button>
              <button className="btn-secondary">
                Upload Document
              </button>
              <button className="btn-secondary">
                View API Documentation
              </button>
            </div>
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
                <p className="text-sm font-medium text-gray-600">Successful Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.successful_executions || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.total_executions ? 
                    `${Math.round((stats.successful_executions / stats.total_executions) * 100)}% success rate` :
                    'No executions yet'
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
                      <dt className="text-gray-500">Total Workflows:</dt>
                      <dd className="text-gray-900">{stats?.total_executions || 0}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Documents Analyzed:</dt>
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