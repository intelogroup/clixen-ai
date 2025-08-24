import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET() {
  try {
    console.log('🔗 Testing Supabase connection...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment check:', {
      url: supabaseUrl ? 'Found' : 'Missing',
      serviceKey: supabaseServiceKey ? 'Found' : 'Missing',
      nodeEnv: process.env.NODE_ENV
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials',
        details: {
          url: supabaseUrl ? 'Found' : 'Missing',
          serviceKey: supabaseServiceKey ? 'Found' : 'Missing'
        }
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test basic connection by checking profiles table
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message
      }, { status: 500 })
    }
    
    // Check if essential tables exist
    const tablesToCheck = ['profiles', 'usage_logs', 'telegram_temp_users', 'user_audit_log']
    const tableStatus = {}
    
    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        tableStatus[table] = error ? `Error: ${error.message}` : 'Found'
      } catch (err) {
        tableStatus[table] = `Error: ${err.message}`
      }
    }
    
    // Check for existing test user
    const testEmail = 'test@clixen.app'
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    let userStatus = 'Not found'
    if (existingUser) {
      userStatus = {
        email: existingUser.email,
        id: existingUser.id,
        tier: existingUser.tier,
        trial_active: existingUser.trial_active,
        quota_used: existingUser.quota_used || 0,
        quota_limit: existingUser.quota_limit || 50
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      data: {
        connection: 'OK',
        url: supabaseUrl,
        tables: tableStatus,
        testUser: userStatus
      }
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('👤 Creating test user...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const testEmail = 'test@clixen.app'
    const testPassword = 'TestPassword123!'
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        user: {
          email: existingUser.email,
          id: existingUser.id,
          tier: existingUser.tier,
          trial_active: existingUser.trial_active
        }
      })
    }
    
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Auth user creation failed',
        details: authError.message
      }, { status: 500 })
    }
    
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        auth_user_id: authUser.user.id,
        email: testEmail,
        tier: 'free',
        trial_active: true,
        trial_started_at: new Date().toISOString(),
        trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        quota_used: 0,
        quota_limit: 50
      })
      .select()
      .single()
    
    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Profile creation failed',
        details: profileError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully!',
      user: {
        email: profile.email,
        id: profile.id,
        tier: profile.tier,
        trial_active: profile.trial_active,
        trial_expires: profile.trial_expires_at
      }
    })
    
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'User creation failed',
      details: error.message
    }, { status: 500 })
  }
}
