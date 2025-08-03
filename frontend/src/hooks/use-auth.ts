/**
 * =============================================================================
 * Authentication Hook
 * =============================================================================
 * React hook for authentication state and actions
 * =============================================================================
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@sms/shared-types';
import { useAuthStore } from '@/stores/auth.store';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '@/constants';

export function useAuth() {
  const router = useRouter();
  const authStore = useAuthStore();

  // Auto-refresh token when needed
  useEffect(() => {
    if (authStore.isAuthenticated && authStore.needsTokenRefresh()) {
      authStore.refreshToken().catch(() => {
        // Refresh failed, redirect to login
        router.push(AUTH_ROUTES.LOGIN);
      });
    }
  }, [authStore, router]);

  // Periodic token validation
  useEffect(() => {
    if (!authStore.isAuthenticated) return;

    const interval = setInterval(() => {
      if (!authStore.isTokenValid()) {
        authStore.logout();
        router.push(AUTH_ROUTES.LOGIN);
      } else if (authStore.needsTokenRefresh()) {
        void authStore.refreshToken().catch(() => {
          router.push(AUTH_ROUTES.LOGIN);
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [authStore, router]);

  return {
    // State
    user: authStore.user,
    tokens: authStore.tokens,
    permissions: authStore.permissions,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,

    // Actions
    login: authStore.login,
    logout: authStore.logout,
    refreshToken: authStore.refreshToken,
    clearError: authStore.clearError,
    updateUser: authStore.updateUser,

    // Utilities
    hasPermission: authStore.hasPermission,
    hasRole: authStore.hasRole,
    hasMinRole: authStore.hasMinRole,
    isTokenValid: authStore.isTokenValid,
    needsTokenRefresh: authStore.needsTokenRefresh,
  };
}

export function useRequireAuth(requiredRole?: UserRole | UserRole[]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.push(AUTH_ROUTES.LOGIN);
      return;
    }

    if (requiredRole && !auth.hasRole(requiredRole)) {
      router.push(AUTH_ROUTES.FORBIDDEN);
      return;
    }
  }, [auth, requiredRole, router]);

  return auth;
}

export function useGuestOnly() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.push(AUTH_ROUTES.DASHBOARD);
    }
  }, [auth.isAuthenticated, router]);

  return auth;
}

export function useRouteGuard() {
  const auth = useAuth();
  const router = useRouter();

  const checkRouteAccess = (pathname: string): boolean => {
    // Public routes are always accessible
    if (PUBLIC_ROUTES.includes(pathname as any)) {
      return true;
    }

    // Require authentication for protected routes
    if (!auth.isAuthenticated) {
      router.push(AUTH_ROUTES.LOGIN);
      return false;
    }

    return true;
  };

  return { checkRouteAccess };
}
