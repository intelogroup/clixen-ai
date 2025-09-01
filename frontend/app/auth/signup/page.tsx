import Link from "next/link";
import { Suspense } from "react";
import EnhancedSignupForm from "./enhanced-signup-form";

// Enhanced signup form component with network handling
function SignUpForm() {
  console.log('Enhanced SignUp form component rendering');
  
  try {
    return (
      <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
        <EnhancedSignupForm />
      </div>
    );
  } catch (error) {
    console.error('Error rendering Enhanced SignUp form:', error);
    return (
      <div className="bg-red-50 py-8 px-6 shadow-lg rounded-xl border border-red-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Authentication Error</h3>
          <p className="text-red-600 mb-4">
            Unable to load sign-up form. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh Page
          </button>
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

// Loading fallback component
function SignUpLoading() {
  return (
    <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  console.log('SignUp page rendering started');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID ? 'Present' : 'Missing',
    STACK_CLIENT_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ? 'Present' : 'Missing'
  });
  
  try {
    return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-indigo-600">Clixen AI</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your 7-day free trial with 50 automation requests.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<SignUpLoading />}>
          <SignUpForm />
        </Suspense>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/auth/signin" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Critical error in SignUpPage component:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Sign Up Error</h1>
            <p className="text-gray-600 mb-4">
              Unable to load the sign-up page. This might be a configuration issue.
            </p>
            <div className="space-y-2 mb-4">
              <Link
                href="/"
                className="block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Return Home
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error instanceof Error ? error.stack : String(error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
}