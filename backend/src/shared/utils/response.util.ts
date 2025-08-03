/**
 * =============================================================================
 * Response Utility Functions
 * =============================================================================
 * Standardized response formatting for consistent API responses
 * =============================================================================
 */

import { HttpStatus } from '@nestjs/common';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
  traceId?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  traceId?: string;
  details?: any;
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = 'Operation successful',
  traceId?: string,
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    ...(traceId && { traceId }),
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  traceId?: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return {
    success: false,
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...(traceId && { traceId }),
    ...(details && { details }),
  } as ErrorResponse;
}

/**
 * Create paginated response
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data retrieved successfully',
  traceId?: string,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...(traceId && { traceId }),
  };
}
