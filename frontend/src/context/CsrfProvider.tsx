'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { csrfService } from '@/api/services/csrf.service';

// Create context
const CsrfContext = createContext<{
  refreshCsrfToken: () => Promise<void>;
}>({
  refreshCsrfToken: async () => {},
});

/**
 * CSRF Provider Component
 * Initializes CSRF token and provides methods to refresh it
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  // Initialize CSRF token on mount
  useEffect(() => {
    const initCsrf = async () => {
      try {
        await csrfService.fetchToken();
        console.log('CSRF token initialized');
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        // Don't block the application if CSRF token fetch fails
        // The app will still work for GET requests and auth endpoints
        // For mutation endpoints, we'll handle the error in the HTTP client
      }
    };

    // Add a small delay to ensure the backend is ready
    const timeoutId = setTimeout(() => {
      initCsrf();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Function to refresh CSRF token
  const refreshCsrfToken = async () => {
    try {
      await csrfService.fetchToken();
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
    }
  };

  return (
    <CsrfContext.Provider value={{ refreshCsrfToken }}>
      {children}
    </CsrfContext.Provider>
  );
}

// Hook to use CSRF context
export const useCsrf = () => useContext(CsrfContext);

export default CsrfProvider;
