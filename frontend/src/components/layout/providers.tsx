/**
 * =============================================================================
 * Application Providers
 * =============================================================================
 * Root providers for authentication and other global state
 * =============================================================================
 */

'use client';

import React from 'react';

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
