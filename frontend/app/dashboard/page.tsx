import { neonAuth } from "@/lib/neon-auth";
import { getUserData, createUserProfile } from "@/app/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { DashboardSkeleton, CardSkeleton, ButtonSkeleton } from "@/components/ui/loading";

// Dynamic imports for heavy components
const UserButton = dynamic(() => import("@stackframe/stack").then(mod => ({ default: mod.UserButton })), {
  loading: () => <ButtonSkeleton className="w-8 h-8 rounded-full" />,
  ssr: false
});

const LogoutButton = dynamic(() => import("@/components/LogoutButton").then(mod => ({ default: mod.LogoutButton })), {
  loading: () => <ButtonSkeleton className="px-3 py-2 text-sm" />,
  ssr: false
});

// Dynamic imports for dashboard sections
const DashboardCards = dynamic(() => import("@/components/dashboard/DashboardCards"), {
  loading: () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  ),
  ssr: false
});

const FeaturesSection = dynamic(() => import("@/components/dashboard/FeaturesSection"), {
  loading: () => (
    <div className="mt-8">
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start">
                <div className="w-8 h-8 bg-gray-300 rounded mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

export default async function Dashboard() {
  const user = await neonAuth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  // Ensure user profile exists
  await createUserProfile();
  
  const { profile } = await getUserData();

  const trialDaysLeft = profile?.trialExpiresAt 
    ? Math.max(0, Math.ceil((new Date(profile.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrialExpired = trialDaysLeft === 0 && profile?.tier === 'FREE';

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
              <div className="flex items-center space-x-2">
                <Suspense fallback={<ButtonSkeleton className="w-8 h-8 rounded-full" />}>
                  <UserButton />
                </Suspense>
                <Suspense fallback={<ButtonSkeleton className="px-3 py-2 text-sm" />}>
                  <LogoutButton className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium" />
                </Suspense>
              </div>
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
        {!isTrialExpired && trialDaysLeft <= 3 && profile?.tier === 'FREE' && (
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
          {/* Dashboard Cards - Optimized with Suspense */}
          <Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          }>
            <DashboardCards user={user} profile={profile} />
          </Suspense>

          {/* Features Section - Optimized with Suspense */}
          <Suspense fallback={
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg animate-pulse">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="w-8 h-8 bg-gray-300 rounded mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-300 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }>
            <FeaturesSection />
          </Suspense>


          {/* Upgrade Section */}
          {profile?.tier === 'FREE' && (
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