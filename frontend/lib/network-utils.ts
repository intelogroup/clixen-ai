/**
 * Network utility functions for handling CORS, retries, and connection monitoring
 */

// Network status types
export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  effectiveType?: string;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  backoffMultiplier: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeoutMs: 30000,  // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Enhanced fetch with retry logic and timeout handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeoutMs);
    
    try {
      console.log(`🌐 Network: Attempting request to ${url} (attempt ${attempt + 1}/${finalConfig.maxRetries + 1})`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      console.log(`✅ Network: Request successful - ${response.status}`);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      const isLastAttempt = attempt === finalConfig.maxRetries;
      const isRetriableError = isNetworkError(error);
      
      console.log(`❌ Network: Request failed on attempt ${attempt + 1}:`, error);
      
      if (isLastAttempt || !isRetriableError) {
        throw new Error(`Network request failed after ${attempt + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Wait before retry with exponential backoff
      const delay = finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
      console.log(`🔄 Network: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Check if error is a retryable network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const networkErrorNames = ['NetworkError', 'TimeoutError', 'AbortError'];
  const networkErrorMessages = ['fetch', 'network', 'timeout', 'connection', 'dns'];
  
  return (
    networkErrorNames.includes(error.name) ||
    networkErrorMessages.some(msg => error.message.toLowerCase().includes(msg))
  );
}

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatus {
  if (typeof navigator === 'undefined') {
    return { isOnline: true, isSlowConnection: false };
  }
  
  const status: NetworkStatus = {
    isOnline: navigator.onLine,
    isSlowConnection: false,
  };
  
  // Check connection quality if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    status.connectionType = connection.type;
    status.effectiveType = connection.effectiveType;
    status.isSlowConnection = 
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g';
  }
  
  return status;
}

/**
 * Monitor network status changes
 */
export function createNetworkMonitor(callback: (status: NetworkStatus) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const updateStatus = () => callback(getNetworkStatus());
  
  // Listen for online/offline events
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  
  // Listen for connection changes
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    connection.addEventListener('change', updateStatus);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.removeEventListener('change', updateStatus);
    }
  };
}

/**
 * CORS-safe request wrapper
 */
export async function corsRequest(
  url: string,
  options: RequestInit = {},
  config?: Partial<RetryConfig>
): Promise<Response> {
  const corsOptions: RequestInit = {
    ...options,
    mode: 'cors',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };
  
  return fetchWithRetry(url, corsOptions, config);
}

/**
 * Handle API errors with user-friendly messages
 */
export function getErrorMessage(error: unknown, context = ''): string {
  if (error instanceof Error) {
    // Network-specific errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (isNetworkError(error)) {
      return 'Network connection failed. Please check your internet connection.';
    }
    
    // Return the actual error message for known errors
    if (error.message) {
      return error.message;
    }
  }
  
  // Fallback message
  return context ? `${context} failed. Please try again.` : 'An error occurred. Please try again.';
}

/**
 * Validate API response
 */
export async function validateResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (parseError) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  
  try {
    return await response.json();
  } catch (parseError) {
    throw new Error('Invalid response format from server');
  }
}

/**
 * Create a ping function to test connectivity
 */
export async function pingServer(url = '/api/health'): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    console.warn('Server ping failed:', error);
    return false;
  }
}