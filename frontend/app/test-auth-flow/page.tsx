'use client'

import { useAuth } from '../../components/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

export default function TestAuthFlow() {
  const { user, session, loading, isAuthenticated } = useAuth()
  const [serverUser, setServerUser] = useState<any>(null)
  const [checks, setChecks] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()

  useEffect(() => {
    const runChecks = async () => {
      const newChecks: { [key: string]: boolean } = {}

      // Check 1: Client-side auth state
      newChecks.clientAuthState = !!user && !!session
      
      // Check 2: Server-side session
      try {
        const supabase = createClient()
        const { data: { user: serverUserData }, error } = await supabase.auth.getUser()
        setServerUser(serverUserData)
        newChecks.serverSession = !!serverUserData && !error
      } catch (error) {
        newChecks.serverSession = false
      }

      // Check 3: Cookie presence
      newChecks.authCookies = document.cookie.includes('sb-') || document.cookie.includes('supabase')

      // Check 4: Profile exists
      if (user) {
        try {
          const supabase = createClient()
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          
          newChecks.profileExists = !!profile && !error
        } catch (error) {
          newChecks.profileExists = false
        }
      }

      setChecks(newChecks)
    }

    if (!loading) {
      runChecks()
    }
  }, [user, session, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auth state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Flow Test</h1>
          <p className="text-gray-600 mb-6">
            This page tests the fixed authentication flow to ensure users are properly routed to the dashboard.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Auth Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Authentication Status</h2>
              
              <div className="space-y-2">
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                  isAuthenticated ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
                
                {user && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg">
                    <div className="font-medium">User: {user.email}</div>
                    <div className="text-sm">ID: {user.id}</div>
                  </div>
                )}
              </div>
            </div>

            {/* System Checks */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">System Checks</h2>
              
              <div className="space-y-2">
                {Object.entries({
                  clientAuthState: 'Client auth state',
                  serverSession: 'Server session valid',
                  authCookies: 'Auth cookies present',
                  profileExists: 'User profile exists'
                }).map(([key, label]) => (
                  <div key={key} className={`flex items-center space-x-2 p-2 rounded ${
                    checks[key] === true ? 'bg-green-50 text-green-800' : 
                    checks[key] === false ? 'bg-red-50 text-red-800' : 
                    'bg-gray-50 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      checks[key] === true ? 'bg-green-500' : 
                      checks[key] === false ? 'bg-red-500' : 
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Debug Info */}
          {user && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Debug Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Client User:</strong>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify({
                      id: user.id,
                      email: user.email,
                      created_at: user.created_at
                    }, null, 2)}
                  </pre>
                </div>
                {serverUser && (
                  <div>
                    <strong>Server User:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify({
                        id: serverUser.id,
                        email: serverUser.email,
                        created_at: serverUser.created_at
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Landing
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Expected Flow */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Expected Auth Flow</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. User clicks "Sign In" → Auth modal opens</li>
              <li>2. User enters credentials → Supabase auth processes</li>
              <li>3. Auth callback exchanges code → Creates/updates session</li>
              <li>4. Callback redirects to /dashboard</li>
              <li>5. Middleware sees authenticated user → Allows dashboard access</li>
              <li>6. User sees dashboard (no redirect back to landing)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
