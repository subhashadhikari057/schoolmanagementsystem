/**
 * =============================================================================
 * Common API Types
 * =============================================================================
 * Shared types used across all API modules
 * =============================================================================
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  traceId?: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
  context?: Record<string, any>;
  validationErrors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  csrfRetry?: boolean; // Flag to prevent infinite CSRF token refresh loops
  skipCsrf?: boolean; // Skip CSRF token for this request
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
