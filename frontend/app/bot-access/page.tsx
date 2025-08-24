'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { supabase } from '../../lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import GlobalNavigation from '../../components/GlobalNavigation'
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
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const router = useRouter()

  const TELEGRAM_BOT_LINK = 'https://t.me/clixen_bot'
  const BOT_USERNAME = '@clixen_bot'

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/?auth=true')
      return
    }

    checkAuth()
  }, [user, authLoading, router])

  async function checkAuth() {
    try {
      // Get user profile with subscription info
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('🔐 [BOT-ACCESS] Error fetching profile:', error)
        router.push('/subscription')
        return
      }

      setSubscription(profile)

      // Check if user has access (trial, paid plan, or valid subscription)
      const hasAccess = profile && (
        profile.trial_active ||
        (profile.tier && profile.tier !== 'free') ||
        profile.credits_remaining > 0
      )

      if (!hasAccess) {
        console.log('🚫 [BOT-ACCESS] User does not have bot access, redirecting to subscription')
        router.push('/subscription')
        return
      }

      console.log('✅ [BOT-ACCESS] User has bot access:', profile.tier, 'Trial:', profile.trial_active)
    } catch (error) {
      console.error('🚨 [BOT-ACCESS] Auth error:', error)
      router.push('/subscription')
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
    <div className="min-h-screen bg-gray-50">
      <GlobalNavigation user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="default">
            <Sparkles className="w-3 h-3 mr-1" />
            {subscription?.trial_active
              ? 'Free Trial Active'
              : subscription?.tier === 'free'
                ? 'Free Access'
                : 'Premium Access Activated'
            }
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Clixen AI Bot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {subscription?.trial_active
              ? 'Your 7-day free trial is active! Start automating your workflows now.'
              : 'Your AI automation assistant is ready to help you build powerful workflows'
            }
          </p>
          {subscription?.trial_active && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4 mr-2" />
              Trial expires in {Math.max(0, Math.ceil((new Date(subscription.trial_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
            </div>
          )}
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
          <div className="mt-8">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Plan</p>
                    <Badge variant={subscription.trial_active ? "secondary" : "default"} className="text-sm">
                      {subscription.trial_active
                        ? 'Free Trial'
                        : subscription.tier === 'free'
                          ? 'Free'
                          : subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1) || 'Premium'
                      }
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Credits Available</p>
                    <span className="font-semibold text-lg">{subscription.credits_remaining || 0}</span>
                  </div>
                </div>

                {subscription.trial_active && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      🎉 Free Trial Active
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Enjoying the bot? <a href="/subscription" className="underline hover:text-blue-600">Upgrade to continue</a> after your trial ends.
                    </p>
                  </div>
                )}

                {!subscription.trial_active && subscription.tier === 'free' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      Limited Access
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      <a href="/subscription" className="underline hover:text-yellow-600">Upgrade your plan</a> for unlimited automations.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
