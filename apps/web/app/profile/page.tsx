'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, Save, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  credits_remaining: number
  tier: string
  api_key: string
  created_at: string
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/'
        return
      }

      setUser(user)
      
      // Mock profile data
      const mockProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        credits_remaining: 100,
        tier: 'free',
        api_key: 'ap_test_' + Math.random().toString(36).substr(2, 32),
        created_at: user.created_at || new Date().toISOString()
      }
      
      setProfile(mockProfile)
      setFormData({
        full_name: mockProfile.full_name || '',
        email: mockProfile.email
      })
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name
        }
      })

      if (error) throw error

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          full_name: formData.full_name
        })
      }

      alert('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating profile:', error.message)
      alert('Error updating profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const copyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key)
      alert('API key copied to clipboard!')
    }
  }

  const regenerateApiKey = () => {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
      if (profile) {
        setProfile({
          ...profile,
          api_key: 'ap_test_' + Math.random().toString(36).substr(2, 32)
        })
        alert('API key regenerated!')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed.</p>
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* API Key Section */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">API Access</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={profile?.api_key || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={copyApiKey}
                      className="btn-secondary flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={regenerateApiKey}
                      className="btn-secondary flex items-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Use this API key to authenticate your requests to the B2C Automation Platform API.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Tier</label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{profile?.tier}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Credits Remaining</label>
                  <p className="text-lg font-semibold text-gray-900">{profile?.credits_remaining}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-sm text-gray-600">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-xs text-gray-500 font-mono break-all">{profile?.id}</p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Account Actions</h2>
              </div>
              
              <div className="p-6 space-y-3">
                <button className="w-full btn-secondary">
                  Download Data
                </button>
                <button className="w-full btn-secondary">
                  Change Password
                </button>
                <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}