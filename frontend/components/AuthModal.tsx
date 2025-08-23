'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Mail, CheckCircle, Loader2, Bot, Sparkles, Shield, Zap, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AuthError } from '@supabase/supabase-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Memoize benefits to prevent unnecessary re-renders
  const benefits = useMemo(() => [
    { icon: Bot, text: "AI-powered automation", color: "blue" },
    { icon: Zap, text: "100+ integrations", color: "yellow" },
    { icon: Users, text: "2,000+ active users", color: "green" },
    { icon: Shield, text: "Enterprise security", color: "purple" }
  ], [])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
      setIsLoading(false)
    }
  }, [isOpen])

  // Memoize auth handler to prevent unnecessary re-renders
  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (authMethod === 'password') {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          })
          if (error) throw error
          setSuccess(true)
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error
          
          // Successful login - redirect to dashboard
          window.location.href = '/dashboard'
        }
      } else {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              signup_type: mode,
            }
          }
        })
        if (error) throw error
        setSuccess(true)
      }
    } catch (error) {
      const authError = error as AuthError
      console.error('Authentication error:', authError)
      setError(authError.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [mode, authMethod, email, password])

  // Memoize Google auth handler
  const handleGoogleAuth = useCallback(async () => {
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
      console.error('Google auth error:', authError)
      setError(authError.message || 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }, [mode])

  // Memoize mode change handler
  const handleModeChange = useCallback((newMode: 'signin' | 'signup') => {
    onModeChange(newMode)
    setError(null)
    setSuccess(false)
  }, [onModeChange])

  // Memoize auth method change handler
  const handleAuthMethodChange = useCallback((newMethod: 'password' | 'magic') => {
    setAuthMethod(newMethod)
    setError(null)
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === 'signup' ? 'Start Your Free Trial' : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signup' 
              ? '100 free automations to get you started'
              : 'Continue automating your business'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Left side - Auth form */}
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Clixen AI</h1>
                  <p className="text-sm text-gray-500">Automation Platform</p>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900">
                {mode === 'signup' ? 'Start Your Free Trial' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600 mt-2">
                {mode === 'signup' 
                  ? '100 free automations to get you started'
                  : 'Continue automating your business'
                }
              </p>
            </div>

            {success ? (
              <Card className="border-0 shadow-none bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Check Your Email
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We sent you a magic link to <span className="font-semibold">{email}</span>. 
                    Click it to complete your {mode === 'signup' ? 'signup' : 'signin'}.
                  </p>
                  <Button onClick={onClose} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    Got it!
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Auth Method Toggle */}
                <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                  <Button
                    type="button"
                    variant={authMethod === 'password' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleAuthMethodChange('password')}
                    className={cn(
                      "flex-1 rounded-lg transition-all duration-300",
                      authMethod === 'password' 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Password
                  </Button>
                  <Button
                    type="button"
                    variant={authMethod === 'magic' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleAuthMethodChange('magic')}
                    className={cn(
                      "flex-1 rounded-lg transition-all duration-300",
                      authMethod === 'magic' 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Magic Link
                  </Button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-300"
                    />
                  </div>

                  {authMethod === 'password' && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={authMethod === 'password'}
                        placeholder="Create a strong password"
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-300"
                      />
                    </div>
                  )}

                  {error && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-red-600">{error}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !email || (authMethod === 'password' && !password)}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5 mr-2" />
                    )}
                    {authMethod === 'password' 
                      ? (mode === 'signup' ? 'Create Account' : 'Sign In')
                      : (mode === 'signup' ? 'Send Magic Link' : 'Send Login Link')
                    }
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleModeChange(mode === 'signup' ? 'signin' : 'signup')}
                      className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700"
                    >
                      {mode === 'signup' ? 'Sign in' : 'Sign up'}
                    </Button>
                  </p>
                </div>

                {mode === 'signup' && (
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    By signing up, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right side - Benefits showcase */}
          <div className="hidden lg:block bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {mode === 'signup' ? 'Join the Future' : 'Welcome Back'}
                </h3>
                <p className="text-gray-600">
                  {mode === 'signup' 
                    ? 'Start automating your business today'
                    : 'Continue your automation journey'
                  }
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={benefit.text} className="flex items-center space-x-3 group">
                    <div className={`w-10 h-10 bg-${benefit.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className={`w-5 h-5 text-${benefit.color}-600`} />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-300">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">2,000+</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">50K+</div>
                    <div className="text-sm text-gray-600">Tasks Automated</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <Button 
                  onClick={mode === 'signup' ? undefined : onClose}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  {mode === 'signup' ? 'Get Started Free' : 'Continue to Dashboard'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}