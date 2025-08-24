'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser/client components
 * Singleton pattern to ensure single instance
 */
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!client) {
    console.log('🔐 [CLIENT] Creating Supabase browser client')
    
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            if (typeof document === 'undefined') return undefined

            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1]

            console.log(`🍪 [CLIENT] Getting cookie ${name}:`, value ? 'found' : 'not found')
            return value
          },
          set(name: string, value: string, options: any) {
            if (typeof document === 'undefined') return

            console.log(`🍪 [CLIENT] Setting cookie ${name}`)

            let cookieString = `${name}=${value}`

            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`
            }
            if (options?.expires) {
              cookieString += `; Expires=${options.expires.toUTCString()}`
            }
            if (options?.path) {
              cookieString += `; Path=${options.path}`
            }
            if (options?.domain) {
              cookieString += `; Domain=${options.domain}`
            }
            if (options?.secure) {
              cookieString += `; Secure`
            }
            if (options?.sameSite) {
              cookieString += `; SameSite=${options.sameSite}`
            }

            document.cookie = cookieString
          },
          remove(name: string, options: any) {
            if (typeof document === 'undefined') return

            console.log(`🍪 [CLIENT] Removing cookie ${name}`)

            let cookieString = `${name}=; Max-Age=0`

            if (options?.path) {
              cookieString += `; Path=${options.path}`
            }
            if (options?.domain) {
              cookieString += `; Domain=${options.domain}`
            }

            document.cookie = cookieString
          }
        }
      }
    )
  }
  
  return client
}

// Export a default instance for backward compatibility
export const supabase = createClient()
