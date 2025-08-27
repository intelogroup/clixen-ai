'use client';

import { SignIn } from "@stackframe/stack";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/form-field";
import { validateEmail, validatePassword, validateAuthForm, createInitialFieldState, updateFieldState, type FieldState } from "@/lib/form-validation";

// Enhanced sign-in form with comprehensive validation
function EnhancedSignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStackAuth, setShowStackAuth] = useState(false);
  const router = useRouter();
  
  // Form state with validation
  const [emailField, setEmailField] = useState<FieldState>(createInitialFieldState());
  const [passwordField, setPasswordField] = useState<FieldState>(createInitialFieldState());
  const [useCustomForm, setUseCustomForm] = useState(true);
  
  // Form validation
  const isFormValid = () => {
    if (!useCustomForm) return true;
    
    const emailValid = emailField.validation.isValid && emailField.value.length > 0;
    const passwordValid = passwordField.validation.isValid && passwordField.value.length > 0;
    
    return emailValid && passwordValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate form
      const validation = validateAuthForm(emailField.value, passwordField.value, false);
      
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(', ');
        setError(errorMessages);
        setIsLoading(false);
        return;
      }

      // Simulate authentication (replace with actual Stack Auth API call)
      console.log('Attempting sign in with:', {
        email: emailField.value,
        password: '***hidden***'
      });

      // This would be replaced with actual Stack Auth authentication
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // For now, show error since we're not actually authenticating
      setError('Custom authentication not yet implemented. Please use the Stack Auth form below.');
      
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Monitor for authentication errors
    const handleAuthError = (event: any) => {
      console.log('Auth error event:', event);
      if (event.detail?.error) {
        const errorMsg = event.detail.error;
        
        // Handle specific error cases
        if (errorMsg.includes('password') || errorMsg.includes('credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (errorMsg.includes('not found') || errorMsg.includes('exist')) {
          setError("No account found with this email. Please sign up to create an account.");
        } else {
          setError('Authentication failed. Please check your credentials and try again.');
        }
      }
    };
    
    window.addEventListener('stack:auth-error', handleAuthError);
    
    return () => {
      window.removeEventListener('stack:auth-error', handleAuthError);
    };
  }, []);
  
  try {
    return (
      <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
        {/* Custom error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                {error.includes('sign up') && (
                  <div className="mt-2">
                    <Link 
                      href="/auth/signup"
                      className="text-sm text-red-700 hover:text-red-600 underline font-medium"
                    >
                      Create a new account →
                    </Link>
                  </div>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto pl-3 flex-shrink-0"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Loading state indicator */}
        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-700">Authenticating...</span>
            </div>
          </div>
        )}
        
        {/* Custom form with validation or Stack Auth component */}
        {useCustomForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="email"
              type="email"
              label="Email address"
              placeholder="Enter your email"
              value={emailField.value}
              onChange={(value) => setEmailField(
                updateFieldState(emailField, { value, touched: true }, validateEmail)
              )}
              onBlur={() => setEmailField(prev => ({ ...prev, touched: true }))}
              validation={emailField.touched ? emailField.validation : undefined}
              disabled={isLoading}
              autoComplete="email"
            />
            
            <FormField
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={passwordField.value}
              onChange={(value) => setPasswordField(
                updateFieldState(passwordField, { value, touched: true }, (pwd) => validatePassword(pwd, false))
              )}
              onBlur={() => setPasswordField(prev => ({ ...prev, touched: true }))}
              validation={passwordField.touched ? passwordField.validation : undefined}
              disabled={isLoading}
              autoComplete="current-password"
            />
            
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`
                w-full flex justify-center py-2 px-4 border border-transparent 
                rounded-md shadow-sm text-sm font-medium text-white
                transition-all duration-200
                ${
                  isLoading || !isFormValid()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }
              `}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : showStackAuth ? (
          <div 
            onSubmit={() => setIsLoading(true)}
            onClick={(e: any) => {
              if (e.target.type === 'submit') {
                setIsLoading(true);
                setError(null);
              }
            }}
          >
            <SignIn 
              afterSignIn={() => {
                console.log('Sign in successful, redirecting...');
                router.push('/dashboard');
              }}
            />
          </div>
        ) : null}
        
        {/* Additional help and form toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setUseCustomForm(!useCustomForm);
                setShowStackAuth(!showStackAuth);
                setError(null);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-500 underline"
            >
              {useCustomForm ? 'Use Stack Auth form' : 'Use enhanced form'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Having trouble? Try resetting your password or contact support.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering SignIn form:', error);
    return (
      <div className="bg-red-50 py-8 px-6 shadow-lg rounded-xl border border-red-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Authentication System Error</h3>
          <p className="text-red-600 mb-4">
            The authentication system is temporarily unavailable. Please try again in a few moments.
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh Page
            </button>
            <Link
              href="/"
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
            >
              Return to Home
            </Link>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-500">Error Details</summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {error instanceof Error ? error.stack : String(error)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

// Enhanced loading fallback with better UX
function EnhancedSignInLoading() {
  return (
    <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-center mb-6">
          <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce mx-1" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-indigo-200 rounded"></div>
        <div className="flex justify-center space-x-2 pt-4">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">Loading authentication...</p>
    </div>
  );
}

export default function EnhancedSignInPage() {
  const [mounted, setMounted] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
    
    // Check configuration on mount
    const checkConfig = () => {
      const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
      const clientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
      
      if (!projectId || !clientKey) {
        setConfigError('Authentication configuration is missing. Please check environment variables.');
        console.error('Missing Stack Auth configuration:', {
          hasProjectId: !!projectId,
          hasClientKey: !!clientKey
        });
      }
    };
    
    checkConfig();
  }, []);
  
  // Show loading while mounting to prevent hydration issues
  if (!mounted) {
    return <EnhancedSignInLoading />;
  }
  
  // Show configuration error if present
  if (configError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
            <p className="text-gray-600 mb-4">{configError}</p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Link href="/" className="inline-block group">
              <h1 className="text-3xl font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                Clixen AI
              </h1>
            </Link>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">
              Welcome back!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your automation dashboard.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Suspense fallback={<EnhancedSignInLoading />}>
            <EnhancedSignInForm />
          </Suspense>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Sign up for free trial
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Get 7 days free with 50 automation requests
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Critical error in SignInPage component:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Critical Error</h1>
            <p className="text-gray-600 mb-4">
              A critical error occurred while loading the authentication page.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}