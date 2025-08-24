import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Check if email exists in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error && error.code === 'PGRST116') {
      // Email not found (PGRST116 = no rows returned)
      return NextResponse.json({ exists: false })
    } else if (error) {
      console.error('🔍 [EMAIL-CHECK] Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    } else {
      // Email found
      return NextResponse.json({ exists: true })
    }

  } catch (error) {
    console.error('🚨 [EMAIL-CHECK] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
