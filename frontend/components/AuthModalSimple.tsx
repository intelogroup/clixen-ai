'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase-browser'
import { handleSupabaseError, isSupabaseConfigured } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { X, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export default function AuthModalSimple({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Reset state when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    setError(null)
    setSuccess(false)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log(`🔐 Attempting ${mode} for:`, email)

    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      setError('Authentication service is not properly configured.')
      setIsLoading(false)
      return
    }

    try {
      if (mode === 'signup') {
        // Validate password
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.')
          setIsLoading(false)
          return
        }

        console.log('🔐 Calling Supabase signUp...')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (error) {
          console.error('🔐 SignUp error:', error)
          throw error
        }

        console.log('🔐 SignUp response:', data)
        
        if (data.user) {
          if (data.user.email_confirmed_at) {
            // Email confirmed, redirect to dashboard
            console.log('✅ Email already confirmed, redirecting...')
            window.location.href = '/dashboard'
          } else {
            // Email confirmation needed
            console.log('📧 Email confirmation required')
            setSuccess(true)
          }
        }
      } else {
        console.log('🔐 Calling Supabase signInWithPassword...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error('🔐 SignIn error:', error)
          throw error
        }

        console.log('🔐 SignIn response:', data)
        
        if (data.user && data.session) {
          console.log('✅ SignIn successful, session established')
          console.log('🔐 Session details:', {
            user: data.user.email,
            expires: data.session.expires_at,
            token: data.session.access_token ? 'present' : 'missing'
          })
          
          // Close modal first
          onClose()
          
          // Use router.push for client-side navigation
          // This ensures the middleware can see the new session
          console.log('🚀 Navigating to dashboard...')
          router.push('/dashboard')
          
          // Also trigger a hard refresh as backup
          // This ensures cookies are properly synced
          setTimeout(() => {
            router.refresh()
          }, 100)
        } else {
          console.error('🔐 SignIn succeeded but no session returned')
          setError('Authentication succeeded but session creation failed. Please try again.')
        }
      }
    } catch (error: any) {
      console.error('🔐 Auth error:', error)
      setError(handleSupabaseError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    onModeChange(newMode)
    setError(null)
    setSuccess(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
              <p className="text-gray-600 mb-4">
                We sent a confirmation link to <strong>{email}</strong>. 
                Please click the link to complete your {mode === 'signup' ? 'registration' : 'sign in'}.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters long
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switch */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    onClick={() => handleModeSwitch(mode === 'signup' ? 'signin' : 'signup')}
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>

              {/* Test User Info */}
              {mode === 'signin' && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Test User:</p>
                  <p className="text-xs text-gray-500">
                    Email: <code>testuser1@email.com</code><br />
                    Password: <code>Demo123</code>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}