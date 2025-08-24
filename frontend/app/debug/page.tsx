'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Bug } from 'lucide-react'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Running diagnostics...')
      
      // Test basic fetch to debug endpoint
      const response = await fetch('/api/debug', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent
        },
        cache: 'no-cache'
      })
      
      console.log('📡 Debug API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Debug data received:', data)
      
      // Add client-side info
      if (data.success && data.data) {
        data.data.client = {
          userAgent: navigator.userAgent,
          currentUrl: window.location.href,
          referrer: document.referrer,
          cookiesEnabled: navigator.cookieEnabled,
          language: navigator.language,
          platform: navigator.platform,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString()
        }
      }
      
      setDebugInfo(data)
      
    } catch (err) {
      console.error('❌ Diagnostics failed:', err)
      setError({
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const StatusIcon = ({ status }) => {
    if (status === 'Set' || status === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (status === 'Missing' || status === false) {
      return <XCircle className="w-4 h-4 text-red-500" />
    } else {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bug className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
          </div>
          <p className="text-gray-600">Debug environment configuration and API connectivity</p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Running Diagnostics...' : 'Run Diagnostics'}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">Diagnostic Failed</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Error:</strong> {error.name}</p>
              <p><strong>Message:</strong> {error.message}</p>
              <p><strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="grid gap-6">
            {debugInfo.success ? (
              <>
                {/* Environment Variables */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Variables</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(debugInfo.data.environment).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 truncate">{key}</span>
                        <div className="flex items-center space-x-2">
                          <StatusIcon status={value} />
                          <span className={`text-xs px-2 py-1 rounded ${
                            value === 'Set' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Server</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>Environment:</strong> {debugInfo.data.nodeEnv}</p>
                        <p><strong>Node Version:</strong> {debugInfo.data.nodeVersion}</p>
                        <p><strong>Platform:</strong> {debugInfo.data.platform}</p>
                        <p><strong>Next.js:</strong> {debugInfo.data.nextVersion}</p>
                      </div>
                    </div>
                    
                    {debugInfo.data.client && (
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Client</h3>
                        <div className="text-sm space-y-1">
                          <p><strong>Browser:</strong> {debugInfo.data.client.userAgent.split(' ')[0]}</p>
                          <p><strong>Language:</strong> {debugInfo.data.client.language}</p>
                          <p><strong>Platform:</strong> {debugInfo.data.client.platform}</p>
                          <p><strong>Window Size:</strong> {debugInfo.data.client.windowSize}</p>
                          <p><strong>Cookies:</strong> {debugInfo.data.client.cookiesEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* URLs */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration URLs</h2>
                  <div className="space-y-3">
                    {Object.entries(debugInfo.data.urls).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="text-sm text-gray-600 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Results */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a 
                      href="/test-supabase"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Test Supabase</div>
                      <div className="text-sm opacity-80">Database connection</div>
                    </a>
                    <a 
                      href="/dashboard"
                      className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Dashboard</div>
                      <div className="text-sm opacity-80">Main application</div>
                    </a>
                    <a 
                      href="/"
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Landing Page</div>
                      <div className="text-sm opacity-80">Main website</div>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-900 mb-2">Diagnostic Failed</h2>
                <p className="text-red-700">{debugInfo.error}</p>
                {debugInfo.details && (
                  <p className="text-sm text-red-600 mt-2">{debugInfo.details}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
