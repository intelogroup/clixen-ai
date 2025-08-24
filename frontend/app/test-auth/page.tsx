'use client'

import { useState } from 'react'
import { useAuth } from '../../components/AuthProvider'
import { CheckCircle, XCircle, RefreshCw, User, LogIn, LogOut } from 'lucide-react'

export default function TestAuthPage() {
  const { user, loading, signIn, signOut, isAuthenticated } = useAuth()
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)

  const addTestResult = (step: string, success: boolean, details?: string) => {
    const result = {
      step,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    }
    setTestResults(prev => [...prev, result])
    console.log('🧪 [TEST]', step, success ? '✅' : '❌', details)
  }

  const testAuthFlow = async () => {
    setTesting(true)
    setTestResults([])
    
    try {
      addTestResult('Starting Authentication Flow Test', true)

      // Test 1: Check initial state
      addTestResult('Check Initial Auth State', !isAuthenticated, `User: ${user?.email || 'None'}`)

      // Test 2: Sign in with test user
      addTestResult('Attempting Sign In', true, 'Using test@clixen.app')
      
      const signInResult = await signIn('test@clixen.app', 'TestPassword123!')
      
      if (signInResult.error) {
        addTestResult('Sign In Failed', false, signInResult.error.message)
      } else {
        addTestResult('Sign In Successful', true, `User: ${signInResult.user?.email}`)
        
        // Wait a moment for auth state to update
        setTimeout(() => {
          if (isAuthenticated) {
            addTestResult('Auth State Updated', true, 'User is now authenticated')
          } else {
            addTestResult('Auth State Update', false, 'User state not updated yet')
          }
        }, 1000)
      }
      
    } catch (error) {
      addTestResult('Test Error', false, error.message)
    } finally {
      setTesting(false)
    }
  }

  const testSignOut = async () => {
    try {
      addTestResult('Attempting Sign Out', true)
      await signOut()
      addTestResult('Sign Out Successful', true, 'User signed out')
    } catch (error) {
      addTestResult('Sign Out Failed', false, error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication Flow Test</h1>
          <p className="text-gray-600">Test the complete sign-in/sign-out flow and routing</p>
        </div>

        {/* Current Auth State */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Authentication State</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              isAuthenticated 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isAuthenticated ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Loading State</h3>
              <p className="text-sm text-gray-600">{loading ? 'Loading...' : 'Ready'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">User Email</h3>
              <p className="text-sm text-gray-600">{user?.email || 'None'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">User ID</h3>
              <p className="text-sm text-gray-600 font-mono">{user?.id ? user.id.substring(0, 8) + '...' : 'None'}</p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testAuthFlow}
              disabled={testing || isAuthenticated}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-5 h-5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Sign In Flow'}</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={testSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Test Sign Out</span>
              </button>
            )}

            <a
              href="/dashboard"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </a>

            <a
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <span>Go to Landing</span>
            </a>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                        {result.step}
                      </h3>
                      <span className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.timestamp}
                      </span>
                    </div>
                    {result.details && (
                      <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Click "Test Sign In Flow" to test authentication with test@clixen.app</li>
            <li>If successful, you should be redirected to dashboard</li>
            <li>Try navigating to different pages to test route protection</li>
            <li>Click "Test Sign Out" to test sign out flow</li>
            <li>Verify you're redirected back to landing page after sign out</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
