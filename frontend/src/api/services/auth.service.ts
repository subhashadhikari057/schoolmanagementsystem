/**
 * =============================================================================
 * Authentication Service
 * =============================================================================
 * Service for handling authentication API calls
 * =============================================================================
 */

import { httpClient } from '../client';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MeResponse,
  RequestPasswordResetRequest,
  PasswordResetRequest,
  ChangePasswordRequest,
  RegisterRequest,
} from '../types/auth';
import { ApiResponse } from '../types/common';
import { csrfService } from './csrf.service';

// ============================================================================
// API Endpoints
// ============================================================================

const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  ME: '/api/v1/auth/me', // Correct endpoint for current user
  REGISTER: '/api/v1/auth/register',
  REQUEST_PASSWORD_RESET: '/api/v1/auth/password/request-reset',
  RESET_PASSWORD: '/api/v1/auth/password/reset',
  CHANGE_PASSWORD: '/api/v1/auth/change-password',
  FORCE_CHANGE_PASSWORD: '/api/v1/auth/change-password-forced',
} as const;

// ============================================================================
// Authentication Service Class
// ============================================================================

export class AuthService {
  /**
   * Login with email/phone and password
   * Returns either normal login response or password change required response
   */
  async login(credentials: LoginRequest): Promise<
    ApiResponse<
      | { message: string }
      | {
          message: string;
          requirePasswordChange: boolean;
          tempToken: string;
          userInfo: { id: string; fullName: string; email: string };
        }
    >
  > {
    try {
      const response = await httpClient.post<
        | { message: string }
        | {
            message: string;
            requirePasswordChange: boolean;
            tempToken: string;
            userInfo: { id: string; fullName: string; email: string };
          }
      >(AUTH_ENDPOINTS.LOGIN, credentials, { requiresAuth: false });

      // Backend sets cookies automatically for normal login,
      // or returns temp token for password change
      return response;
    } catch (error) {
      // Only log unexpected login errors in development
      if (process.env.NODE_ENV === 'development') {
        const apiError = error as any;
        if (apiError?.statusCode !== 401) {
          // Don't log invalid credentials
          console.error('Login error:', error);
        }
      }
      throw error;
    }
  }

  /**
   * Force change password for first-time users
   */
  async forceChangePassword(data: {
    temp_token: string;
    new_password: string;
    confirm_password: string;
  }): Promise<ApiResponse<{ message: string; success: boolean }>> {
    try {
      const response = await httpClient.post<{
        message: string;
        success: boolean;
      }>(AUTH_ENDPOINTS.FORCE_CHANGE_PASSWORD, data, { requiresAuth: false });

      return response;
    } catch (error) {
      console.error('Force change password error:', error);
      throw error;
    }
  }

  /**
   * Logout current session
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.post<void>(
        AUTH_ENDPOINTS.LOGOUT,
        {},
        { requiresAuth: false }, // Auth is handled by cookies
      );

      // Clear CSRF token on successful logout
      csrfService.clearToken();

      return response;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshTokenData: RefreshTokenRequest,
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    try {
      const response = await httpClient.post<RefreshTokenResponse>(
        AUTH_ENDPOINTS.REFRESH,
        refreshTokenData,
        { requiresAuth: false },
      );

      // Set new access token in HTTP client
      if (response.data?.access_token) {
        httpClient.setAccessToken(response.data.access_token);
      }

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<MeResponse>> {
    try {
      return await httpClient.get<MeResponse>(AUTH_ENDPOINTS.ME, undefined, {
        requiresAuth: false, // Auth is handled by cookies, not Bearer token
      });
    } catch (error) {
      console.error('Get current user error:', error);

      // Log the full error for debugging
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          status: (error as any).statusCode,
          message: (error as any).message,
          error: (error as any).error,
          full: error,
        });
      }
      throw error;
    }
  }

  /**
   * Register new user (if self-registration is allowed)
   */
  async register(
    registrationData: RegisterRequest,
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      return await httpClient.post<LoginResponse>(
        AUTH_ENDPOINTS.REGISTER,
        registrationData,
        { requiresAuth: false },
      );
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    data: RequestPasswordResetRequest,
  ): Promise<ApiResponse<void>> {
    try {
      return await httpClient.post<void>(
        AUTH_ENDPOINTS.REQUEST_PASSWORD_RESET,
        data,
        { requiresAuth: false },
      );
    } catch (error) {
      console.error('Request password reset error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetRequest): Promise<ApiResponse<void>> {
    try {
      return await httpClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, data, {
        requiresAuth: false,
      });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    data: ChangePasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      return await httpClient.post<{ message: string }>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
        data,
        {
          requiresAuth: true,
        },
      );
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Set access token in HTTP client
   */
  setAccessToken(token: string | null): void {
    httpClient.setAccessToken(token);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return httpClient.getAccessToken();
  }
}

// ============================================================================
// Default Service Instance
// ============================================================================

export const authService = new AuthService();
