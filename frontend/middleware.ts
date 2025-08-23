import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // IMPORTANT: Refresh session on every request to keep it alive
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.log('🔒 [MIDDLEWARE] Auth error:', error.message)
  }
  
  console.log('🔒 [MIDDLEWARE] User authenticated:', user ? `Yes (${user.email})` : 'No')

  // Protected routes
  const protectedPaths = ['/dashboard', '/profile', '/bot-access', '/subscription']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    console.log('🔒 [MIDDLEWARE] Redirecting to login - protected route without auth')
    // Redirect to landing page with auth modal trigger
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('auth', 'true')
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from landing to dashboard (unless forced or has params)
  if (request.nextUrl.pathname === '/' && user && 
      !request.nextUrl.searchParams.has('force') && 
      !request.nextUrl.searchParams.has('auth')) {
    console.log('🔒 [MIDDLEWARE] Redirecting authenticated user to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('🔒 [MIDDLEWARE] Allowing request to proceed')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}