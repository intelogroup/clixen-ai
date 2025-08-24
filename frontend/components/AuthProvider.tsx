'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-browser'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 [AUTH] Getting initial session...')

      try {
        const supabase = createClient()
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 [AUTH] Error getting session:', error)
        } else {
          console.log('🔐 [AUTH] Initial session:', initialSession ? 'Found' : 'None')
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
        }
      } catch (error) {
        console.error('🔐 [AUTH] Exception getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [AUTH] Auth state change:', event, session ? 'Session exists' : 'No session')

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle auth events - let middleware handle redirects
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ [AUTH] User signed in - middleware will handle redirect')
            // Remove automatic redirect - let middleware handle this
            break
          case 'SIGNED_OUT':
            console.log('👋 [AUTH] User signed out')
            // Only redirect on explicit sign out, not on session expiry
            if (user) {
              router.push('/')
            }
            break
          case 'TOKEN_REFRESHED':
            console.log('🔄 [AUTH] Token refreshed')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    console.log('📝 [AUTH] Signing up user:', email)
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      
      if (error) {
        console.error('❌ [AUTH] Sign up error:', error)
        return { user: null, error }
      }
      
      console.log('✅ [AUTH] Sign up successful')
      
      // Create user profile if user was created
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: null,
              tier: 'free',
              trial_active: true,
              trial_started_at: new Date().toISOString(),
              trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              credits_remaining: 50,
              credits_used: 0
            })
            
          if (profileError) {
            console.error('📝 [AUTH] Error creating profile:', profileError)
          } else {
            console.log('✅ [AUTH] User profile created')
          }
        } catch (error) {
          console.error('📝 [AUTH] Profile creation error:', error)
        }
      }
      
      return { user: data.user, error: null }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔓 [AUTH] Signing in user:', email)
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ [AUTH] Sign in error:', error)
        return { user: null, error }
      }
      
      console.log('✅ [AUTH] Sign in successful')
      
      // Ensure user profile exists (for existing users who might not have a profile)
      if (data.user) {
        try {
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()
            
          if (!existingProfile && fetchError?.code === 'PGRST116') {
            console.log('📝 [AUTH] Creating missing profile for existing user')
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || null,
                tier: 'free',
                trial_active: true,
                trial_started_at: new Date().toISOString(),
                trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                credits_remaining: 50,
                credits_used: 0
              })
              
            if (profileError) {
              console.error('📝 [AUTH] Error creating profile:', profileError)
            } else {
              console.log('✅ [AUTH] Profile created for existing user')
            }
          }
        } catch (error) {
          console.error('📝 [AUTH] Profile check error:', error)
        }
      }

      // Force a page refresh to trigger middleware redirect
      console.log('✅ [AUTH] Sign in completed, refreshing page for middleware redirect')

      // Small delay to ensure auth state is set, then refresh
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 100)

      return { user: data.user, error: null }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    console.log('👋 [AUTH] Signing out user')
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ [AUTH] Sign out error:', error)
      } else {
        console.log('✅ [AUTH] Sign out successful')
        // Navigate to home page
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// HOC for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/?auth=true')
      }
    }, [user, loading, router])

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}
