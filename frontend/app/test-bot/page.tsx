'use client'

import { useState, useEffect } from 'react'
import { 
  Bot, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  ExternalLink, 
  MessageCircle,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { 
  openTelegramBot, 
  createTelegramBotLink, 
  isMobile, 
  isIOS, 
  isAndroid,
  getBotButtonProps,
  getBotDisplayText,
  BotAccessPresets,
  trackBotAccess
} from '../../lib/telegram-utils'

export default function TestBotPage() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    userAgent: ''
  })
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setDeviceInfo({
      isMobile: isMobile(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      userAgent: navigator.userAgent
    })
  }, [])

  const addTestResult = (test: string, success: boolean, details?: string) => {
    const result = {
      test,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    }
    setTestResults(prev => [...prev, result])
  }

  const runAllTests = async () => {
    setTesting(true)
    setTestResults([])

    try {
      // Test 1: Device Detection
      addTestResult('Device Detection', true, 
        `Mobile: ${deviceInfo.isMobile}, iOS: ${deviceInfo.isIOS}, Android: ${deviceInfo.isAndroid}`)

      // Test 2: Link Generation
      const basicLink = createTelegramBotLink()
      addTestResult('Basic Link Generation', basicLink.includes('t.me/clixen_bot'), basicLink)

      const paramLink = createTelegramBotLink({ 
        startParam: 'test', 
        utm_source: 'test_page' 
      })
      addTestResult('Parametered Link Generation', 
        paramLink.includes('start=test') && paramLink.includes('utm_source=test_page'), 
        paramLink)

      // Test 3: Preset Links
      Object.keys(BotAccessPresets).forEach(preset => {
        const props = getBotButtonProps(preset as keyof typeof BotAccessPresets)
        addTestResult(`Preset ${preset}`, props.href.includes('t.me/clixen_bot'), 
          `UTM: ${props.href.includes('utm_source')}`)
      })

      // Test 4: Display Text
      const displayText = getBotDisplayText(deviceInfo.isMobile)
      addTestResult('Display Text Generation', !!displayText.primary, 
        `${displayText.icon} ${displayText.primary} - ${displayText.secondary}`)

    } catch (error) {
      addTestResult('Test Suite Error', false, error.message)
    } finally {
      setTesting(false)
    }
  }

  const testBotAccess = (preset: keyof typeof BotAccessPresets) => {
    trackBotAccess(`test_${preset.toLowerCase()}`)
    openTelegramBot(BotAccessPresets[preset])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Telegram Bot Access Test</h1>
          </div>
          <p className="text-gray-600">Test deep linking and bot access functionality across different devices</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Device Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              {deviceInfo.isMobile ? (
                <Smartphone className="w-6 h-6 text-green-600" />
              ) : (
                <Monitor className="w-6 h-6 text-blue-600" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">Device Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className={`w-4 h-4 ${deviceInfo.isMobile ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="font-medium text-gray-700">Mobile Device</span>
                  </div>
                  <p className="text-sm text-gray-600">{deviceInfo.isMobile ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className={`w-4 h-4 ${deviceInfo.isIOS ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="font-medium text-gray-700">iOS</span>
                  </div>
                  <p className="text-sm text-gray-600">{deviceInfo.isIOS ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className={`w-4 h-4 ${deviceInfo.isAndroid ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="font-medium text-gray-700">Android</span>
                  </div>
                  <p className="text-sm text-gray-600">{deviceInfo.isAndroid ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Monitor className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-700">Platform</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-1">User Agent</h4>
                <p className="text-xs text-gray-600 break-all">{deviceInfo.userAgent}</p>
              </div>
            </div>
          </div>

          {/* Bot Access Controls */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Bot Access Tests</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(BotAccessPresets).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => testBotAccess(preset as keyof typeof BotAccessPresets)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between"
                  >
                    <span>{preset.replace('_', ' ')}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={runAllTests}
                  disabled={testing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-5 h-5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Running Tests...' : 'Run All Tests'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Examples */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Live Bot Access Examples</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Hero Style */}
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-3">Hero CTA Style</h3>
              <a 
                {...getBotButtonProps('LANDING_HERO')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Bot className="w-5 h-5" />
                <span>Try @clixen_bot</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Dashboard Style */}
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-3">Dashboard Style</h3>
              <a 
                {...getBotButtonProps('DASHBOARD')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Open Bot</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Navigation Style */}
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-3">Navigation Style</h3>
              <a 
                {...getBotButtonProps('NAVIGATION')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>@clixen_bot</span>
              </a>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.test}
                      </h4>
                      <span className={`text-xs ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.timestamp}
                      </span>
                    </div>
                    {result.details && (
                      <p className={`text-sm mt-1 break-all ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Landing
            </a>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
              Go to Dashboard
            </a>
            <a href="/test-auth" className="text-blue-600 hover:text-blue-700 font-medium">
              Test Authentication
            </a>
            <a href="/debug" className="text-blue-600 hover:text-blue-700 font-medium">
              System Debug
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
