import { updateSession } from './lib/supabase-middleware'

export async function middleware(request) {
  console.log(`🔒 [MIDDLEWARE] Processing request: ${request.nextUrl.pathname}`)

  try {
    return await updateSession(request)
  } catch (error) {
    console.error('🚨 [MIDDLEWARE] Error processing request:', error)
    // Return the original request if middleware fails
    return new Response(null, { status: 200 })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Supabase auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
