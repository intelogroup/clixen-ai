'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  ArrowRight, 
  Bot, 
  Sparkles,
  Gift,
  Zap,
  Clock
} from 'lucide-react'

export default function PaymentSuccessPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkPaymentAndUser()
  }, [])

  async function checkPaymentAndUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/?auth=true')
        return
      }

      // Get updated user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUser(user)
      setProfile(profile)

      // Auto-redirect to bot access after 5 seconds
      setTimeout(() => {
        router.push('/bot-access')
      }, 5000)
      
    } catch (error) {
      console.error('Error checking payment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    )
  }

  const planName = profile?.tier === 'starter' ? 'Starter' : 
                   profile?.tier === 'pro' ? 'Professional' : 
                   profile?.tier === 'enterprise' ? 'Enterprise' : 'Premium'
  
  const credits = profile?.credits_remaining || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-green-600">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Welcome to your new {planName} plan
          </p>
        </div>

        {/* Success Details */}
        <Card className="mb-8 border-2 border-green-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Gift className="w-8 h-8 text-green-600" />
              Subscription Activated
            </CardTitle>
            <CardDescription className="text-lg">
              Your automation journey starts now!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-600 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <span className="text-lg font-semibold">{planName} Plan</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span>{credits} automation credits available</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span>Telegram bot access granted</span>
                </div>
                {sessionId && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Session ID: {sessionId.slice(0, 20)}...</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What's Next?</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                      1
                    </div>
                    <span className="text-sm">Access your Telegram bot</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                      2
                    </div>
                    <span className="text-sm">Get your unique access code</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                      3
                    </div>
                    <span className="text-sm">Start building automations</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/bot-access')}
          >
            <Bot className="mr-2 h-5 w-5" />
            Access Telegram Bot
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Auto-redirect notice */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>You'll be automatically redirected to bot access in 5 seconds</span>
          </div>
        </div>

        {/* Receipt Info */}
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Receipt & Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>✅ Payment processed successfully</p>
            <p>✅ Subscription activated</p>
            <p>✅ Credits added to your account</p>
            <p>📧 Confirmation email sent to {user?.email}</p>
            <p>📱 Telegram bot access is now available</p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                Need Help?
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Visit our documentation or contact support if you have any questions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}