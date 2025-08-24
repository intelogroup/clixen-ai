import { createClient } from '../../../lib/supabase-server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 [AUTH CALLBACK] Processing auth callback...')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirect_to') ?? '/dashboard'

  if (code) {
    console.log('🔐 [AUTH CALLBACK] Found auth code, exchanging for session...')
    
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ [AUTH CALLBACK] Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
    }

    if (data?.session?.user) {
      console.log('✅ [AUTH CALLBACK] Session exchange successful for user:', data.session.user.email)
      
      // Ensure user profile exists
      try {
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.session.user.id)
          .single()
        
        if (!existingProfile && fetchError?.code === 'PGRST116') {
          console.log('👤 [AUTH CALLBACK] Creating user profile...')

          // Prepare profile data for new isolation schema
          const profileData = {
            auth_user_id: data.session.user.id, // Use auth_user_id instead of id
            email: data.session.user.email,
            full_name: data.session.user.user_metadata?.full_name || null,
            tier: 'free',
            trial_active: true,
            trial_started_at: new Date().toISOString(),
            trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            quota_limit: 50, // Use quota_limit instead of credits_remaining
            quota_used: 0,   // Use quota_used instead of credits_used
            last_activity_at: new Date().toISOString(),
            user_metadata: {}
          }

          console.log('👤 [AUTH CALLBACK] Profile data to insert:', JSON.stringify(profileData, null, 2))

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData)
          
          if (insertError) {
            console.error('❌ [AUTH CALLBACK] Error creating profile:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code,
              fullError: JSON.stringify(insertError, null, 2)
            })
          } else {
            console.log('✅ [AUTH CALLBACK] User profile created successfully')
          }
        } else if (existingProfile) {
          console.log('✅ [AUTH CALLBACK] User profile already exists')
        }
      } catch (profileError) {
        console.error('❌ [AUTH CALLBACK] Profile handling error:', {
          message: profileError instanceof Error ? profileError.message : 'Unknown error',
          stack: profileError instanceof Error ? profileError.stack : undefined,
          fullError: JSON.stringify(profileError, null, 2)
        })
        // Continue with redirect even if profile creation fails
      }
      
      // Redirect to the intended destination
      console.log('🔄 [AUTH CALLBACK] Redirecting to:', redirectTo)
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  console.log('❌ [AUTH CALLBACK] No code provided or session creation failed')
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
