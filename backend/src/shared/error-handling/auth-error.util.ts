/**
 * =============================================================================
 * Authentication Error Utilities
 * =============================================================================
 * Standardized error responses for authentication-related errors
 * =============================================================================
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  TOKEN_REUSE_DETECTED = 'TOKEN_REUSE_DETECTED',
  CSRF_VALIDATION_FAILED = 'CSRF_VALIDATION_FAILED',
}

/**
 * Standard authentication error response
 */
export interface AuthErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: AuthErrorCode;
  details?: Record<string, any>;
}

/**
 * Authentication error response utilities
 */
export class AuthError {
  /**
   * Token expired error
   */
  static tokenExpired(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Your access token has expired. Please refresh your session.',
      code: AuthErrorCode.TOKEN_EXPIRED,
      details,
    };
  }

  /**
   * Invalid token error
   */
  static invalidToken(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Invalid authentication token provided.',
      code: AuthErrorCode.INVALID_TOKEN,
      details,
    };
  }

  /**
   * Token revoked error
   */
  static tokenRevoked(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Your session has been revoked. Please log in again.',
      code: AuthErrorCode.TOKEN_REVOKED,
      details,
    };
  }

  /**
   * Session expired error
   */
  static sessionExpired(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message:
        'Your session has expired due to inactivity. Please log in again.',
      code: AuthErrorCode.SESSION_EXPIRED,
      details,
    };
  }

  /**
   * Access denied error
   */
  static accessDenied(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: 'You do not have permission to access this resource.',
      code: AuthErrorCode.ACCESS_DENIED,
      details,
    };
  }

  /**
   * Unauthorized error
   */
  static unauthorized(
    message = 'Authentication required',
    details?: Record<string, any>,
  ): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message,
      code: AuthErrorCode.UNAUTHORIZED,
      details,
    };
  }

  /**
   * Refresh failed error
   */
  static refreshFailed(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Failed to refresh your session. Please log in again.',
      code: AuthErrorCode.REFRESH_FAILED,
      details,
    };
  }

  /**
   * Token reuse detected error
   */
  static tokenReuseDetected(details?: Record<string, any>): AuthErrorResponse {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message:
        'Security violation detected. All sessions have been revoked for your protection.',
      code: AuthErrorCode.TOKEN_REUSE_DETECTED,
      details,
    };
  }

  /**
   * CSRF validation failed error
   */
  static csrfValidationFailed(
    details?: Record<string, any>,
  ): AuthErrorResponse {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message:
        'CSRF token validation failed. Please refresh the page and try again.',
      code: AuthErrorCode.CSRF_VALIDATION_FAILED,
      details,
    };
  }
}
