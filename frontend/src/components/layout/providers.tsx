/**
 * =============================================================================
 * Application Providers
 * =============================================================================
 * Root providers for React Query, authentication, and other global state
 * =============================================================================
 */

'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize auth store on mount
  React.useEffect(() => {
    // Auth store initialization is handled by Zustand persist middleware
  }, []);

  return <>{children}</>;
}
