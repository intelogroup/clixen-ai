// Performance monitoring utilities for Clixen AI
// Tracks key metrics and provides insights for optimization

import { performance } from 'perf_hooks';

// Performance metrics storage
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000; // Keep last 1000 metrics

// Performance measurement utility
export function measurePerformance<T>(
  name: string, 
  fn: () => Promise<T>, 
  metadata?: Record<string, any>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      // Store metric
      recordMetric(name, duration, metadata);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`, metadata);
      } else if (duration > 500) {
        console.info(`⏱️  ${name} took ${duration.toFixed(2)}ms`, metadata);
      }
      
      resolve(result);
    } catch (error) {
      const duration = performance.now() - start;
      recordMetric(`${name}_ERROR`, duration, { ...metadata, error: String(error) });
      
      console.error(`💥 Error in ${name} after ${duration.toFixed(2)}ms:`, error);
      reject(error);
    }
  });
}

// Record performance metric
function recordMetric(name: string, duration: number, metadata?: Record<string, any>) {
  metrics.push({
    name,
    duration,
    timestamp: Date.now(),
    metadata
  });
  
  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }
}

// Get performance statistics
export function getPerformanceStats() {
  if (metrics.length === 0) return null;
  
  const now = Date.now();
  const recentMetrics = metrics.filter(m => now - m.timestamp < 3600000); // Last hour
  
  if (recentMetrics.length === 0) return null;
  
  // Group by operation name
  const byOperation = new Map<string, number[]>();
  
  recentMetrics.forEach(metric => {
    if (!byOperation.has(metric.name)) {
      byOperation.set(metric.name, []);
    }
    byOperation.get(metric.name)!.push(metric.duration);
  });
  
  // Calculate stats for each operation
  const operationStats = Array.from(byOperation.entries()).map(([name, durations]) => {
    const sorted = durations.sort((a, b) => a - b);
    const count = durations.length;
    const total = durations.reduce((sum, d) => sum + d, 0);
    
    return {
      name,
      count,
      avg: total / count,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  });
  
  return {
    totalMetrics: recentMetrics.length,
    timeRange: '1 hour',
    operations: operationStats.sort((a, b) => b.avg - a.avg)
  };
}

// Dashboard-specific performance tracking
export async function trackDashboardLoad<T>(fn: () => Promise<T>): Promise<T> {
  return measurePerformance('dashboard_load', fn, { 
    component: 'dashboard',
    user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  });
}

export async function trackUserQuery<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  return measurePerformance(`user_query_${operation}`, fn, {
    type: 'database',
    operation
  });
}

export async function trackApiCall<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  return measurePerformance(`api_call`, fn, {
    endpoint,
    type: 'api'
  });
}

// Memory usage tracking
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }
  return null;
}

// Performance monitoring middleware for API routes
export function performanceMiddleware(handler: Function) {
  return async (req: any, res: any) => {
    const start = performance.now();
    const endpoint = req.url || 'unknown';
    
    try {
      const result = await handler(req, res);
      const duration = performance.now() - start;
      
      recordMetric('api_request', duration, {
        endpoint,
        method: req.method,
        status: res.statusCode || 200
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      recordMetric('api_request_error', duration, {
        endpoint,
        method: req.method,
        error: String(error)
      });
      throw error;
    }
  };
}

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (globalThis as any).__PERF_STATS__ = getPerformanceStats;
  (globalThis as any).__PERF_MEMORY__ = getMemoryUsage;
}