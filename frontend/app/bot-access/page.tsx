'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  Clock,
  Shield,
  Bot,
  Sparkles,
  Terminal,
  Rocket
} from 'lucide-react'

export default function BotAccessPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const TELEGRAM_BOT_LINK = 'https://t.me/ClixenAIBot'
  const BOT_USERNAME = '@ClixenAIBot'

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/?auth=true')
        return
      }

      // Get user profile with subscription info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUser(user)
      setSubscription(profile)
      
      // Check if user has active subscription (free tier users need to upgrade)
      if (!profile?.tier || profile.tier === 'free') {
        router.push('/subscription')
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="default">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium Access Activated
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Clixen AI Bot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your AI automation assistant is ready to help you build powerful workflows
          </p>
        </div>

        {/* Main Access Card */}
        <Card className="mb-8 border-2 border-blue-500/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bot className="w-8 h-8 text-blue-600" />
              Access Your AI Assistant
            </CardTitle>
            <CardDescription className="text-lg">
              Connect with our Telegram bot to start automating
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Quick Start
                </h3>
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(TELEGRAM_BOT_LINK, '_blank')}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Open Telegram Bot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={BOT_USERNAME}
                      className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(BOT_USERNAME)}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Your Access Code
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Use this code to authenticate with the bot:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border rounded font-mono text-sm">
                      {user?.id?.slice(0, 8).toUpperCase()}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(user?.id?.slice(0, 8).toUpperCase() || '')}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                Step 1: Connect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the button above or search for {BOT_USERNAME} in Telegram
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Step 2: Authenticate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send /start and enter your access code when prompted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-600" />
                Step 3: Automate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe your automation needs in natural language
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Available Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Bot Commands</CardTitle>
            <CardDescription>
              Use these commands to interact with the bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/start</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Initialize and authenticate</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/new</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Create a new automation</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/templates</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Browse pre-built templates</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/list</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400">View your automations</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/status</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Check automation status</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/help</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Get help and documentation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        {subscription && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your Plan: <Badge variant="default">{subscription.tier || 'Premium'}</Badge>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Credits Remaining: <span className="font-semibold">{subscription.credits_remaining || 0}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}