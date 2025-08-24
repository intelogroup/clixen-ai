import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('🎯 [TRIAL API] Starting free trial...')
  
  try {
    const body = await request.json()
    const { userId, trialStartDate, trialEndDate, trialCredits } = body
    
    if (!userId || !trialStartDate || !trialEndDate || !trialCredits) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      console.error('🎯 [TRIAL API] Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user profile to verify eligibility
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('🎯 [TRIAL API] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check trial eligibility
    if (profile.tier !== 'free') {
      return NextResponse.json(
        { error: 'Trial only available for free tier users' },
        { status: 400 }
      )
    }

    if (profile.trial_started_at) {
      return NextResponse.json(
        { error: 'Trial already used' },
        { status: 400 }
      )
    }

    // Check if signup was recent (within 24 hours)
    const signupDate = new Date(profile.created_at)
    const now = new Date()
    const hoursSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceSignup > 24) {
      return NextResponse.json(
        { error: 'Trial period expired. Must start within 24 hours of signup.' },
        { status: 400 }
      )
    }

    // Update user profile with trial information
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_started_at: trialStartDate,
        trial_expires_at: trialEndDate,
        credits_remaining: profile.credits_remaining + trialCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('🎯 [TRIAL API] Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to start trial' },
        { status: 500 }
      )
    }

    // Log trial start event
    const { error: logError } = await supabase
      .from('workflow_executions')
      .insert({
        user_id: userId,
        workflow_type: 'trial_started',
        status: 'completed',
        credits_used: 0,
        execution_data: {
          trial_start: trialStartDate,
          trial_end: trialEndDate,
          credits_granted: trialCredits,
        },
      })

    if (logError) {
      console.warn('🎯 [TRIAL API] Logging failed:', logError)
      // Don't fail the request if logging fails
    }

    console.log('✅ [TRIAL API] Trial started successfully for user:', userId)
    console.log('📊 [TRIAL API] Trial details:', {
      start: trialStartDate,
      end: trialEndDate,
      credits: trialCredits,
    })

    return NextResponse.json({
      success: true,
      message: 'Free trial started successfully!',
      trial: {
        startDate: trialStartDate,
        endDate: trialEndDate,
        credits: trialCredits,
        daysRemaining: 7,
      },
    })

  } catch (error) {
    console.error('🎯 [TRIAL API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}