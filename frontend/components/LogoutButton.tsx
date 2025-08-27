'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className = '', children = 'Sign Out' }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Call the logout API
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Redirect to signin page
        router.push('/auth/signin');
      } else {
        console.error('Logout failed:', response.statusText);
        // Still redirect to be safe
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect anyway to be safe
      router.push('/auth/signin');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${className} ${
        isLoggingOut 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:text-gray-700 transition-colors'
      }`}
      title="Sign out"
    >
      {isLoggingOut ? 'Signing out...' : children}
    </button>
  );
}