/**
 * =============================================================================
 * CSRF Token Hook
 * =============================================================================
 * React hook for managing CSRF tokens
 * =============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { csrfService } from '@/api/services/csrf.service';

/**
 * Hook to initialize and manage CSRF tokens
 */
export function useCsrfToken() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeCsrfToken() {
      try {
        setIsLoading(true);
        await csrfService.fetchToken();
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize CSRF token:', err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to initialize CSRF token'),
          );
          setIsLoading(false);
        }
      }
    }

    initializeCsrfToken();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoading, error };
}

export default useCsrfToken;
