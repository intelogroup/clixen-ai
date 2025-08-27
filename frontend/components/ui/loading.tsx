// Performance-optimized loading components
import { memo } from 'react';

// Lightweight skeleton loaders for better perceived performance
export const CardSkeleton = memo(() => (
  <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
    <div className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-4/5"></div>
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

export const DashboardSkeleton = memo(() => (
  <div className="min-h-screen bg-gray-50">
    {/* Navigation Skeleton */}
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="h-8 bg-gray-300 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        
        {/* Features Section Skeleton */}
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
      </div>
    </div>
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

export const ButtonSkeleton = memo(({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`}>
    <div className="h-full w-full"></div>
  </div>
));

ButtonSkeleton.displayName = 'ButtonSkeleton';