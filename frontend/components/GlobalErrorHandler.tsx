'use client'

import { useEffect } from 'react'

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Global error logging for client-side
    console.log('🚀 B2C Automation Platform - Starting Up...')
    console.log('🔧 Environment:', process.env.NODE_ENV)
    console.log('🔧 Next.js version: 14.0.4')

    // Environment variables check
    console.log('🔍 Environment Variables Check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING')

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global Error:', event.error)
      console.error('🚨 Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason)
    }

    const handleLoad = () => {
      console.log('🎉 Page fully loaded!')
      console.log('🔍 Current URL:', window.location.href)
      console.log('🔍 User Agent:', navigator.userAgent.substring(0, 100) + '...')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('load', handleLoad)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  return null
}