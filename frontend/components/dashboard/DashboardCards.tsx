'use client';

// Client-side dashboard cards for better performance
import { memo } from 'react';
import { Profile } from '@prisma/client';

interface DashboardCardsProps {
  user: any;
  profile: Profile | null;
}

// Memoized components for better re-render performance
const AccountOverviewCard = memo(({ user, profile }: DashboardCardsProps) => {
  const trialDaysLeft = profile?.trialExpiresAt 
    ? Math.max(0, Math.ceil((new Date(profile.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl" role="img" aria-label="User">👤</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Account Status
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {profile?.tier === 'FREE' ? 'Free Trial' : 
                 profile?.tier === 'STARTER' ? 'Starter Plan' : 'Pro Plan'}
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600">
            <p><strong>Email:</strong> {user.primaryEmail}</p>
            {profile?.tier === 'FREE' && (
              <p><strong>Trial Days Left:</strong> {trialDaysLeft}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const UsageStatsCard = memo(({ profile }: { profile: Profile | null }) => {
  const usagePercentage = profile?.quotaLimit === -1 ? 0 : 
    Math.min(100, ((profile?.quotaUsed || 0) / (profile?.quotaLimit || 50)) * 100);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl" role="img" aria-label="Statistics">📊</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Usage This Month
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {profile?.quotaUsed || 0} / {profile?.quotaLimit === -1 ? '∞' : profile?.quotaLimit || 50}
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Automation requests used
          </p>
        </div>
      </div>
    </div>
  );
});

const TelegramCard = memo(({ profile }: { profile: Profile | null }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl" role="img" aria-label="Chat">💬</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              Telegram Bot
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {profile?.telegramChatId ? 'Connected' : 'Not Connected'}
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4">
        {profile?.telegramChatId ? (
          <div className="text-green-600">
            <p className="text-sm">✅ Telegram account linked!</p>
            <p className="text-xs text-gray-600 mt-2">
              Username: @{profile.telegramUsername || 'Unknown'}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-yellow-600 text-sm mb-2">⚠️ Not linked</p>
            <a
              href="https://t.me/clixen_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              Connect to @clixen_bot
            </a>
          </div>
        )}
      </div>
    </div>
  </div>
));

// Main memoized dashboard cards component
const DashboardCards = memo(({ user, profile }: DashboardCardsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AccountOverviewCard user={user} profile={profile} />
      <UsageStatsCard profile={profile} />
      <TelegramCard profile={profile} />
    </div>
  );
});

// Set display names for better debugging
AccountOverviewCard.displayName = 'AccountOverviewCard';
UsageStatsCard.displayName = 'UsageStatsCard';
TelegramCard.displayName = 'TelegramCard';
DashboardCards.displayName = 'DashboardCards';

export default DashboardCards;