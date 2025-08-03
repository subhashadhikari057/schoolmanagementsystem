/**
 * Professional Auth Redirect Hook
 * Handles post-login redirects with proper React lifecycle management
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';
import { UserRole } from '@sms/shared-types';

interface UseAuthRedirectOptions {
  /** Whether to redirect after successful authentication */
  redirectOnAuth?: boolean;
  /** Custom redirect path (overrides role-based redirect) */
  redirectTo?: string;
  /** Whether to redirect immediately or wait for next render */
  immediate?: boolean;
}

/**
 * Hook for handling authentication-based redirects
 * Uses proper React lifecycle to prevent redirect loops and setState errors
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { redirectOnAuth = true, redirectTo, immediate = false } = options;
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading or if redirect is disabled
    if (isLoading || !redirectOnAuth) return;

    // Only redirect if user is authenticated
    if (isAuthenticated && user) {
      const targetPath = redirectTo || getRoleBasedDashboard(user.role);

      console.log(
        '🔄 useAuthRedirect: Redirecting authenticated user to:',
        targetPath,
      );

      if (immediate) {
        // Immediate redirect using window.location (for post-login)
        window.location.href = targetPath;
      } else {
        // Standard Next.js router redirect
        router.push(targetPath);
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    redirectTo,
    redirectOnAuth,
    immediate,
    router,
  ]);

  return {
    isRedirecting: isAuthenticated && !isLoading,
    targetPath: user ? redirectTo || getRoleBasedDashboard(user.role) : null,
  };
}

/**
 * Get role-based dashboard path
 */
function getRoleBasedDashboard(role: UserRole): string {
  const dashboardRoutes: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: '/dashboard/admin',
    [UserRole.ADMIN]: '/dashboard/admin',
    [UserRole.ACCOUNTANT]: '/dashboard/admin',
    [UserRole.TEACHER]: '/dashboard/teacher',
    [UserRole.STUDENT]: '/dashboard/student',
    [UserRole.PARENT]: '/dashboard/parent',
  };

  return dashboardRoutes[role] || '/dashboard/admin';
}
