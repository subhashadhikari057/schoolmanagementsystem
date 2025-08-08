/**
 * =============================================================================
 * Auth Provider Component
 * =============================================================================
 * React context provider for authentication state and token expiry handling
 * =============================================================================
 */

'use client';

import { ReactNode, createContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Create context for auth state
export const AuthContext = createContext<ReturnType<typeof useAuth> | null>(
  null,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const [initialized, setInitialized] = useState(false);

  // Check for auth redirect message on mount - but only on client side
  useEffect(() => {
    // Mark as initialized immediately to prevent hydration mismatch
    setInitialized(true);

    // Handle redirect message after component is mounted
    const handleRedirectMessage = () => {
      const redirectMessage = sessionStorage.getItem('auth_redirect_message');
      if (redirectMessage) {
        // Delay toast to avoid hydration issues
        setTimeout(() => {
          toast.error(redirectMessage);
        }, 0);
        sessionStorage.removeItem('auth_redirect_message');
      }
    };

    handleRedirectMessage();
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
