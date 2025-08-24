'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from './AuthProvider'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export default function AuthModalSimple({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailCheckLoading, setEmailCheckLoading] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const { signUp, signIn, loading: authLoading } = useAuth()

  // Reset state when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  useEffect(() => {
    setError(null)
    setSuccess(false)
    setEmailExists(null)
  }, [mode])

  // Check if email exists when user types (for signup mode only)
  useEffect(() => {
    if (!email || mode !== 'signup') {
      setEmailExists(null)
      return
    }

    const delayedCheck = setTimeout(async () => {
      if (email.includes('@') && email.includes('.')) {
        setEmailCheckLoading(true)
        try {
          const response = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          })

          const data = await response.json()
          if (response.ok) {
            setEmailExists(data.exists)

            // If email exists, suggest switching to sign in
            if (data.exists) {
              setError('This email is already registered. Please sign in instead.')
            } else {
              setError(null)
            }
          }
        } catch (error) {
          console.error('Email check error:', error)
        } finally {
          setEmailCheckLoading(false)
        }
      }
    }, 1000) // Check 1 second after user stops typing

    return () => clearTimeout(delayedCheck)
  }, [email, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate input
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    try {
      let result
      
      if (mode === 'signup') {
        console.log('📝 [AUTH MODAL] Signing up:', email)
        result = await signUp(email, password)
      } else {
        console.log('🔓 [AUTH MODAL] Signing in:', email)
        result = await signIn(email, password)
      }

      if (result.error) {
        // Handle specific error cases
        if (result.error.message.includes('User already registered') ||
            result.error.message.includes('already registered')) {
          setError(`This email is already registered. Please sign in instead or use a different email.`)
          // Auto-suggest switching to sign in mode
          setTimeout(() => {
            if (mode === 'signup') {
              handleModeSwitch('signin')
            }
          }, 2000)
        } else if (result.error.message.includes('Invalid login credentials') ||
                   result.error.message.includes('invalid password')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else {
          // Fallback to original error message for other cases
          setError(result.error.message)
        }
      } else if (mode === 'signup') {
        // Show success message for signup
        setSuccess(true)
      } else {
        // For signin, the AuthProvider handles navigation
        onClose()
      }
    } catch (error: any) {
      console.error('🔐 [AUTH MODAL] Error:', error)
      setError(error.message || 'An unexpected error occurred.')
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
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null) // Clear error when user starts typing
                      }}
                      required
                      placeholder="your@email.com"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                        emailExists === true && mode === 'signup'
                          ? 'border-yellow-300 focus:ring-yellow-500'
                          : emailExists === false && mode === 'signup'
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {emailCheckLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {!emailCheckLoading && emailExists === true && mode === 'signup' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      </div>
                    )}
                    {!emailCheckLoading && emailExists === false && mode === 'signup' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  {emailExists === true && mode === 'signup' && (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-yellow-600">This email is already registered</p>
                      <button
                        type="button"
                        onClick={() => handleModeSwitch('signin')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Switch to Sign In
                      </button>
                    </div>
                  )}
                  {emailExists === false && mode === 'signup' && (
                    <p className="text-xs text-green-600 mt-1">✓ Email available</p>
                  )}
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
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-600">{error}</p>
                        {error.includes('already registered') && (
                          <div className="mt-2 text-xs text-red-500">
                            <p>Switching to sign in mode in 2 seconds, or click "Sign in" below.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading || !email || !password}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                >
                  {authLoading ? (
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
