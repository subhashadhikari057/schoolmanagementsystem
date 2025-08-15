/**
 * =============================================================================
 * Token Expiry Handler
 * =============================================================================
 * Utility for handling JWT token expiration and redirecting to login page
 * =============================================================================
 */

import { authService } from '@/api/services/auth.service';
import { ApiError } from '@/api/types/common';
import { isTokenExpired } from './jwt-helper';

// ============================================================================
// Constants
// ============================================================================

/**
 * Error codes that indicate authentication issues
 */
export const AUTH_ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  UNAUTHORIZED: 'UNAUTHORIZED',
};

/**
 * Auth-related HTTP status codes
 */
export const AUTH_STATUS_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

// ============================================================================
// Token Expiry Detection
// ============================================================================

/**
 * Check if an API error indicates token expiration
 */
export const isTokenExpiryError = (error: unknown): boolean => {
  if (!error) return false;

  // Check for ApiError type with status code
  const apiError = error as ApiError;
  if (apiError.statusCode === AUTH_STATUS_CODES.UNAUTHORIZED) {
    return true;
  }

  // Check for specific error codes
  if (apiError.code) {
    return Object.values(AUTH_ERROR_CODES).includes(
      apiError.code as keyof typeof AUTH_ERROR_CODES,
    );
  }

  // Check error message for common expiry phrases
  if (apiError.message) {
    const expiryPhrases = [
      'token expired',
      'jwt expired',
      'session expired',
      'access token is required',
      'invalid token',
      'not authenticated',
      'authentication required',
      'unauthorized',
    ];

    return expiryPhrases.some(phrase =>
      apiError.message.toLowerCase().includes(phrase.toLowerCase()),
    );
  }

  return false;
};

// ============================================================================
// Session Verification
// ============================================================================

/**
 * Check if the access token is expired
 * Returns true if token is expired or not available
 * @param bufferSeconds Buffer time in seconds before expiration (default: 60)
 */
export const checkTokenExpiration = (bufferSeconds = 60): boolean => {
  const token = authService.getAccessToken();

  // If no token is available, check if we're on a login page
  if (!token) {
    // Don't consider token expired on login-related pages
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/auth/login') || path.includes('/auth/register')) {
        return false;
      }
    }
    return true;
  }

  // Check if token is actually expired
  return isTokenExpired(token, bufferSeconds);
};

/**
 * Verify if the current session is still valid
 * Returns true if session is valid, false otherwise
 */
export const verifySession = async (): Promise<boolean> => {
  // Skip verification on login pages
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return true;
    }
  }

  // First check if token is expired without making API call
  // Use a larger buffer (5 minutes) to avoid aggressive checks
  if (checkTokenExpiration(300)) {
    handleSessionExpiry();
    return false;
  }

  try {
    // Attempt to get current user data
    await authService.getCurrentUser();
    return true;
  } catch (error) {
    if (isTokenExpiryError(error)) {
      // Token has expired, trigger session expiry handling
      handleSessionExpiry();
      return false;
    }

    // Some other error occurred
    console.error('Session verification error:', error);
    return false;
  }
};

// ============================================================================
// Session Expiry Handling
// ============================================================================

/**
 * Handle session expiry by redirecting to login page
 * @param message Optional custom message to display on login page
 */
export const handleSessionExpiry = (message?: string): void => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Clear auth state by triggering the session expired event
  window.dispatchEvent(new CustomEvent('auth:session-expired'));

  // Store redirect message if provided
  if (message) {
    sessionStorage.setItem('auth_redirect_message', message);
  } else {
    sessionStorage.setItem(
      'auth_redirect_message',
      'Your session has expired. Please log in again to continue.',
    );
  }

  // Get current path for potential redirect after login
  const currentPath = window.location.pathname;
  if (currentPath !== '/auth/login') {
    sessionStorage.setItem('auth_redirect_path', currentPath);
  }
};

// ============================================================================
// Periodic Session Verification
// ============================================================================

/**
 * Set up periodic session verification
 * @param intervalMinutes How often to verify session (in minutes)
 * @returns Cleanup function to clear the interval
 */
export const setupSessionVerification = (
  intervalMinutes = 15,
): (() => void) => {
  // Only run in browser environment
  if (typeof window === 'undefined') return () => {};

  // Convert minutes to milliseconds
  const intervalMs = intervalMinutes * 60 * 1000;

  // Add a random delay before first check (1-5 seconds)
  // This helps prevent all tabs from checking at the same time
  const initialDelay = Math.floor(Math.random() * 4000) + 1000;

  // Set up timeout for first check with delay
  const initialTimeoutId = setTimeout(() => {
    // Don't check on login pages
    const path = window.location.pathname;
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return;
    }

    // Set up interval for subsequent checks
    const intervalId = setInterval(async () => {
      // Skip check if we're on login page
      const currentPath = window.location.pathname;
      if (
        currentPath.includes('/auth/login') ||
        currentPath.includes('/auth/register')
      ) {
        return;
      }

      await verifySession();
    }, intervalMs);

    // Store interval ID for cleanup
    (
      window as Window & { __tokenExpiryIntervalId?: NodeJS.Timeout }
    ).__tokenExpiryIntervalId = intervalId;
  }, initialDelay);

  // Store timeout ID for cleanup
  (
    window as Window & { __tokenExpiryTimeoutId?: NodeJS.Timeout }
  ).__tokenExpiryTimeoutId = initialTimeoutId;

  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      const w = window as Window & {
        __tokenExpiryTimeoutId?: NodeJS.Timeout;
        __tokenExpiryIntervalId?: NodeJS.Timeout;
      };

      if (w.__tokenExpiryTimeoutId) {
        clearTimeout(w.__tokenExpiryTimeoutId);
      }

      if (w.__tokenExpiryIntervalId) {
        clearInterval(w.__tokenExpiryIntervalId);
      }
    }
  };
};

// ============================================================================
// Initialize Token Expiry Handler
// ============================================================================

/**
 * Initialize token expiry handler
 * Sets up event listeners and periodic verification
 */
export const initTokenExpiryHandler = (): (() => void) => {
  // Skip initialization on login pages
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return () => {};
    }
  }

  // Set up event listener for API errors
  const handleApiError = (event: CustomEvent<ApiError>) => {
    const error = event.detail;
    // Only handle token expiry errors, not all API errors
    if (isTokenExpiryError(error)) {
      // Check if we're on login page
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.includes('/auth/login') || path.includes('/auth/register')) {
          return;
        }
      }

      handleSessionExpiry();
    }
  };

  // Add event listener for API errors
  if (typeof window !== 'undefined') {
    window.addEventListener('api:error', handleApiError as EventListener);
  }

  // Set up periodic session verification with longer interval (15 minutes)
  const cleanupVerification = setupSessionVerification(15);

  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('api:error', handleApiError as EventListener);
    }
    cleanupVerification();
  };
};
