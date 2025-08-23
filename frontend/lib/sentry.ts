import * as Sentry from '@sentry/nextjs'

// Sentry configuration
export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://your-dsn@sentry.io/project-id',
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    debug: process.env.NODE_ENV === 'development',
    beforeSend(event) {
      // Enhanced logging for development
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Sentry Error:', event)
      }
      return event
    },
    integrations: [],
  })
}

// Custom error logging function
export function logError(error: any, context?: any) {
  console.error('🔥 ERROR:', error, context ? { context } : '')
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context
    })
  }
}

// API error logging
export function logApiError(endpoint: string, error: any, request?: any) {
  const errorInfo = {
    endpoint,
    error: error.message || error,
    request: request ? {
      method: request.method,
      url: request.url,
      headers: request.headers,
    } : null,
    timestamp: new Date().toISOString()
  }
  
  console.error('🚨 API ERROR:', errorInfo)
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { type: 'api_error', endpoint },
      extra: errorInfo
    })
  }
}

// Authentication error logging
export function logAuthError(action: string, error: any, userId?: string) {
  const errorInfo = {
    action,
    error: error.message || error,
    userId,
    timestamp: new Date().toISOString()
  }
  
  console.error('🔐 AUTH ERROR:', errorInfo)
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { type: 'auth_error', action },
      extra: errorInfo,
      user: userId ? { id: userId } : undefined
    })
  }
}

// Payment error logging
export function logPaymentError(stage: string, error: any, userId?: string, planId?: string) {
  const errorInfo = {
    stage,
    error: error.message || error,
    userId,
    planId,
    timestamp: new Date().toISOString()
  }
  
  console.error('💳 PAYMENT ERROR:', errorInfo)
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { type: 'payment_error', stage },
      extra: errorInfo,
      user: userId ? { id: userId } : undefined
    })
  }
}