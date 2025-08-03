/**
 * =============================================================================
 * Authentication Guard Component
 * =============================================================================
 * Route protection and authentication state management
 * =============================================================================
 */

'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@sms/shared-types';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui';
import { PUBLIC_ROUTES, AUTH_ROUTES } from '@/constants';

export interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  fallback,
  redirectTo,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(
    pathname as (typeof PUBLIC_ROUTES)[number],
  );

  // Always call hooks in the same order - no conditional hooks
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle unauthenticated users on protected routes
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push(redirectTo || AUTH_ROUTES.LOGIN);
      return;
    }

    // Handle role-based access control
    if (
      !isLoading &&
      isAuthenticated &&
      requiredRole &&
      !hasRole(requiredRole)
    ) {
      router.push(AUTH_ROUTES.FORBIDDEN);
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    isPublicRoute,
    requiredRole,
    hasRole,
    router,
    redirectTo,
  ]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className='flex items-center justify-center min-h-screen'>
          <LoadingSpinner size='lg' label='Loading...' />
        </div>
      )
    );
  }

  // If route is public, render children immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If not authenticated on protected route, show redirecting message
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className='flex items-center justify-center min-h-screen'>
          <LoadingSpinner size='lg' label='Redirecting to login...' />
        </div>
      )
    );
  }

  // If role is required but user doesn't have it, show access denied
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      fallback || (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-destructive mb-2'>
              Access Denied
            </h1>
            <p className='text-muted-foreground'>
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

export interface ProtectedRouteProps extends AuthGuardProps {
  loading?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  loading,
  ...guardProps
}: ProtectedRouteProps) {
  return (
    <AuthGuard
      {...guardProps}
      fallback={
        loading || (
          <div className='flex items-center justify-center min-h-screen'>
            <LoadingSpinner size='lg' label='Loading...' />
          </div>
        )
      }
    >
      {children}
    </AuthGuard>
  );
}

export interface GuestOnlyProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestOnly({ children, redirectTo }: GuestOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo || AUTH_ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner size='lg' label='Loading...' />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner size='lg' label='Redirecting...' />
      </div>
    );
  }

  return <>{children}</>;
}
