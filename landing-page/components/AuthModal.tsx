'use client'

import { useState, useEffect } from 'react'
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AuthError } from '@supabase/supabase-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log('🔐 Starting authentication:', { mode, authMethod, email })

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
          console.log('✅ Sign up successful:', data)
          setSuccess(true)
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error
          console.log('✅ Sign in successful:', data)
          
          // Successful login - redirect to dashboard
          console.log('🔄 Redirecting to dashboard...')
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
      console.error('❌ Authentication error:', authError)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === 'signup' ? 'Start Your Free Trial' : 'Welcome Back'}
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            {mode === 'signup' 
              ? '100 free automations to get you started'
              : 'Continue automating your business'
            }
          </p>
        </DialogHeader>

          {success ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Check Your Email
                </h3>
                <p className="text-muted-foreground mb-6">
                  We sent you a magic link to {email}. Click it to complete your {mode === 'signup' ? 'signup' : 'signin'}.
                </p>
                <Button onClick={onClose} className="w-full">
                  Got it!
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Auth Method Toggle */}
              <div className="flex rounded-lg bg-muted p-1 mb-6">
                <Button
                  type="button"
                  variant={authMethod === 'password' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAuthMethod('password')}
                  className="flex-1"
                >
                  Password
                </Button>
                <Button
                  type="button"
                  variant={authMethod === 'magic' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAuthMethod('magic')}
                  className="flex-1"
                >
                  Magic Link
                </Button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="testuser1@email.com"
                  />
                </div>

                {authMethod === 'password' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={authMethod === 'password'}
                      placeholder="Demo123"
                    />
                  </div>
                )}

                {error && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                  </Card>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email || (authMethod === 'password' && !password)}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
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
                  <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full"
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
                <p className="text-sm text-muted-foreground">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onModeChange(mode === 'signup' ? 'signin' : 'signup')}
                    className="p-0 h-auto font-medium"
                  >
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </Button>
                </p>
              </div>

              {mode === 'signup' && (
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  By signing up, you agree to our{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </div>
              )}
            </>
          )}
      </DialogContent>
    </Dialog>
  )
}