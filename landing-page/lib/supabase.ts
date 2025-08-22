import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client
export const createBrowserClient = () => 
  createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })

// Server-side Supabase client
export const createServerClient = () => 
  createServerComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
    cookies,
  })

// Service role client for admin operations
export const createServiceClient = () => 
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })

// Database types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  tier: 'free' | 'pro' | 'enterprise'
  api_key: string
  telegram_id: string | null
  credits_remaining: number
  credits_used: number
  onboarding_completed: boolean
  preferences: {
    notifications: {
      email: boolean
      push: boolean
    }
    timezone: string
    language: string
  }
  created_at: string
  updated_at: string
}

export interface WorkflowExecution {
  id: string
  user_id: string
  workflow_type: string
  workflow_name: string | null
  execution_id: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
  input_data: any
  output_data: any
  error_details: any
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  credits_consumed: number
}

export interface DocumentAnalytics {
  id: string
  user_id: string
  execution_id: string
  file_name: string | null
  file_url: string | null
  file_type: 'pdf' | 'csv' | 'xlsx' | 'docx' | 'txt'
  file_size_bytes: number | null
  analysis_type: string[]
  processing_status: string
  results: any
  insights: any
  charts: any
  report_url: string | null
  delivery_email: string | null
  delivered_at: string | null
  created_at: string
}

// Helper functions
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = createServerClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  const supabase = createServerClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating profile:', error)
    return null
  }
  
  return profile
}

export const getUserExecutions = async (userId: string, limit = 10): Promise<WorkflowExecution[]> => {
  const supabase = createServerClient()
  
  const { data: executions, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
    
  if (error) {
    console.error('Error fetching executions:', error)
    return []
  }
  
  return executions || []
}

export const checkUserCredits = async (userId: string, creditsNeeded = 1): Promise<boolean> => {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .rpc('check_user_credits', {
      p_user_id: userId,
      p_credits_needed: creditsNeeded
    })
    
  if (error) {
    console.error('Error checking credits:', error)
    return false
  }
  
  return data as boolean
}

export const consumeCredits = async (userId: string, credits = 1, service = 'unknown'): Promise<boolean> => {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .rpc('consume_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_service: service
    })
    
  if (error) {
    console.error('Error consuming credits:', error)
    return false
  }
  
  return data as boolean
}