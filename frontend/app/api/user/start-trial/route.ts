import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('🔐 [START-TRIAL] Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 [START-TRIAL] Starting trial for user:', user.email)

    // Check if user already has a profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('📋 [START-TRIAL] Error fetching profile:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Calculate trial dates
    const now = new Date()
    const trialExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    if (existingProfile) {
      // Update existing profile to activate trial
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          trial_active: true,
          trial_started_at: now.toISOString(),
          trial_expires_at: trialExpires.toISOString(),
          tier: 'trial',
          credits_remaining: 50,
          updated_at: now.toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('📋 [START-TRIAL] Error updating profile:', updateError)
        return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 })
      }

      console.log('✅ [START-TRIAL] Trial activated for existing user')
      return NextResponse.json({ 
        success: true, 
        message: 'Trial activated successfully',
        profile: updatedProfile
      })
    } else {
      // Create new profile with trial
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          trial_active: true,
          trial_started_at: now.toISOString(),
          trial_expires_at: trialExpires.toISOString(),
          tier: 'trial',
          credits_remaining: 50,
          credits_used: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('📋 [START-TRIAL] Error creating profile:', createError)
        return NextResponse.json({ error: 'Failed to create trial account' }, { status: 500 })
      }

      console.log('✅ [START-TRIAL] Trial profile created for new user')
      return NextResponse.json({ 
        success: true, 
        message: 'Trial account created successfully',
        profile: newProfile
      })
    }

  } catch (error) {
    console.error('🚨 [START-TRIAL] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
