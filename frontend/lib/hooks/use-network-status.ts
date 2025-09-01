"use client";

import { useState, useEffect } from 'react';
import { NetworkStatus, createNetworkMonitor, getNetworkStatus, pingServer } from '@/lib/network-utils';

export interface ExtendedNetworkStatus extends NetworkStatus {
  serverReachable: boolean;
  lastChecked: Date;
}

/**
 * Hook to monitor network status and server connectivity
 */
export function useNetworkStatus(pingInterval = 30000): ExtendedNetworkStatus {
  const [status, setStatus] = useState<ExtendedNetworkStatus>(() => ({
    ...getNetworkStatus(),
    serverReachable: true,
    lastChecked: new Date(),
  }));

  useEffect(() => {
    // Initial server ping
    let mounted = true;
    
    const checkServer = async () => {
      if (!mounted) return;
      
      try {
        const reachable = await pingServer();
        if (mounted) {
          setStatus(prev => ({
            ...prev,
            serverReachable: reachable,
            lastChecked: new Date(),
          }));
        }
      } catch (error) {
        console.warn('Server ping failed:', error);
        if (mounted) {
          setStatus(prev => ({
            ...prev,
            serverReachable: false,
            lastChecked: new Date(),
          }));
        }
      }
    };

    // Set up network status monitoring
    const cleanup = createNetworkMonitor((networkStatus) => {
      if (mounted) {
        setStatus(prev => ({
          ...networkStatus,
          serverReachable: prev.serverReachable,
          lastChecked: prev.lastChecked,
        }));
      }
    });

    // Initial server check
    checkServer();

    // Set up periodic server pings
    const pingIntervalId = setInterval(checkServer, pingInterval);

    // Cleanup function
    return () => {
      mounted = false;
      cleanup();
      clearInterval(pingIntervalId);
    };
  }, [pingInterval]);

  return status;
}

/**
 * Simple hook for just online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}