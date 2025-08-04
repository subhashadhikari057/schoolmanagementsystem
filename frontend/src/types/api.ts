/**
 * =============================================================================
 * API Type Definitions
 * =============================================================================
 * TypeScript interfaces for API requests and responses
 * =============================================================================
 */

export interface BaseErrorResponseDto {
  message: string;
  code?: string;
  status?: number;
}

export interface DetailedErrorResponseDto extends BaseErrorResponseDto {
  details?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  traceId: string;
}

export interface ApiError extends BaseErrorResponseDto {
  details?: DetailedErrorResponseDto['details'];
  context?: DetailedErrorResponseDto['context'];
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

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface RequestInterceptor {
  onRequest?: (
    config: ApiRequestConfig,
  ) => ApiRequestConfig | Promise<ApiRequestConfig>;
  onRequestError?: (error: unknown) => unknown;
}

export interface ResponseInterceptor {
  onResponse?: <T>(
    response: ApiResponse<T>,
  ) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onResponseError?: (error: ApiError) => unknown;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadConfig {
  onProgress?: (progress: UploadProgress) => void;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}
