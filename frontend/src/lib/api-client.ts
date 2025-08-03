/**
 * =============================================================================
 * API Client Implementation
 * =============================================================================
 * Comprehensive API client with error handling, retries, and type safety
 * =============================================================================
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, API_HEADERS, CONTENT_TYPES } from '@/constants';
import {
  ApiResponse,
  ApiError,
  ApiRequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from '@/types';
import {
  generateTraceId,
  isApiError,
  isAuthError,
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearAuthData,
} from '@/utils';

class ApiClient {
  private client: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        [API_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
        [API_HEADERS.API_VERSION]: API_CONFIG.VERSION,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async config => {
        // Add trace ID to all requests
        config.headers[API_HEADERS.TRACE_ID] = generateTraceId();

        // Add authentication token if available
        const token = getAccessToken();
        if (token) {
          config.headers[API_HEADERS.AUTHORIZATION] = `Bearer ${token}`;
        }

        // Apply custom request interceptors
        let modifiedConfig = config;
        for (const interceptor of this.requestInterceptors) {
          if (interceptor.onRequest) {
            modifiedConfig = await interceptor.onRequest(
              modifiedConfig as ApiRequestConfig,
            );
          }
        }

        return modifiedConfig;
      },
      error => {
        // Apply custom request error interceptors
        for (const interceptor of this.requestInterceptors) {
          if (interceptor.onRequestError) {
            interceptor.onRequestError(error);
          }
        }
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      async (response: AxiosResponse) => {
        // Apply custom response interceptors
        let modifiedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onResponse) {
            modifiedResponse = await interceptor.onResponse(modifiedResponse);
          }
        }

        return modifiedResponse;
      },
      async error => {
        const apiError = this.transformError(error);

        // Handle authentication errors
        if (
          isAuthError(apiError) &&
          apiError.code !== 'REFRESH_TOKEN_EXPIRED'
        ) {
          try {
            await this.refreshToken();
            // Retry the original request
            return this.client.request(error.config);
          } catch (refreshError) {
            // Refresh failed, clear auth data and redirect to login
            clearAuthData();
            window.location.href = '/login';
            return Promise.reject(apiError);
          }
        }

        // Apply custom response error interceptors
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onResponseError) {
            interceptor.onResponseError(apiError);
          }
        }

        return Promise.reject(apiError);
      },
    );
  }

  private transformError(error: AxiosErrorWithResponse): ApiError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        success: false,
        error: data.error || 'Request failed',
        message: data.message || 'An error occurred',
        code: data.code || 'UNKNOWN_ERROR',
        statusCode: status,
        traceId: data.traceId || error.config?.headers?.[API_HEADERS.TRACE_ID],
        timestamp: data.timestamp || new Date().toISOString(),
        severity: data.severity || 'medium',
        details: data.details,
        context: data.context,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Network Error',
        message: 'No response received from server',
        code: 'NETWORK_ERROR',
        statusCode: 0,
        traceId: error.config?.headers?.[API_HEADERS.TRACE_ID],
        timestamp: new Date().toISOString(),
        severity: 'high',
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'Request Error',
        message: error.message || 'Failed to make request',
        code: 'REQUEST_ERROR',
        statusCode: 0,
        traceId: generateTraceId(),
        timestamp: new Date().toISOString(),
        severity: 'medium',
      };
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            [API_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
            [API_HEADERS.API_VERSION]: API_CONFIG.VERSION,
          },
        },
      );

      const { tokens } = response.data.data;
      storeTokens(tokens);
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  private async retryRequest<T>(
    config: ApiRequestConfig,
    retries: number = API_CONFIG.RETRY_ATTEMPTS,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (retries > 0 && !isAuthError(error)) {
        await new Promise(resolve =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY),
        );
        return this.retryRequest(config, retries - 1);
      }
      throw error;
    }
  }

  // Public methods
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  public async get<T>(
    url: string,
    config?: Partial<ApiRequestConfig>,
  ): Promise<ApiResponse<T>> {
    return this.retryRequest<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: Partial<ApiRequestConfig>,
  ): Promise<ApiResponse<T>> {
    return this.retryRequest<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: Partial<ApiRequestConfig>,
  ): Promise<ApiResponse<T>> {
    return this.retryRequest<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  public async patch<T>(
    url: string,
    data?: unknown,
    config?: Partial<ApiRequestConfig>,
  ): Promise<ApiResponse<T>> {
    return this.retryRequest<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  public async delete<T>(
    url: string,
    config?: Partial<ApiRequestConfig>,
  ): Promise<ApiResponse<T>> {
    return this.retryRequest<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  public async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.retryRequest<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        [API_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.FORM_DATA,
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    } as Partial<ApiRequestConfig>);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
