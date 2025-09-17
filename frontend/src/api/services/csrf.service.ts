/**
 * =============================================================================
 * CSRF Service
 * =============================================================================
 * Service for handling CSRF token management
 * =============================================================================
 */

import { httpClient } from '../client';

// CSRF token endpoint
const CSRF_TOKEN_ENDPOINT = '/api/v1/csrf/token';

/**
 * In-memory storage for CSRF token
 * This is refreshed when needed
 */
let csrfToken: string | null = null;

/**
 * CSRF Service for managing CSRF tokens
 */
export class CsrfService {
  /**
   * Fetch a new CSRF token from the server
   */
  async fetchToken(): Promise<string> {
    try {
      const response = await httpClient.get<{ token: string }>(
        CSRF_TOKEN_ENDPOINT,
        undefined,
        {
          requiresAuth: false,
          retries: 2, // Try up to 3 times total
          timeout: 5000, // 5 seconds timeout
        },
      );

      if (response.data?.token) {
        csrfToken = response.data.token;
        return csrfToken;
      }

      throw new Error('Failed to fetch CSRF token');
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  }

  /**
   * Get the current CSRF token, fetching a new one if needed
   */
  async getToken(): Promise<string> {
    if (!csrfToken) {
      return this.fetchToken();
    }
    return csrfToken;
  }

  /**
   * Clear the stored CSRF token
   * Call this when logging out or when token is invalid
   */
  clearToken(): void {
    csrfToken = null;
  }

  /**
   * Add CSRF token to request headers
   */
  async addTokenToHeaders(
    headers: Record<string, string> = {},
  ): Promise<Record<string, string>> {
    try {
      const token = await this.getToken();
      return {
        ...headers,
        'X-CSRF-Token': token,
      };
    } catch (error) {
      console.error('Failed to add CSRF token to headers:', error);
      return headers;
    }
  }
}

// Export a singleton instance
export const csrfService = new CsrfService();
