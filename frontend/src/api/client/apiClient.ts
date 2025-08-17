/**
 * =============================================================================
 * API Client
 * =============================================================================
 * Wrapper around HttpClient for easier API usage
 * =============================================================================
 */

import { httpClient } from './http-client';

// Create a simple API client wrapper
export const apiClient = {
  get: async <T>(url: string, params?: Record<string, unknown>) => {
    const response = await httpClient.get<T>(url, params);
    return response;
  },

  post: async <T>(url: string, data?: unknown) => {
    const response = await httpClient.post<T>(url, data);
    return response;
  },

  put: async <T>(url: string, data?: unknown) => {
    const response = await httpClient.put<T>(url, data);
    return response;
  },

  patch: async <T>(url: string, data?: unknown) => {
    const response = await httpClient.patch<T>(url, data);
    return response;
  },

  delete: async <T>(url: string) => {
    const response = await httpClient.delete<T>(url);
    return response;
  },
};
