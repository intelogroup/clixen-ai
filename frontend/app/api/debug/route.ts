import { NextResponse } from 'next/server'

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
    // Basic environment info (safe to expose)
    const debugInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      nextVersion: process.env.npm_package_dependencies_next || 'unknown',
      platform: process.platform,
      nodeVersion: process.version,
      
      // Environment variable checks (without exposing values)
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        supabaseAccessToken: process.env.SUPABASE_ACCESS_TOKEN ? 'Set' : 'Missing',
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
        openaiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Missing',
        stripePublishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
        stripeSecret: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing',
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing',
        n8nApiKey: process.env.N8N_API_KEY ? 'Set' : 'Missing'
      },
      
      // URL info
      urls: {
        supabaseBaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
        n8nBaseUrl: process.env.N8N_BASE_URL || 'Not set'
      },
      
      // API route test
      apiRouteWorking: true,
      
      // Headers received
      headers: {
        userAgent: 'N/A', // Will be set by client
        host: 'N/A'       // Will be set by client
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug info retrieved successfully',
      data: debugInfo
    }, { headers: corsHeaders })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug info retrieval failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders })
  }
}
