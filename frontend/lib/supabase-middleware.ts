import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client specifically for middleware
 * Handles session refresh and cookie management for auth flow
 * Following latest Supabase SSR patterns
 */
export async function updateSession(request: NextRequest) {
  console.log(`🔒 [MIDDLEWARE] Processing: ${request.nextUrl.pathname}`)

  // Create response object - this is required for proper cookie handling
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  // A simple mistake could make it very hard to debug issues with users being randomly logged out

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.log('🔒 [MIDDLEWARE] Auth error:', error.message)
  }

  console.log('🔒 [MIDDLEWARE] User authenticated:', user ? `Yes (${user.email})` : 'No')

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/profile', '/bot-access', '/subscription']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Auth callback routes - let them through without any checks
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    console.log('🔒 [MIDDLEWARE] Allowing auth route to proceed')
    return supabaseResponse
  }

  // Handle protected routes without authentication
  if (isProtectedPath && !user) {
    console.log('🔒 [MIDDLEWARE] Redirecting to login - protected route without auth')
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('auth', 'true')
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from landing page to dashboard
  // BUT only if they're not in an auth flow (no query params)
  if (request.nextUrl.pathname === '/' && user) {
    const searchParams = request.nextUrl.searchParams
    const hasAuthParams = searchParams.has('auth') || searchParams.has('redirect') ||
                         searchParams.has('error') || searchParams.has('code')

    if (!hasAuthParams) {
      console.log('🔒 [MIDDLEWARE] Redirecting authenticated user to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      console.log('🔒 [MIDDLEWARE] Authenticated user on landing with auth params - allowing')
    }
  }

  console.log('🔒 [MIDDLEWARE] Allowing request to proceed')

  // IMPORTANT: You *must* return the supabaseResponse object as it is
  return supabaseResponse
}
