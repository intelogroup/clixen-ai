'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase-client'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const ensureUserProfile = async (user: any) => {
    try {
      console.log('👤 Checking if user profile exists...')
      
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
        
      if (!existingProfile && fetchError?.code === 'PGRST116') {
        console.log('👤 Profile not found, creating new profile...')
        
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            tier: 'free',
            trial_active: true,
            trial_started_at: new Date().toISOString(),
            trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            credits_remaining: 50,
            credits_used: 0
          })
          
        if (insertError) {
          console.error('👤 Error creating profile:', insertError)
        } else {
          console.log('✅ User profile created successfully')
        }
      } else if (existingProfile) {
        console.log('✅ User profile already exists')
      } else if (fetchError) {
        console.error('👤 Error checking profile:', fetchError)
      }
    } catch (error) {
      console.error('👤 Error ensuring user profile:', error)
    }
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth callback - processing URL parameters...')
        
        // Handle the auth callback from URL parameters
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 Session error:', error)
          throw error
        }

        console.log('🔐 Session data:', data)

        if (data?.session) {
          console.log('✅ Valid session found, user authenticated')
          
          // Ensure user profile exists
          await ensureUserProfile(data.session.user)
          
          setStatus('success')
          setMessage('Authentication successful! Redirecting to dashboard...')
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } else {
          // Check for auth code in URL and exchange it
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          
          if (code) {
            console.log('🔐 Found auth code, exchanging for session...')
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (exchangeError) {
              throw exchangeError
            }
            
            if (sessionData?.session) {
              console.log('✅ Session exchange successful')
              
              // Ensure user profile exists
              await ensureUserProfile(sessionData.session.user)
              
              setStatus('success')
              setMessage('Authentication successful! Redirecting to dashboard...')
              
              setTimeout(() => {
                router.push('/dashboard')
              }, 1500)
            } else {
              throw new Error('Failed to create session from code')
            }
          } else {
            throw new Error('No session or auth code found')
          }
        }
      } catch (error: any) {
        console.error('🔐 Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')
        
        // Redirect to home page after error
        setTimeout(() => {
          router.push('/?auth=true')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
            <p className="text-gray-600">Please wait while we complete your sign in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  )
}