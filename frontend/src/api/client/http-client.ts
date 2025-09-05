/**
 * =============================================================================
 * HTTP Client
 * =============================================================================
 * Reusable HTTP client with error handling, interceptors, and retry logic
 * =============================================================================
 */

import {
  ApiResponse,
  ApiError,
  RequestConfig,
  HttpMethod,
} from '../types/common';
import { dispatchApiErrorEvent } from './api-interceptor';
import { csrfService } from '../services/csrf.service';

// ============================================================================
// HTTP Client Configuration
// ============================================================================

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

const DEFAULT_CONFIG: HttpClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
  },
};

// Debug log for API URL
// console.log('🔗 API Base URL:', DEFAULT_CONFIG.baseURL);

// ============================================================================
// HTTP Client Class
// ============================================================================

export class HttpClient {
  private config: HttpClientConfig;
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private isLoggingOut: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    config: {
      method: HttpMethod;
      url: string;
      data?: unknown;
      requestConfig?: RequestConfig;
    };
  }> = [];
  private activeRequests: Set<AbortController> = new Set();

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Set access token for authenticated requests
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Cancel all active requests (used during logout)
  cancelAllRequests() {
    this.activeRequests.forEach(controller => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  // Set logout state to prevent new requests
  setLoggingOut(isLoggingOut: boolean) {
    this.isLoggingOut = isLoggingOut;
    if (isLoggingOut) {
      this.cancelAllRequests();
    }
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Generate trace ID for request tracking
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Build query string from parameters
  private buildQueryString(params: Record<string, unknown>): string {
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

  // Make HTTP request with retry logic
  private async makeRequest<T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    // Prevent new requests during logout
    if (this.isLoggingOut && !url.includes('/auth/')) {
      throw {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Session expired. Please login again.',
        code: 'LOGOUT_IN_PROGRESS',
      };
    }
    const traceId = this.generateTraceId();

    // Build request headers
    const headers: Record<string, string> = {
      ...this.config.headers,
      'X-Trace-ID': traceId,
      ...config.headers,
    };

    // Add authorization header if token is available and auth is required
    if (config.requiresAuth !== false && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Add CSRF token for mutation requests (except public auth endpoints)
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    // CRITICAL: Determine if this is a PUBLIC auth endpoint (no CSRF needed)
    // Protected auth endpoints like change-password still need CSRF protection
    const isPublicAuthEndpoint =
      url.endsWith('/login') ||
      url.endsWith('/register') ||
      url.endsWith('/refresh') ||
      url.includes('/csrf/token') ||
      url.includes('/password/request-reset') ||
      url.includes('/password/reset');

    // For error handling, we need to know if this is ANY auth endpoint (public or protected)
    const isAnyAuthEndpoint =
      url.includes('/auth/') || url.includes('/api/v1/auth/');

    if (isMutation && !isPublicAuthEndpoint && !config.skipCsrf) {
      try {
        const csrfHeaders = await csrfService.addTokenToHeaders();
        Object.assign(headers, csrfHeaders);
      } catch (error) {
        console.warn('Failed to add CSRF token to request:', error);
        // Continue without CSRF token - the server will reject if needed
        // This allows the app to work even if CSRF is not available
      }
    }

    // Build full URL
    const fullUrl = url.startsWith('http')
      ? url
      : `${this.config.baseURL}/${url}`
          .replace(/\/+/g, '/')
          .replace('http:/', 'http://');

    // Debug log for requests in development
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🌐 Making request:', {
    //     method,
    //     url: fullUrl,
    //     hasData: !!data,
    //     headers: Object.keys(headers),
    //   });
    // }

    // Request options
    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies in requests
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        requestOptions.body = data;
        // Remove Content-Type header for FormData (browser will set it with boundary)
        delete headers['Content-Type'];
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    let lastError: Error | null = null;
    const maxRetries = config.retries || this.config.retries;

    // Retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId: NodeJS.Timeout | undefined;
      let controller: AbortController | undefined;
      try {
        // Set up timeout for this attempt
        controller = new AbortController();
        this.activeRequests.add(controller);

        timeoutId = setTimeout(() => {
          controller?.abort();
        }, config.timeout || this.config.timeout);

        // Update request options with new controller
        requestOptions.signal = controller.signal;

        const response = await fetch(fullUrl, requestOptions);

        // Debug log for responses in development
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('📡 Response received:', {
        //     status: response.status,
        //     statusText: response.statusText,
        //     url: fullUrl,
        //     ok: response.ok,
        //   });
        // }

        // Parse response based on responseType or content-type
        let responseData: unknown;
        const contentType = response.headers.get('content-type');
        const responseType = config.responseType;

        if (responseType === 'blob') {
          responseData = await response.blob();
        } else if (responseType === 'text') {
          responseData = await response.text();
        } else if (
          responseType === 'json' ||
          (contentType && contentType.includes('application/json'))
        ) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Handle HTTP errors
        if (!response.ok) {
          // Only log detailed errors in development, but skip expected errors
          if (
            process.env.NODE_ENV === 'development' &&
            response.status !== 409 && // Skip conflicts (handled gracefully)
            !(isAnyAuthEndpoint && response.status === 401) // Skip auth failures (expected)
          ) {
            console.error('HTTP Error Response:', {
              status: response.status,
              statusText: response.statusText,
              url: fullUrl,
              data: responseData,
            });
          }

          // Extract validation errors if available
          let validationErrors: Record<string, string> = {};
          let errorMessage =
            (responseData as { message?: string })?.message ||
            `HTTP ${response.status}: ${response.statusText}`;

          // Handle 409 Conflict errors with user-friendly messages
          if (response.status === 409) {
            const responseDataTyped = responseData as { message?: string };
            if (responseDataTyped?.message?.includes('already exists')) {
              errorMessage = responseDataTyped.message;
            } else if (responseDataTyped?.message?.includes('conflict')) {
              errorMessage = responseDataTyped.message;
            } else {
              errorMessage =
                'A conflict occurred. The requested resource may already exist.';
            }
          }

          // Handle NestJS validation errors format
          const responseDataTyped = responseData as {
            message?: unknown;
            errors?: unknown;
            code?: string;
            details?: unknown;
            context?: unknown;
            data?: unknown;
          };
          if (
            responseDataTyped?.message &&
            Array.isArray(responseDataTyped.message)
          ) {
            // This is likely a validation error array from class-validator
            validationErrors = (
              responseDataTyped.message as Array<{
                property: string;
                constraints?: Record<string, string>;
              }>
            ).reduce(
              (
                acc: Record<string, string>,
                error: {
                  property: string;
                  constraints?: Record<string, string>;
                },
              ) => {
                // Extract the property and constraints
                const property = error.property;
                const constraints =
                  Object.values(error.constraints || {})[0] || 'Invalid value';
                acc[property] = constraints;
                return acc;
              },
              {},
            );

            // Create a user-friendly error message
            errorMessage =
              'Validation failed. Please check the highlighted fields.';
          }

          // Handle other common error formats
          if (responseDataTyped?.errors) {
            // Zod style: errors is an array of issues
            if (Array.isArray(responseDataTyped.errors)) {
              validationErrors = (
                responseDataTyped.errors as Array<{
                  path?: string[] | string;
                  message?: string;
                }>
              ).reduce(
                (
                  acc: Record<string, string>,
                  issue: { path?: string[] | string; message?: string },
                ) => {
                  const path = Array.isArray(issue.path)
                    ? issue.path.join('.')
                    : issue.path || 'field';
                  acc[path] = issue.message || 'Invalid value';
                  return acc;
                },
                {},
              );
              // Provide a friendlier message
              errorMessage = 'Validation failed. Please check your inputs.';
            } else if (typeof responseDataTyped.errors === 'object') {
              // Already an object map
              validationErrors = responseDataTyped.errors as Record<
                string,
                string
              >;
            }
          }
          const apiError: ApiError = {
            statusCode: response.status,
            error: response.statusText,
            message: errorMessage,
            code: responseDataTyped?.code,
            details: responseDataTyped?.details as
              | Record<string, unknown>
              | undefined,
            context: responseDataTyped?.context as
              | Record<string, unknown>
              | undefined,
            validationErrors:
              Object.keys(validationErrors).length > 0
                ? validationErrors
                : undefined,
          };

          // Handle 401 Unauthorized - session expired
          // CRITICAL: Only treat as session expiry if NOT on auth endpoints

          if (response.status === 401 && !isAnyAuthEndpoint) {
            // This is a session expiry, not a login failure
            // Dispatch API error event for token expiry handlers
            dispatchApiErrorEvent(apiError);
            return this.handleUnauthorized(method, url, data, config);
          }

          // Handle 403 Forbidden - CSRF token validation failed
          if (
            response.status === 403 &&
            apiError.code === 'CSRF_VALIDATION_FAILED'
          ) {
            // Try to refresh CSRF token and retry the request once
            if (!config.csrfRetry) {
              try {
                await csrfService.fetchToken(); // Get a fresh token
                return this.makeRequest(method, url, data, {
                  ...config,
                  csrfRetry: true, // Mark as retry to prevent infinite loop
                });
              } catch (csrfError) {
                console.error('Failed to refresh CSRF token:', csrfError);
              }
            }
          }

          // Dispatch API error event for other errors (including auth failures)
          // But mark auth endpoint failures differently to prevent session expiry handling
          if (isAnyAuthEndpoint && response.status === 401) {
            // This is a login/auth failure, not a session expiry
            // Don't trigger session expiry handlers
            dispatchApiErrorEvent({
              ...apiError,
              code: 'AUTH_FAILURE', // Mark as auth failure, not session expiry
            });
          } else {
            // Normal API error
            dispatchApiErrorEvent(apiError);
          }
          throw apiError;
        }

        // Clear timeout on success
        if (timeoutId) clearTimeout(timeoutId);
        this.activeRequests.delete(controller);

        // Return successful response
        const responseDataTyped = responseData as
          | Record<string, unknown>
          | undefined;

        // Decide whether to unwrap `data` or return the full payload.
        // If the payload has only `data` (and optional message/timestamp/meta), unwrap.
        // If it includes other useful fields like pagination (total, page, totalPages), keep as-is.
        let dataToReturn: unknown = responseData;
        let message: string | undefined = undefined;

        if (responseDataTyped && typeof responseDataTyped === 'object') {
          const keys = Object.keys(responseDataTyped);
          const hasDataKey = Object.prototype.hasOwnProperty.call(
            responseDataTyped,
            'data',
          );

          const allowedMetaKeys = new Set([
            'data',
            'message',
            'timestamp',
            'traceId',
            'statusCode',
            'success',
          ]);

          const hasOnlyDataAndMeta = keys.every(k => allowedMetaKeys.has(k));

          // Capture message if present
          if (typeof responseDataTyped.message === 'string') {
            message = responseDataTyped.message as string;
          }

          if (hasDataKey && hasOnlyDataAndMeta) {
            // Safe to unwrap
            dataToReturn = (responseDataTyped as { data: unknown }).data;
          } else {
            // Keep full payload (preserves pagination fields like total/totalPages)
            dataToReturn = responseDataTyped;
          }
        }

        return {
          success: true,
          data: dataToReturn as T,
          message,
          timestamp: new Date().toISOString(),
          traceId,
        };
      } catch (error) {
        lastError = error as Error;

        // Log detailed error information only in development, but skip expected errors
        if (process.env.NODE_ENV === 'development') {
          const apiError = error as ApiError;
          const isExpectedError =
            apiError?.statusCode === 409 || // Conflicts
            (isAnyAuthEndpoint && apiError?.statusCode === 401); // Auth failures

          if (!isExpectedError) {
            console.error('API Request Error:', {
              url: fullUrl,
              method,
              error: error instanceof Error ? error.message : error,
            });
          }
        }

        // Clear timeout on error
        if (timeoutId) clearTimeout(timeoutId);
        if (controller) this.activeRequests.delete(controller);

        // Don't retry for certain errors
        if (
          error instanceof TypeError ||
          (error as ApiError)?.statusCode === 401 ||
          (error as ApiError)?.statusCode === 403
        ) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, this.config.retryDelay),
          );
        }
      } finally {
        // Always clear timeout
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    // If we get here, all attempts failed
    if (lastError) {
      throw lastError;
    }

    throw new Error('Request failed after all retry attempts');
  }

  // Handle 401 Unauthorized - session refresh
  private async handleUnauthorized<T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    // Prevent refresh during logout
    if (this.isLoggingOut) {
      throw {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Session expired. Please login again.',
        code: 'LOGOUT_IN_PROGRESS',
      };
    }

    // If already refreshing, wait for the existing refresh promise
    if (this.refreshPromise) {
      try {
        const refreshSuccessful = await this.refreshPromise;
        if (refreshSuccessful) {
          // Retry the original request
          return this.makeRequest<T>(method, url, data, config);
        } else {
          throw {
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Session expired. Please login again.',
            code: 'SESSION_EXPIRED',
          };
        }
      } catch {
        throw {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Session expired. Please login again.',
          code: 'SESSION_EXPIRED',
        };
      }
    }

    // Start refresh process
    this.isRefreshing = true;
    this.refreshPromise = this.attemptTokenRefresh();

    try {
      const refreshSuccessful = await this.refreshPromise;

      if (refreshSuccessful) {
        // Retry the original request
        return this.makeRequest<T>(method, url, data, config);
      } else {
        throw new Error('Session refresh failed');
      }
    } catch {
      this.handleRefreshFailure();
      throw {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED',
      };
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Separate method for token refresh attempt
  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const refreshResponse = await fetch(
        `${this.config.baseURL}/api/v1/auth/refresh`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return refreshResponse.ok;
    } catch (error) {
      console.warn('Token refresh request failed:', error);
      return false;
    }
  }

  // Handle refresh failure - trigger logout once
  private handleRefreshFailure() {
    if (this.isLoggingOut) return; // Already handling logout

    this.isLoggingOut = true;
    this.cancelAllRequests();

    // Trigger logout via custom event so useAuth can handle it
    if (typeof window !== 'undefined') {
      // Use setTimeout to ensure this runs after current call stack
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }, 0);
    }
  }

  // HTTP method helpers
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.makeRequest<T>(
      'GET',
      `${url}${queryString}`,
      undefined,
      config,
    );
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', url, data, config);
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', url, data, config);
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', url, data, config);
  }

  async delete<T>(
    url: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', url, undefined, config);
  }
}

// ============================================================================
// Default HTTP Client Instance
// ============================================================================

export const httpClient = new HttpClient();
