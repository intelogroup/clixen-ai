// 7-Day Free Trial System
// Allows new users to access bot features for 7 days before requiring payment

interface TrialStatus {
  isActive: boolean
  daysRemaining: number
  expiryDate: Date | null
  isExpired: boolean
  creditsRemaining: number
}

interface UserProfile {
  id: string
  email: string
  tier: string
  credits_remaining: number
  trial_started_at?: string
  trial_expires_at?: string
  created_at: string
}

export class TrialSystem {
  private static TRIAL_DURATION_DAYS = 7
  private static TRIAL_CREDITS = 50

  // Check if user is eligible for free trial
  static isEligibleForTrial(profile: UserProfile): boolean {
    // User is eligible if:
    // 1. They are on free tier
    // 2. They haven't started a trial yet
    // 3. They signed up recently (within 24 hours to prevent abuse)
    
    if (profile.tier !== 'free') {
      return false
    }

    if (profile.trial_started_at) {
      return false // Already used trial
    }

    const signupDate = new Date(profile.created_at)
    const now = new Date()
    const hoursSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60)
    
    // Allow trial activation within 24 hours of signup
    return hoursSinceSignup <= 24
  }

  // Start free trial for user
  static async startTrial(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialStartDate.getDate() + this.TRIAL_DURATION_DAYS)

      // Update user profile with trial dates and credits
      const response = await fetch('/api/user/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          trialCredits: this.TRIAL_CREDITS,
        }),
      })

      if (response.ok) {
        return {
          success: true,
          message: `🎉 Free trial started! You have ${this.TRIAL_DURATION_DAYS} days with ${this.TRIAL_CREDITS} credits.`,
        }
      } else {
        return {
          success: false,
          message: 'Failed to start trial. Please try again.',
        }
      }
    } catch (error) {
      console.error('Trial start error:', error)
      return {
        success: false,
        message: 'Error starting trial. Please contact support.',
      }
    }
  }

  // Get trial status for user
  static getTrialStatus(profile: UserProfile): TrialStatus {
    // If user is not on free tier, no trial needed
    if (profile.tier !== 'free') {
      return {
        isActive: false,
        daysRemaining: 0,
        expiryDate: null,
        isExpired: false,
        creditsRemaining: profile.credits_remaining,
      }
    }

    // If no trial started, return default
    if (!profile.trial_started_at || !profile.trial_expires_at) {
      return {
        isActive: false,
        daysRemaining: 0,
        expiryDate: null,
        isExpired: false,
        creditsRemaining: profile.credits_remaining,
      }
    }

    const now = new Date()
    const expiryDate = new Date(profile.trial_expires_at)
    const msRemaining = expiryDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
    const isExpired = msRemaining <= 0
    const isActive = !isExpired && daysRemaining > 0

    return {
      isActive,
      daysRemaining: Math.max(0, daysRemaining),
      expiryDate,
      isExpired,
      creditsRemaining: profile.credits_remaining,
    }
  }

  // Check if user has bot access (paid or trial)
  static hasBotAccess(profile: UserProfile): boolean {
    // Paid users always have access
    if (profile.tier !== 'free') {
      return true
    }

    // Check trial status for free users
    const trialStatus = this.getTrialStatus(profile)
    return trialStatus.isActive
  }

  // Get access status message for UI
  static getAccessStatusMessage(profile: UserProfile): {
    hasAccess: boolean
    message: string
    type: 'success' | 'warning' | 'error' | 'info'
    ctaText?: string
    ctaAction?: string
  } {
    if (profile.tier !== 'free') {
      return {
        hasAccess: true,
        message: `Premium access active - ${profile.credits_remaining} credits remaining`,
        type: 'success',
      }
    }

    const trialStatus = this.getTrialStatus(profile)

    if (trialStatus.isActive) {
      return {
        hasAccess: true,
        message: `Free trial active - ${trialStatus.daysRemaining} days remaining (${trialStatus.creditsRemaining} credits)`,
        type: trialStatus.daysRemaining <= 2 ? 'warning' : 'info',
        ctaText: trialStatus.daysRemaining <= 2 ? 'Upgrade Now' : 'View Plans',
        ctaAction: 'upgrade',
      }
    }

    if (trialStatus.isExpired) {
      return {
        hasAccess: false,
        message: 'Your free trial has expired. Upgrade to continue using the bot.',
        type: 'error',
        ctaText: 'Upgrade Now',
        ctaAction: 'upgrade',
      }
    }

    // No trial started yet
    if (this.isEligibleForTrial(profile)) {
      return {
        hasAccess: false,
        message: `Start your ${this.TRIAL_DURATION_DAYS}-day free trial with ${this.TRIAL_CREDITS} credits!`,
        type: 'info',
        ctaText: 'Start Free Trial',
        ctaAction: 'start-trial',
      }
    }

    // Not eligible for trial
    return {
      hasAccess: false,
      message: 'Subscription required to access the bot.',
      type: 'error',
      ctaText: 'Choose Plan',
      ctaAction: 'upgrade',
    }
  }

  // Format trial expiry for display
  static formatTimeRemaining(expiryDate: Date): string {
    const now = new Date()
    const msRemaining = expiryDate.getTime() - now.getTime()
    
    if (msRemaining <= 0) {
      return 'Expired'
    }

    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`
    }
  }

  // Analytics tracking for trial system
  static trackTrialEvent(event: string, userId: string, properties?: Record<string, any>) {
    // Integration with analytics system
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(`trial_${event}`, {
        user_id: userId,
        ...properties,
      })
    }
    
    console.log(`🎯 [TRIAL] ${event}:`, { userId, ...properties })
  }
}

// Export utility functions
export const isTrialActive = (profile: UserProfile) => TrialSystem.getTrialStatus(profile).isActive
export const hasBotAccess = (profile: UserProfile) => TrialSystem.hasBotAccess(profile)
export const getAccessStatus = (profile: UserProfile) => TrialSystem.getAccessStatusMessage(profile)
export const canStartTrial = (profile: UserProfile) => TrialSystem.isEligibleForTrial(profile)