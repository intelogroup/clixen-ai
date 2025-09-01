import { NextRequest, NextResponse } from 'next/server';
import { createUserProfile } from '@/app/actions';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://clixen.app' 
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Network retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeoutMs: 30000,  // 30 seconds
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

// Retry mechanism for network requests
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = RETRY_CONFIG.maxRetries
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Check if it's a network error that we should retry
    const isRetriableError = 
      error instanceof Error && 
      (error.name === 'NetworkError' || 
       error.name === 'TimeoutError' || 
       error.message.includes('fetch') ||
       error.message.includes('network') ||
       error.message.includes('timeout'));
    
    if (retries > 0 && isRetriableError) {
      console.log(`🔄 API Route: Retrying request (${RETRY_CONFIG.maxRetries - retries + 1}/${RETRY_CONFIG.maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: Processing signup request...');
    
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ API Route: Invalid JSON in request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email, password } = body;

    // Enhanced input validation
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email and password are required',
          details: {
            email: !email ? 'Email is required' : null,
            password: !password ? 'Password is required' : null
          }
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`📍 API Route: Attempting signup for email: ${email}`);

    // Call Stack Auth API with retry mechanism
    let response;
    try {
      response = await fetchWithRetry('https://api.stack-auth.com/api/v1/auth/password/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-project-id': process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
          'x-stack-publishable-client-key': process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
          'x-stack-access-type': 'client'
        },
        body: JSON.stringify({
          email,
          password,
          verification_callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
        })
      });
    } catch (networkError) {
      console.error('❌ API Route: Network error calling Stack Auth:', networkError);
      
      // Classify network errors
      let errorMessage = 'Network error occurred';
      if (networkError instanceof Error) {
        if (networkError.name === 'AbortError' || networkError.message.includes('timeout')) {
          errorMessage = 'Request timeout - please try again';
        } else if (networkError.message.includes('fetch') || networkError.message.includes('network')) {
          errorMessage = 'Network connection failed - please check your internet connection';
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          retryable: true,
          timestamp: new Date().toISOString()
        },
        { status: 503, headers: corsHeaders }
      );
    }

    console.log(`📍 API Route: Stack Auth response: ${response.status}`);

    if (response.ok) {
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('❌ API Route: Failed to parse Stack Auth response:', parseError);
        return NextResponse.json(
          { error: 'Invalid response from authentication service' },
          { status: 502, headers: corsHeaders }
        );
      }
      
      console.log('✅ API Route: Stack Auth signup successful');
      
      // If user is created and authenticated, also create our profile
      if (result.user || result.access_token) {
        try {
          await createUserProfile();
          console.log('✅ API Route: User profile created successfully');
        } catch (profileError) {
          console.error('⚠️ API Route: Failed to create user profile:', profileError);
          // Don't fail the signup if profile creation fails - user can still use the system
          result.profileCreated = false;
          result.profileError = 'Profile creation failed but signup was successful';
        }
      }

      return NextResponse.json(result, { headers: corsHeaders });
    } else {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ API Route: Failed to parse error response:', parseError);
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ API Route: Stack Auth signup failed:', errorData);
      
      // Enhanced error response with helpful information
      const errorResponse: any = {
        error: errorData.error || errorData.message || 'Signup failed',
        status: response.status,
        timestamp: new Date().toISOString()
      };
      
      // Add specific handling for common errors
      if (errorData.code === 'REDIRECT_URL_NOT_WHITELISTED') {
        errorResponse.error = 'Domain configuration issue - please contact support';
        errorResponse.helpText = 'The application domain needs to be configured in the authentication system';
      } else if (errorData.code === 'USER_ALREADY_EXISTS') {
        errorResponse.error = 'An account with this email already exists';
        errorResponse.helpText = 'Please try signing in instead of creating a new account';
      }
      
      return NextResponse.json(
        errorResponse,
        { status: response.status, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('❌ API Route: Unexpected signup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        retryable: true,
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
}