import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client specifically for middleware
 * Handles session refresh and cookie management for auth flow
 */
export async function updateSession(request: NextRequest) {
  console.log(`🔒 [MIDDLEWARE] Processing: ${request.nextUrl.pathname}`)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          console.log(`🍪 [MIDDLEWARE] Cookie ${name}:`, value ? 'exists' : 'missing')
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`🍪 [MIDDLEWARE] Setting cookie ${name}`)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log(`🍪 [MIDDLEWARE] Removing cookie ${name}`)
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session on every request to keep it alive
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.log('🔒 [MIDDLEWARE] Auth error:', error.message)
  }
  
  console.log('🔒 [MIDDLEWARE] User authenticated:', user ? `Yes (${user.email})` : 'No')

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/profile', '/bot-access', '/subscription']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Handle protected routes
  if (isProtectedPath && !user) {
    console.log('🔒 [MIDDLEWARE] Redirecting to login - protected route without auth')
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('auth', 'true')
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Handle auth callback - allow through without redirect
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    console.log('🔒 [MIDDLEWARE] Allowing auth callback to proceed')
    return response
  }

  // Redirect authenticated users from landing page to dashboard 
  // (unless they have specific params or are forcing landing page)
  if (request.nextUrl.pathname === '/' && user && 
      !request.nextUrl.searchParams.has('force') && 
      !request.nextUrl.searchParams.has('auth') &&
      !request.nextUrl.searchParams.has('redirect')) {
    console.log('🔒 [MIDDLEWARE] Redirecting authenticated user to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('🔒 [MIDDLEWARE] Allowing request to proceed')
  return response
}