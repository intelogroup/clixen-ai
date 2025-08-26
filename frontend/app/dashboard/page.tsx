import { stackServerApp } from "@/stack";
import { getUserData, createUserProfile } from "@/app/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/handler/sign-in");
  }

  // Ensure user profile exists
  await createUserProfile();
  
  const { profile } = await getUserData();

  const trialDaysLeft = profile?.trial_expires_at 
    ? Math.max(0, Math.ceil((new Date(profile.trial_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrialExpired = trialDaysLeft === 0 && profile?.tier === 'free';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">Clixen AI</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.displayName || user.primaryEmail}</span>
              <a
                href={stackServerApp.urls.signOut}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Trial Status Alert */}
        {isTrialExpired && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Your free trial has expired
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Upgrade to continue using Clixen AI automation features.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <Link
                      href="/upgrade"
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial Warning */}
        {!isTrialExpired && trialDaysLeft <= 3 && profile?.tier === 'free' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⏰</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Trial ending soon
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your free trial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Account Overview Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Account Status
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profile?.tier === 'free' ? 'Free Trial' : 
                         profile?.tier === 'starter' ? 'Starter Plan' : 'Pro Plan'}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">
                    <p><strong>Email:</strong> {user.primaryEmail}</p>
                    {profile?.tier === 'free' && (
                      <p><strong>Trial Days Left:</strong> {trialDaysLeft}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Usage This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profile?.quota_used || 0} / {profile?.quota_limit === -1 ? '∞' : profile?.quota_limit || 50}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: profile?.quota_limit === -1 ? '0%' : 
                               `${Math.min(100, ((profile?.quota_used || 0) / (profile?.quota_limit || 50)) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Automation requests used
                  </p>
                </div>
              </div>
            </div>

            {/* Telegram Integration Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Telegram Bot
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profile?.telegram_chat_id ? 'Connected' : 'Not Connected'}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  {profile?.telegram_chat_id ? (
                    <div className="text-green-600">
                      <p className="text-sm">✅ Telegram account linked!</p>
                      <p className="text-xs text-gray-600 mt-2">
                        Username: @{profile.telegram_username || 'Unknown'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-yellow-600 text-sm mb-2">⚠️ Not linked</p>
                      <a
                        href="https://t.me/clixen_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md"
                      >
                        Connect to @clixen_bot
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Available Features
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Use these automation features through @clixen_bot on Telegram
                </p>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🌤️</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Weather Updates</h4>
                      <p className="text-sm text-gray-500">Get current weather for any city</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">📧</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Email Scanner</h4>
                      <p className="text-sm text-gray-500">Scan inbox for invoices and spending</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🌍</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Text Translation</h4>
                      <p className="text-sm text-gray-500">Translate between languages</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">📄</span>
                    <div>
                      <h4 className="font-medium text-gray-900">PDF Summarizer</h4>
                      <p className="text-sm text-gray-500">AI-powered document summaries</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Message <a href="https://t.me/clixen_bot" target="_blank" className="text-indigo-600 hover:text-indigo-800">@clixen_bot</a> on Telegram</li>
                    <li>2. Use natural language commands like "What's the weather in London?"</li>
                    <li>3. Get instant results from our AI-powered workflows</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Section */}
          {profile?.tier === 'free' && (
            <div className="mt-8">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-8 text-white">
                  <h3 className="text-2xl font-bold">Ready for more automation?</h3>
                  <p className="mt-2 text-indigo-100">
                    Upgrade to get unlimited requests and priority support
                  </p>
                  <div className="mt-6 flex space-x-4">
                    <Link
                      href="/"
                      className="bg-white text-indigo-600 px-6 py-3 rounded-md font-medium hover:bg-indigo-50 transition-colors"
                    >
                      View Pricing
                    </Link>
                    <a
                      href="https://t.me/clixen_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-indigo-600 transition-colors"
                    >
                      Try @clixen_bot
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}