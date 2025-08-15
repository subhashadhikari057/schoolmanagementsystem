/**
 * =============================================================================
 * API Interceptor
 * =============================================================================
 * Middleware for intercepting API responses and handling errors
 * =============================================================================
 */

import { ApiError } from '../types/common';
import { isTokenExpiryError } from '@/utils/token-expiry-handler';

// ============================================================================
// API Error Event Dispatching
// ============================================================================

/**
 * Dispatch an API error event that can be caught by event listeners
 */
export const dispatchApiErrorEvent = (error: ApiError): void => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('api:error', {
      detail: error,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    // If this is a token expiry error, also dispatch the session expired event
    if (isTokenExpiryError(error)) {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }
};

// ============================================================================
// Response Interceptor
// ============================================================================

/**
 * Process API response to handle common error patterns
 */
export const processApiResponse = <T>(response: Response, data: any): T => {
  // Check for error responses
  if (!response.ok) {
    const error: ApiError = {
      statusCode: response.status,
      error: response.statusText,
      message:
        data?.message || `HTTP ${response.status}: ${response.statusText}`,
      code: data?.code,
      details: data?.details,
      context: data?.context,
      validationErrors: data?.validationErrors,
    };

    // Dispatch error event
    dispatchApiErrorEvent(error);

    throw error;
  }

  return data as T;
};

// ============================================================================
// Error Interceptor
// ============================================================================

/**
 * Process API errors to standardize error handling
 */
export const processApiError = (error: any): never => {
  // If error is already an ApiError, dispatch it
  if (error && typeof error === 'object' && 'statusCode' in error) {
    dispatchApiErrorEvent(error as ApiError);
    throw error;
  }

  // Otherwise, create a new ApiError
  const apiError: ApiError = {
    statusCode: 500,
    error: 'Internal Error',
    message: error?.message || 'An unexpected error occurred',
  };

  dispatchApiErrorEvent(apiError);
  throw apiError;
};
