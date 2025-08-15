/**
 * =============================================================================
 * API Error Boundary Component
 * =============================================================================
 * React error boundary for catching and handling API errors
 * =============================================================================
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isTokenExpiryError } from '@/utils/token-expiry-handler';
import { ApiError } from '@/api/types/common';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: ApiError) => void;
}

export default function ApiErrorBoundary({
  children,
  fallback,
  onError,
}: ApiErrorBoundaryProps) {
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Event handler for API errors
    const handleApiError = (event: CustomEvent<ApiError>) => {
      const apiError = event.detail;

      // Call onError callback if provided
      if (onError) {
        onError(apiError);
      }

      // Set error state
      setError(apiError);

      // Handle token expiry errors
      if (isTokenExpiryError(apiError)) {
        // Store current path for redirect after login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            sessionStorage.setItem('auth_redirect_path', currentPath);
          }
        }

        // Show error toast
        toast.error('Your session has expired. Please log in again.');

        // Redirect to login page
        router.push('/auth/login');
      }
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('api:error', handleApiError as EventListener);
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'api:error',
          handleApiError as EventListener,
        );
      }
    };
  }, [router, onError]);

  // Show fallback if there is an error
  if (error) {
    return (
      fallback || (
        <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
          <h3 className='text-lg font-medium text-red-800'>
            {error.error || 'Error'}
          </h3>
          <p className='mt-1 text-sm text-red-700'>
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
      )
    );
  }

  // Otherwise show children
  return <>{children}</>;
}
