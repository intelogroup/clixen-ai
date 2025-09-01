"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { corsRequest, getErrorMessage, validateResponse } from '@/lib/network-utils';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface NetworkState {
  isRetrying: boolean;
  retryCount: number;
  lastError: string | null;
}

export default function EnhancedSignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [networkState, setNetworkState] = useState<NetworkState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null
  });
  
  const router = useRouter();
  const networkStatus = useNetworkStatus();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check network status
    if (!networkStatus.isOnline) {
      setErrors({ general: 'No internet connection. Please check your network and try again.' });
      return;
    }
    
    if (!networkStatus.serverReachable) {
      setErrors({ general: 'Server is not reachable. Please try again in a moment.' });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setNetworkState({ isRetrying: false, retryCount: 0, lastError: null });
    
    try {
      console.log('🚀 Attempting enhanced signup via server API...');
      
      // Use enhanced CORS-safe request with retry mechanism
      const response = await corsRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      console.log(`📍 Signup API response: ${response.status}`);
      
      const result = await validateResponse(response);
      console.log('✅ Signup successful!', result);
      
      // Handle different response scenarios
      if (result.access_token || result.user) {
        console.log('🎉 User created and authenticated, redirecting to dashboard...');
        // Small delay to ensure user sees success state
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else if (result.verification_required) {
        console.log('📧 Email verification required');
        setErrors({ general: 'Account created! Please check your email to verify your account before signing in.' });
      } else {
        console.log('📧 Account created, verification may be required');
        setErrors({ general: 'Account created! Please check your email to verify your account.' });
      }
      
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      const errorMessage = getErrorMessage(error, 'Account creation');
      setErrors({ general: errorMessage });
      
      // For retryable errors, show retry option
      const isRetriable = error instanceof Error && 
        (error.message.includes('timeout') || error.message.includes('network'));
        
      if (isRetriable) {
        setNetworkState(prev => ({ 
          ...prev, 
          lastError: errorMessage,
          retryCount: prev.retryCount + 1 
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Retry function
  const handleRetry = () => {
    setNetworkState({ isRetrying: true, retryCount: 0, lastError: null });
    setErrors({});
    handleSubmit(new Event('submit') as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Network status indicators */}
      {!networkStatus.isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <p className="text-sm text-yellow-800">You're currently offline. Please check your internet connection.</p>
          </div>
        </div>
      )}
      
      {!networkStatus.serverReachable && networkStatus.isOnline && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
            <p className="text-sm text-orange-800">Server connection issues detected. Some features may not work properly.</p>
          </div>
        </div>
      )}
      
      {networkStatus.isSlowConnection && networkStatus.isOnline && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <p className="text-sm text-blue-800">Slow connection detected. Account creation may take longer than usual.</p>
          </div>
        </div>
      )}
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.general}</p>
          
          {/* Retry button for retryable errors */}
          {networkState.retryCount > 0 && networkState.retryCount < 3 && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900 focus:outline-none"
            >
              Try again ({3 - networkState.retryCount} attempts remaining)
            </button>
          )}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter your email"
          disabled={isLoading || !networkStatus.isOnline}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            errors.password ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Create a password (min 8 characters)"
          disabled={isLoading || !networkStatus.isOnline}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Confirm your password"
          disabled={isLoading || !networkStatus.isOnline}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading || !networkStatus.isOnline || !networkStatus.serverReachable}
        className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
          isLoading || !networkStatus.isOnline || !networkStatus.serverReachable
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
        }`}
      >
        {!networkStatus.isOnline 
          ? 'Offline - Check Connection'
          : !networkStatus.serverReachable
          ? 'Server Unavailable'
          : isLoading 
          ? (
            <span className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {networkStatus.isSlowConnection ? 'Creating Account (Slow Connection)...' : 'Creating Account...'}
            </span>
          ) 
          : 'Create Account'
        }
      </button>
      
      {/* Connection quality indicator */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${
            !networkStatus.isOnline 
              ? 'bg-red-500' 
              : !networkStatus.serverReachable
              ? 'bg-orange-500'
              : networkStatus.isSlowConnection 
              ? 'bg-yellow-500' 
              : 'bg-green-500'
          }`}></div>
          <span>
            {!networkStatus.isOnline 
              ? 'Offline'
              : !networkStatus.serverReachable
              ? 'Server issues'
              : networkStatus.isSlowConnection 
              ? 'Slow connection' 
              : 'Good connection'
            }
          </span>
          <span className="text-gray-400">
            • Last checked: {networkStatus.lastChecked.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </form>
  );
}