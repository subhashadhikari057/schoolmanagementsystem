/**
 * =============================================================================
 * Session Guard Component
 * =============================================================================
 * Component to protect routes that require authentication
 * Handles token expiration and redirects to login if session is invalid
 * =============================================================================
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTokenExpiryHandler } from '@/hooks/useTokenExpiryHandler';

interface SessionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SessionGuard({
  children,
  fallback,
}: SessionGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [clientReady, setClientReady] = useState(false);

  // Use token expiry handler with a delay to prevent immediate checks
  useTokenExpiryHandler();

  // Handle client-side only code to prevent hydration mismatch
  useEffect(() => {
    setClientReady(true);
  }, []);

  // Only perform client-side redirects after hydration
  useEffect(() => {
    if (!clientReady) return;

    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, clientReady]);

  // Show loading state during server-side rendering or when loading
  if (!clientReady || isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Show content if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show fallback while redirecting
  return fallback || <div>Redirecting to login...</div>;
}
