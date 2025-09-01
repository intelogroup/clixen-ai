// In-memory caching for user profiles and dashboard data
// This provides significant performance improvements for repeated requests

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import type { Profile } from '@prisma/client';

// Memory cache for development and single-instance deployments
const userProfileCache = new Map<string, { data: Profile | null; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// React cache for request-level deduplication
export const getCachedUserProfile = cache(async (userId: string, fetcher: () => Promise<Profile | null>) => {
  // Check memory cache first
  const cached = userProfileCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    console.log(`🚀 Cache HIT for user ${userId}`);
    return cached.data;
  }

  console.log(`📝 Cache MISS for user ${userId} - fetching from database`);
  
  // Fetch from database
  const profile = await fetcher();
  
  // Store in cache
  userProfileCache.set(userId, {
    data: profile,
    expires: Date.now() + CACHE_TTL
  });
  
  return profile;
});

// Next.js unstable_cache for server-side caching across requests
export const getCachedDashboardData = unstable_cache(
  async (userId: string, fetcher: () => Promise<any>) => {
    return await fetcher();
  },
  ['dashboard-data'],
  {
    revalidate: 300, // 5 minutes
    tags: ['user-profile'],
  }
);

// Cache invalidation helpers
export function invalidateUserCache(userId: string) {
  userProfileCache.delete(userId);
  console.log(`🗑️  Cache invalidated for user ${userId}`);
}

export function clearAllCache() {
  userProfileCache.clear();
  console.log(`🗑️  All caches cleared`);
}

// Cache statistics for monitoring
export function getCacheStats() {
  return {
    size: userProfileCache.size,
    keys: Array.from(userProfileCache.keys()),
    memoryUsage: process.memoryUsage()
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of userProfileCache.entries()) {
    if (value.expires <= now) {
      userProfileCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
  }
}, 60000); // Clean every minute