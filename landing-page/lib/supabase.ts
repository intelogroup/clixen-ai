import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const createBrowserClient = () => 
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
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

// Default client instance for client components
export const supabase = createBrowserClient()