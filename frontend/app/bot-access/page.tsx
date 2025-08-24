'use client'

import { useRouter } from 'next/navigation'
import { Bot, AlertCircle, ExternalLink, ArrowLeft } from 'lucide-react'

export default function BotAccess() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Bot Access</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Migration Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🚧 Telegram Bot Access Temporarily Unavailable
              </h3>
              <p className="text-blue-800 mb-4">
                We're setting up a new authentication system with Neon Auth. 
                Bot access will be restored once the migration is complete!
              </p>
            </div>
          </div>
        </div>

        {/* Bot Access Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Clixen AI Telegram Bot
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Once authentication is restored, you'll be able to access our powerful automation bot through Telegram. 
            Get instant results for weather checks, document analysis, translations, and more!
          </p>

          {/* Features Preview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Available Automations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Weather checks for any city</li>
                <li>• Email scanning and analysis</li>
                <li>• Document summarization</li>
                <li>• Text translation</li>
                <li>• Smart reminders</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">How It Works</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Natural language commands</li>
                <li>• Instant AI-powered responses</li>
                <li>• 24/7 availability</li>
                <li>• Privacy-first design</li>
                <li>• No message storage</li>
              </ul>
            </div>
          </div>

          {/* Coming Soon Button */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6">
            <p className="text-gray-500 mb-4">Bot access will be available after auth migration</p>
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Access Bot (Coming Soon)
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
