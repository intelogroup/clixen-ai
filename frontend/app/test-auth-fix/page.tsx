'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function TestAuthFix() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [userCreationResult, setUserCreationResult] = useState<any>(null)
  const [isTestingDb, setIsTestingDb] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const testDatabaseConnection = async () => {
    setIsTestingDb(true)
    setDbStatus(null)
    
    try {
      const response = await fetch('/api/test-supabase')
      const result = await response.json()
      setDbStatus(result)
    } catch (error) {
      setDbStatus({ success: false, error: error.message })
    } finally {
      setIsTestingDb(false)
    }
  }

  const testUserCreation = async () => {
    setIsCreatingUser(true)
    setUserCreationResult(null)
    
    try {
      const response = await fetch('/api/test-supabase', {
        method: 'POST'
      })
      const result = await response.json()
      setUserCreationResult(result)
    } catch (error) {
      setUserCreationResult({ success: false, error: error.message })
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Auth Profile Creation Fix Verification
          </h1>
          <p className="text-gray-600">
            Test if the &quot;📝 [AUTH] Error creating profile: [object Object]&quot; error has been resolved.
          </p>
        </div>

        {/* Database Connection Test */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              🗄️ Database Schema Test
            </h2>
            <button
              onClick={testDatabaseConnection}
              disabled={isTestingDb}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isTestingDb ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Database'
              )}
            </button>
          </div>

          {dbStatus && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                {dbStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${dbStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                  {dbStatus.success ? 'Database Connected' : 'Database Error'}
                </span>
              </div>
              
              {dbStatus.data && (
                <div className="mt-3 space-y-2">
                  <div>
                    <strong>Tables Status:</strong>
                    <pre className="text-sm bg-white p-2 rounded mt-1">
                      {JSON.stringify(dbStatus.data.tables, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <strong>Test User Status:</strong>
                    <pre className="text-sm bg-white p-2 rounded mt-1">
                      {JSON.stringify(dbStatus.data.testUser, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {dbStatus.error && (
                <div className="mt-3">
                  <strong>Error:</strong>
                  <pre className="text-sm bg-red-50 text-red-700 p-2 rounded mt-1">
                    {dbStatus.error}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Creation Test */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              👤 Profile Creation Test
            </h2>
            <button
              onClick={testUserCreation}
              disabled={isCreatingUser}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating User...
                </>
              ) : (
                'Create Test User'
              )}
            </button>
          </div>

          {userCreationResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                {userCreationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${userCreationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {userCreationResult.success ? 'Profile Created Successfully' : 'Profile Creation Failed'}
                </span>
              </div>
              
              {userCreationResult.message && (
                <p className="text-sm text-gray-700 mb-2">{userCreationResult.message}</p>
              )}
              
              {userCreationResult.user && (
                <div className="mt-3">
                  <strong>Created User:</strong>
                  <pre className="text-sm bg-white p-2 rounded mt-1">
                    {JSON.stringify(userCreationResult.user, null, 2)}
                  </pre>
                </div>
              )}
              
              {userCreationResult.error && (
                <div className="mt-3">
                  <strong>Error Details:</strong>
                  <pre className="text-sm bg-red-50 text-red-700 p-2 rounded mt-1">
                    {userCreationResult.error}
                  </pre>
                </div>
              )}
              
              {userCreationResult.details && (
                <div className="mt-3">
                  <strong>Error Details:</strong>
                  <pre className="text-sm bg-red-50 text-red-700 p-2 rounded mt-1">
                    {userCreationResult.details}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fix Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Applied Fixes
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span>Updated auth callback to use <code className="bg-gray-100 px-1 rounded">auth_user_id</code> instead of <code className="bg-gray-100 px-1 rounded">id</code></span>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span>Changed to use <code className="bg-gray-100 px-1 rounded">quota_limit</code> and <code className="bg-gray-100 px-1 rounded">quota_used</code> instead of credits fields</span>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span>Enhanced error logging to show detailed information instead of [object Object]</span>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span>Added required fields: <code className="bg-gray-100 px-1 rounded">last_activity_at</code>, <code className="bg-gray-100 px-1 rounded">user_metadata</code></span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📋 Test Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click &quot;Test Database&quot; to verify the schema and connection</li>
            <li>Click &quot;Create Test User&quot; to test the profile creation with new schema</li>
            <li>Check the server logs for any errors or success messages</li>
            <li>If successful, the &quot;[object Object]&quot; error should be resolved</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
