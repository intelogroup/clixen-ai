'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Database, User, RefreshCw } from 'lucide-react'

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState(null)
  const [userCreationResult, setUserCreationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-supabase')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error: 'Failed to test connection',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    setUserLoading(true)
    try {
      const response = await fetch('/api/test-supabase', {
        method: 'POST'
      })
      const data = await response.json()
      setUserCreationResult(data)
    } catch (error) {
      setUserCreationResult({
        success: false,
        error: 'Failed to create user',
        details: error.message
      })
    } finally {
      setUserLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Supabase Connection Test</h1>
          <p className="text-gray-600">Test the database connection and verify schema setup</p>
        </div>

        <div className="grid gap-6">
          {/* Connection Test */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Database Connection</h2>
              </div>
              <button
                onClick={testConnection}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResults && (
              <div className="border-t border-gray-200 pt-4">
                <div className={`flex items-center space-x-2 mb-4 ${
                  testResults.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResults.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {testResults.success ? 'Connection Successful!' : 'Connection Failed'}
                  </span>
                </div>

                {testResults.success && testResults.data && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Database URL</h3>
                      <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                        {testResults.data.url}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Table Status</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(testResults.data.tables).map(([table, status]) => (
                          <div key={table} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">{table}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              status === 'Found' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Test User Status</h3>
                      <div className="p-3 bg-gray-50 rounded">
                        {typeof testResults.data.testUser === 'object' ? (
                          <div className="space-y-1">
                            <p className="text-sm"><strong>Email:</strong> {testResults.data.testUser.email}</p>
                            <p className="text-sm"><strong>ID:</strong> {testResults.data.testUser.id}</p>
                            <p className="text-sm"><strong>Tier:</strong> {testResults.data.testUser.tier}</p>
                            <p className="text-sm"><strong>Trial Active:</strong> {testResults.data.testUser.trial_active ? 'Yes' : 'No'}</p>
                            <p className="text-sm"><strong>Credits:</strong> {testResults.data.testUser.quota_used}/{testResults.data.testUser.quota_limit}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">{testResults.data.testUser}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!testResults.success && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {testResults.error}
                    </p>
                    {testResults.details && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Details:</strong> {testResults.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Creation Test */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Test User Creation</h2>
              </div>
              <button
                onClick={createTestUser}
                disabled={userLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${userLoading ? 'animate-spin' : ''}`} />
                <span>{userLoading ? 'Creating...' : 'Create Test User'}</span>
              </button>
            </div>

            {userCreationResult && (
              <div className="border-t border-gray-200 pt-4">
                <div className={`flex items-center space-x-2 mb-4 ${
                  userCreationResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {userCreationResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">{userCreationResult.message}</span>
                </div>

                {userCreationResult.success && userCreationResult.user && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">Test User Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Email:</strong> {userCreationResult.user.email}</p>
                      <p><strong>ID:</strong> {userCreationResult.user.id}</p>
                      <p><strong>Tier:</strong> {userCreationResult.user.tier}</p>
                      <p><strong>Trial Active:</strong> {userCreationResult.user.trial_active ? 'Yes' : 'No'}</p>
                      {userCreationResult.user.trial_expires && (
                        <p><strong>Trial Expires:</strong> {new Date(userCreationResult.user.trial_expires).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )}

                {!userCreationResult.success && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {userCreationResult.error}
                    </p>
                    {userCreationResult.details && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Details:</strong> {userCreationResult.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Test Connection" to verify database connectivity and schema</li>
              <li>Click "Create Test User" to create a test user with email: test@clixen.app</li>
              <li>Verify all tables are found and the test user is created successfully</li>
              <li>You can then test the authentication flow with these credentials</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/dashboard" 
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
