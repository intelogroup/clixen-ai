import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efashzkgbougijqcbead.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXNoenZrZ2JvdWdpanFjYmVhZCIsInNvdXJjZSI6InN1cGVyYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NzI5NjAwLCJleHAiOjIwNTAzMDU2MDB9.example_key_here'

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. Using fallback values for development.')
}

// Client-side Supabase client
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' // Use PKCE flow for better security
    }
  })
}

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

// Default client instance for client components
export const supabase = createBrowserClient()

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'example_key_here'
}

// Helper function for better error handling
export const handleSupabaseError = (error: any) => {
  if (error?.message) {
    // Handle specific Supabase errors
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.'
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link.'
    }
    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    if (error.message.includes('Password should be at least 6 characters')) {
      return 'Password must be at least 6 characters long.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}