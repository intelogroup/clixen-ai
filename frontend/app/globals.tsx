'use client'

// Global error handling and logging
console.log('🚀 B2C Automation Platform - Starting Up...')
console.log('🔧 Environment:', process.env.NODE_ENV)
console.log('🔧 Next.js version: 14.0.4')

// Environment variables check
console.log('🔍 Environment Variables Check:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING')
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING')
console.log('- N8N_API_KEY:', process.env.N8N_API_KEY ? '✅ SET' : '❌ MISSING')
console.log('- N8N_BASE_URL:', process.env.N8N_BASE_URL ? '✅ SET' : '❌ MISSING')

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error)
    console.error('🚨 Error details:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason)
  })

  // Log when the page is fully loaded
  window.addEventListener('load', () => {
    console.log('🎉 Page fully loaded!')
    console.log('🔍 Current URL:', window.location.href)
    console.log('🔍 User Agent:', navigator.userAgent.substring(0, 100) + '...')
  })
}