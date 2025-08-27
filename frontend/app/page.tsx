import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import for pricing section (below the fold)
const PricingSection = dynamic(() => Promise.resolve(() => (
  <div className="bg-gray-50 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:flex-col sm:align-center">
        <h1 className="text-5xl font-extrabold text-gray-900 sm:text-center">Pricing Plans</h1>
        <p className="mt-5 text-xl text-gray-500 sm:text-center">
          Start with a free trial, upgrade when you need more
        </p>
      </div>
      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
        {/* Free Trial */}
        <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
          <div className="p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Free Trial</h2>
            <p className="mt-4 text-sm text-gray-500">Perfect for trying out Clixen AI</p>
            <p className="mt-8">
              <span className="text-4xl font-extrabold text-gray-900">$0</span>
              <span className="text-base font-medium text-gray-500">/7 days</span>
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900"
            >
              Start Free Trial
            </Link>
          </div>
          <div className="pt-6 pb-8 px-6">
            <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">50 automation requests</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">All core features</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Telegram bot access</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Starter Plan */}
        <div className="border border-indigo-200 rounded-lg shadow-sm divide-y divide-gray-200">
          <div className="p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Starter</h2>
            <p className="mt-4 text-sm text-gray-500">For regular users</p>
            <p className="mt-8">
              <span className="text-4xl font-extrabold text-gray-900">$9</span>
              <span className="text-base font-medium text-gray-500">/month</span>
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
          <div className="pt-6 pb-8 px-6">
            <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">Everything in Free, plus</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">1,000 requests/month</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Email support</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Priority processing</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Pro Plan */}
        <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
          <div className="p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
            <p className="mt-4 text-sm text-gray-500">For power users</p>
            <p className="mt-8">
              <span className="text-4xl font-extrabold text-gray-900">$49</span>
              <span className="text-base font-medium text-gray-500">/month</span>
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900"
            >
              Upgrade to Pro
            </Link>
          </div>
          <div className="pt-6 pb-8 px-6">
            <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">Everything in Starter, plus</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Unlimited requests</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Priority support</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Advanced features</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
)), {
  loading: () => (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="h-96 bg-gray-300 rounded"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

// Loading component for navigation links
function NavigationLinks() {
  try {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/signin"
          className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Get Started
        </Link>
      </div>
    );
  } catch (error) {
    console.error('Error rendering navigation links:', error);
    return (
      <div className="flex items-center space-x-4">
        <span className="text-red-500 text-sm">Navigation Error</span>
      </div>
    );
  }
}


export default function Home() {
  console.log('Landing page rendering started');
  
  try {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">Clixen AI</h1>
              </div>
            </div>
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
              <NavigationLinks />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">AI-Powered Automation</span>
            <span className="block text-indigo-600">Through Telegram</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Access powerful automation workflows through our Telegram bot. Get weather updates, scan emails, translate text, and more - all through natural language commands.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/auth/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Start Free Trial
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a
                href="https://t.me/clixen_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Try @clixen_bot
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Automation at Your Fingertips
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Just message @clixen_bot on Telegram with natural language commands
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    🌤️
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Weather Updates</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Get current weather for any city worldwide with a simple message.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    📧
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Email Scanner</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Scan your inbox for invoices and payments, get spending summaries.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    🌍
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Text Translation</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Translate text between any languages instantly.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    📄
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">PDF Summarizer</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Upload and get AI-powered summaries of PDF documents.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section - Dynamically Loaded */}
      <Suspense fallback={
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="h-96 bg-gray-300 rounded"></div>
                <div className="h-96 bg-gray-300 rounded"></div>
                <div className="h-96 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <PricingSection />
      </Suspense>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            No credit card required. Start automating with @clixen_bot in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="https://t.me/clixen_bot" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Telegram</span>
              <span className="h-6 w-6 flex items-center">📱</span>
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 Clixen AI. All rights reserved. Built with ❤️ using Next.js, NeonAuth & NeonDB.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
  } catch (error) {
    console.error('Critical error in Home component:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
            <p className="text-gray-600 mb-4">
              We're experiencing technical difficulties. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh Page
            </button>
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