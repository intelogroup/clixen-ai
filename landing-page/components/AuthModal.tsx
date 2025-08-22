'use client'

import { useState, useEffect } from 'react'
import { X, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { createBrowserClient } from '../lib/supabase'
import type { AuthError } from '@supabase/supabase-js'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setEmail('')
      setError(null)
      setSuccess(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            signup_type: mode,
          }
        }
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (error) {
      const authError = error as AuthError
      setError(authError.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            signup_type: mode,
          }
        }
      })

      if (error) {
        throw error
      }
    } catch (error) {
      const authError = error as AuthError
      setError(authError.message || 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signup' ? 'Start Your Free Trial' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {mode === 'signup' 
                ? '100 free automations to get you started'
                : 'Continue automating your business'
              }
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-600 mb-6">
                We sent you a magic link to {email}. Click it to complete your {mode === 'signup' ? 'signup' : 'signin'}.
              </p>
              <button
                onClick={onClose}
                className="btn-primary w-full"
              >
                Got it!
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleAuth} className="space-y-4">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Mail className="w-5 h-5 mr-2" />
                  )}
                  {mode === 'signup' ? 'Send Magic Link' : 'Send Login Link'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>

              {mode === 'signup' && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                  By signing up, you agree to our{' '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-700">Terms of Service</a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}