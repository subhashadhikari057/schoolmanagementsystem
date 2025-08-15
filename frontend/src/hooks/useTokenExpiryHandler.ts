/**
 * =============================================================================
 * Token Expiry Handler Hook
 * =============================================================================
 * React hook for handling JWT token expiration in components
 * =============================================================================
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { initTokenExpiryHandler } from '@/utils/token-expiry-handler';

/**
 * Hook to handle token expiration in React components
 * @param redirectPath Path to redirect to when session expires (default: /auth/login)
 */
export function useTokenExpiryHandler(redirectPath = '/auth/login') {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization during development and hydration
    if (initialized.current) return;

    // Only set up handlers if user is authenticated
    if (!isAuthenticated) return;

    // Mark as initialized
    initialized.current = true;

    // Initialize token expiry handler with a delay to avoid immediate checks
    let cleanup: (() => void) | undefined;
    const initTimeout = setTimeout(() => {
      cleanup = initTokenExpiryHandler();
    }, 1000); // Delay initialization to prevent immediate checks

    // Event handler for session expiry
    const handleSessionExpired = () => {
      // Only handle if we're not already on the login page
      if (window.location.pathname === redirectPath) return;

      // Store current path for potential redirect after login
      sessionStorage.setItem('auth_redirect_path', window.location.pathname);

      // Redirect to login page
      router.push(redirectPath);
    };

    // Add event listener
    window.addEventListener('auth:session-expired', handleSessionExpired);

    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      if (cleanup) cleanup();
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [isAuthenticated, router, redirectPath]);
}

export default useTokenExpiryHandler;
