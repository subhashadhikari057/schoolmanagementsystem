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
  AuthErrorResponse,
} from '../types/auth';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  ME: '/api/v1/auth/me',
  REGISTER: '/api/v1/auth/register',
  REQUEST_PASSWORD_RESET: '/api/v1/auth/password/request-reset',
  RESET_PASSWORD: '/api/v1/auth/password/reset',
  CHANGE_PASSWORD: '/api/v1/auth/password/change',
} as const;

// ============================================================================
// Authentication Service Class
// ============================================================================

export class AuthService {
  /**
   * Login with email/phone and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await httpClient.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        credentials,
        { requiresAuth: false },
      );

      // Set access token in HTTP client for future requests
      if (response.data?.access_token) {
        httpClient.setAccessToken(response.data.access_token);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
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
        { requiresAuth: true },
      );

      // Clear access token from HTTP client
      httpClient.setAccessToken(null);

      return response;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local token
      httpClient.setAccessToken(null);
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
        requiresAuth: true,
      });
    } catch (error) {
      console.error('Get current user error:', error);
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
  ): Promise<ApiResponse<void>> {
    try {
      return await httpClient.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, data, {
        requiresAuth: true,
      });
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
