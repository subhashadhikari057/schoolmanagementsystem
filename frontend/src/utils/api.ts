/**
 * =============================================================================
 * API Utilities
 * =============================================================================
 * Helper functions for API requests, error handling, and data transformation
 * =============================================================================
 */

import { ApiError, QueryParams } from '@/types';

/**
 * Build query string from parameters
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Generate unique trace ID for requests
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return Boolean(
    error && typeof error === 'object' && 'code' in error && 'message' in error,
  );
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message || 'An unknown error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const errorObj = error as Record<string, unknown>;
  return (
    errorObj.code === 'NETWORK_ERROR' ||
    (typeof errorObj.message === 'string' &&
      errorObj.message.includes('Network Error')) ||
    (typeof errorObj.message === 'string' && errorObj.message.includes('fetch'))
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const axiosError = error as any;
  const status = axiosError?.response?.status || axiosError?.status;
  const code = axiosError?.response?.data?.code || axiosError?.code;

  return (
    status === 401 || // Unauthorized
    status === 400 || // Bad Request (validation errors - don't retry)
    status === 403 || // Forbidden (don't retry)
    code === 'UNAUTHORIZED' ||
    code === 'TOKEN_EXPIRED' ||
    code === 'VALIDATION_ERROR' ||
    code === 'AUTHENTICATION_FAILED'
  );
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const errorObj = error as Record<string, unknown>;
  return (
    errorObj.status === 400 ||
    errorObj.code === 'VALIDATION_ERROR' ||
    errorObj.code === 'BAD_REQUEST'
  );
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const errorObj = error as Record<string, unknown>;
  return (
    errorObj.status === 403 ||
    errorObj.code === 'FORBIDDEN' ||
    errorObj.code === 'INSUFFICIENT_PERMISSIONS'
  );
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
