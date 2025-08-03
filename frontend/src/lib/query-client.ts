/**
 * =============================================================================
 * React Query Client Configuration
 * =============================================================================
 * Configured React Query client with error handling and caching
 * =============================================================================
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { isAuthError, isNetworkError, getErrorMessage } from '@/utils';

const queryConfig: DefaultOptions = {
  queries: {
    // Global query defaults
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (isAuthError(error)) return false;

      // Retry network errors up to 3 times
      if (isNetworkError(error)) return failureCount < 3;

      // Don't retry other errors
      return false;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  mutations: {
    // Global mutation defaults
    retry: (failureCount, error) => {
      // Don't retry mutations on auth errors
      if (isAuthError(error)) return false;

      // Retry network errors once
      if (isNetworkError(error)) return failureCount < 1;

      // Don't retry other errors
      return false;
    },
    retryDelay: 1000,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  logger: {
    log: console.log,
    warn: console.warn,
    error: error => {
      // Don't log auth errors to avoid spam
      if (!isAuthError(error)) {
        console.error('Query Error:', getErrorMessage(error));
      }
    },
  },
});

export default queryClient;
