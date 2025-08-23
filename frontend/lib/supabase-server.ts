import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server components with proper cookie handling
 * This ensures session persistence between client and server
 */
export function createClient() {
  const cookieStore = cookies()

  console.log('🔐 [SERVER] Creating Supabase server client with cookie handling')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          console.log(`🍪 [SERVER] Getting cookie ${name}:`, cookie ? 'found' : 'not found')
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`🍪 [SERVER] Setting cookie ${name}`)
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('🍪 [SERVER] Cookie set error (expected in Server Components):', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          console.log(`🍪 [SERVER] Removing cookie ${name}`)
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.log('🍪 [SERVER] Cookie remove error (expected in Server Components):', error)
          }
        }
      }
    }
  )
}