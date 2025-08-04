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
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
  },
};

// Debug log for API URL
console.log('🔗 API Base URL:', DEFAULT_CONFIG.baseURL);

// ============================================================================
// HTTP Client Class
// ============================================================================

export class HttpClient {
  private config: HttpClientConfig;
  private accessToken: string | null = null;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Set access token for authenticated requests
  setAccessToken(token: string | null) {
    this.accessToken = token;
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
  private buildQueryString(params: Record<string, any>): string {
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
    data?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
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

    // Build full URL
    const fullUrl = url.startsWith('http')
      ? url
      : `${this.config.baseURL}/${url}`
          .replace(/\/+/g, '/')
          .replace('http:/', 'http://');

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
      try {
        // Set up timeout for this attempt
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
        }, config.timeout || this.config.timeout);

        // Update request options with new controller
        requestOptions.signal = controller.signal;

        const response = await fetch(fullUrl, requestOptions);

        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Handle HTTP errors
        if (!response.ok) {
          console.error('HTTP Error Response:', {
            status: response.status,
            statusText: response.statusText,
            url: fullUrl,
            responseData,
          });

          const apiError: ApiError = {
            statusCode: response.status,
            error: response.statusText,
            message:
              responseData?.message ||
              `HTTP ${response.status}: ${response.statusText}`,
            code: responseData?.code,
            details: responseData?.details,
            context: responseData?.context,
          };
          throw apiError;
        }

        // Clear timeout on success
        if (timeoutId) clearTimeout(timeoutId);

        // Return successful response
        return {
          success: true,
          data: responseData?.data || responseData,
          message: responseData?.message,
          timestamp: new Date().toISOString(),
          traceId,
        };
      } catch (error) {
        lastError = error as Error;

        // Clear timeout on error
        if (timeoutId) clearTimeout(timeoutId);

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

  // HTTP method helpers
  async get<T>(
    url: string,
    params?: Record<string, any>,
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
    data?: any,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', url, data, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', url, data, config);
  }

  async patch<T>(
    url: string,
    data?: any,
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
