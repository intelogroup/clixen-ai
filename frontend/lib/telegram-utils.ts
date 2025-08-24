/**
 * Telegram Bot Deep Linking Utilities
 * Handles opening Telegram bot on different platforms and devices
 */

const BOT_USERNAME = 'clixen_bot'

export interface TelegramLinkOptions {
  startParam?: string
  text?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

/**
 * Detects if user is on mobile device
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Detects if user is on iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Detects if user is on Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

/**
 * Creates a Telegram bot link with optional parameters
 */
export const createTelegramBotLink = (options: TelegramLinkOptions = {}): string => {
  const baseUrl = `https://t.me/${BOT_USERNAME}`
  const params = new URLSearchParams()
  
  if (options.startParam) {
    params.append('start', options.startParam)
  }
  
  if (options.text) {
    params.append('text', options.text)
  }
  
  // Add UTM parameters for analytics
  if (options.utm_source) params.append('utm_source', options.utm_source)
  if (options.utm_medium) params.append('utm_medium', options.utm_medium)
  if (options.utm_campaign) params.append('utm_campaign', options.utm_campaign)
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Creates a deep link that tries to open Telegram app first, then web
 */
export const createDeepLink = (options: TelegramLinkOptions = {}): string => {
  if (isMobile()) {
    // For mobile, create a universal link that works with both app and web
    return createTelegramBotLink(options)
  }
  
  // For desktop, always use web version
  return createTelegramBotLink(options)
}

/**
 * Opens Telegram bot with smart platform detection
 */
export const openTelegramBot = (options: TelegramLinkOptions = {}): void => {
  const link = createDeepLink(options)
  
  if (isMobile()) {
    // Try to open in app first, fallback to web
    const appLink = `tg://resolve?domain=${BOT_USERNAME}`
    
    try {
      // Try to open in Telegram app
      window.location.href = appLink
      
      // Fallback to web version after a delay
      setTimeout(() => {
        window.open(link, '_blank', 'noopener,noreferrer')
      }, 1000)
    } catch (error) {
      // If app link fails, open web version
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  } else {
    // Desktop: open in new tab
    window.open(link, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Analytics tracking for bot access
 */
export const trackBotAccess = (source: string, action: string = 'click'): void => {
  // Log for debugging
  console.log('🤖 [TELEGRAM] Bot access tracked:', { source, action, timestamp: new Date().toISOString() })
  
  // You can integrate with analytics services here
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'telegram_bot_access', {
      event_category: 'engagement',
      event_label: source,
      value: 1
    })
  }
}

/**
 * Bot access presets for different sections
 */
export const BotAccessPresets = {
  LANDING_HERO: {
    utm_source: 'landing',
    utm_medium: 'hero_cta',
    utm_campaign: 'signup_flow',
    startParam: 'landing_hero'
  },
  LANDING_CTA: {
    utm_source: 'landing',
    utm_medium: 'bottom_cta',
    utm_campaign: 'signup_flow',
    startParam: 'landing_cta'
  },
  DASHBOARD: {
    utm_source: 'dashboard',
    utm_medium: 'main_cta',
    utm_campaign: 'user_engagement',
    startParam: 'dashboard'
  },
  NAVIGATION: {
    utm_source: 'navigation',
    utm_medium: 'header',
    utm_campaign: 'user_engagement',
    startParam: 'nav'
  },
  ONBOARDING: {
    utm_source: 'onboarding',
    utm_medium: 'tutorial',
    utm_campaign: 'user_activation',
    startParam: 'onboarding'
  }
} as const

/**
 * Smart bot button component props helper
 */
export const getBotButtonProps = (preset: keyof typeof BotAccessPresets) => {
  const options = BotAccessPresets[preset]
  
  return {
    href: createTelegramBotLink(options),
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      trackBotAccess(preset.toLowerCase())
      openTelegramBot(options)
    },
    target: '_blank',
    rel: 'noopener noreferrer'
  }
}

/**
 * Get user-friendly display text for bot access
 */
export const getBotDisplayText = (mobile: boolean = isMobile()): {
  primary: string
  secondary: string
  icon: string
} => {
  if (mobile) {
    return {
      primary: 'Open @clixen_bot',
      secondary: 'Start automating now',
      icon: '📱'
    }
  }
  
  return {
    primary: 'Message @clixen_bot',
    secondary: 'Open in Telegram',
    icon: '💬'
  }
}

/**
 * Check if Telegram is likely installed
 */
export const isTelegramLikelyInstalled = (): boolean => {
  if (!isMobile()) return false
  
  // This is a heuristic - we can't definitively know if Telegram is installed
  // but we can make educated guesses based on user agent and previous interactions
  return true // Assume most mobile users can access Telegram
}
