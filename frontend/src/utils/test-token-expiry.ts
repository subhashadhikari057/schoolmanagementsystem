/**
 * =============================================================================
 * Token Expiry Test Utility
 * =============================================================================
 * Utility for testing token expiration handling
 * This is a development-only utility and should not be used in production
 * =============================================================================
 */

import { handleSessionExpiry } from './token-expiry-handler';
import { ApiError } from '@/api/types/common';
import { dispatchApiErrorEvent } from '@/api/client/api-interceptor';

/**
 * Simulate a token expiration event
 * This will trigger the session expiry handler
 */
export const simulateTokenExpiration = (): void => {
  // Create a fake API error
  const error: ApiError = {
    statusCode: 401,
    error: 'Unauthorized',
    message: 'Access token is required',
    code: 'TOKEN_EXPIRED',
  };

  // Dispatch the error event
  dispatchApiErrorEvent(error);

  console.log('Token expiration simulated');
};

/**
 * Simulate a session expiry directly
 * This will trigger the session expiry handler without an API error
 */
export const simulateSessionExpiry = (message?: string): void => {
  handleSessionExpiry(
    message || 'Your session has expired. Please log in again.',
  );
  console.log('Session expiry simulated');
};

/**
 * Simulate an API error
 * This will trigger the API error handler
 */
export const simulateApiError = (
  statusCode = 500,
  message = 'An unexpected error occurred',
): void => {
  const error: ApiError = {
    statusCode,
    error: statusCode === 401 ? 'Unauthorized' : 'Error',
    message,
  };

  dispatchApiErrorEvent(error);
  console.log(`API error simulated: ${statusCode} - ${message}`);
};

// Add a global function for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testTokenExpiry = {
    simulateTokenExpiration,
    simulateSessionExpiry,
    simulateApiError,
  };

  console.log(
    'Token expiry test utilities loaded. Use window.testTokenExpiry to test token expiration handling.',
  );
}
