// Performance monitoring API endpoint
// Only available in development for security

import { NextResponse } from 'next/server';
import { getPerformanceStats, getMemoryUsage } from '@/lib/performance';
import { getCacheStats } from '@/lib/cache';

export async function GET() {
  // Only expose performance data in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  
  try {
    const perfStats = getPerformanceStats();
    const memoryUsage = getMemoryUsage();
    const cacheStats = getCacheStats();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      performance: perfStats,
      memory: memoryUsage,
      cache: cacheStats,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextjsVersion: process.env.npm_package_dependencies_next || 'unknown',
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch performance data',
      details: String(error)
    }, { status: 500 });
  }
}