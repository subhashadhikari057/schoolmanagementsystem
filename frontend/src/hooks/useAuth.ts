/**
 * =============================================================================
 * Authentication Hook
 * =============================================================================
 * React hook for managing authentication state and actions
 * =============================================================================
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/api/services/auth.service';
import { LoginRequest, AuthUser, AuthState } from '@/api/types/auth';
import { ApiError } from '@/api/types/common';

// ============================================================================
// Token Storage Utilities
// ============================================================================

const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'sms_access_token',
  REFRESH_TOKEN: 'sms_refresh_token',
  USER: 'sms_user',
} as const;

const getStoredToken = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const setStoredToken = (key: string, token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, token);
};

const removeStoredToken = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(TOKEN_STORAGE_KEYS.USER);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

const setStoredUser = (user: AuthUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEYS.USER, JSON.stringify(user));
};

const removeStoredUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEYS.USER);
};

// ============================================================================
// Authentication Hook
// ============================================================================

export function useAuth() {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  // Initialize authentication state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken = getStoredToken(
          TOKEN_STORAGE_KEYS.ACCESS_TOKEN,
        );
        const storedRefreshToken = getStoredToken(
          TOKEN_STORAGE_KEYS.REFRESH_TOKEN,
        );
        const storedUser = getStoredUser();

        if (storedAccessToken && storedUser) {
          // Set token in auth service
          authService.setAccessToken(storedAccessToken);

          // Try to verify token by getting current user
          try {
            const response = await authService.getCurrentUser();

            setAuthState({
              isAuthenticated: true,
              user: response.data,
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            // Token might be expired, try to refresh if we have refresh token
            if (storedRefreshToken) {
              try {
                const refreshResponse = await authService.refreshToken({
                  refresh_token: storedRefreshToken,
                });

                const newAccessToken = refreshResponse.data.access_token;
                setStoredToken(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

                // Get user info with new token
                const userResponse = await authService.getCurrentUser();

                setAuthState({
                  isAuthenticated: true,
                  user: userResponse.data,
                  accessToken: newAccessToken,
                  refreshToken: storedRefreshToken,
                  isLoading: false,
                  error: null,
                });
              } catch (refreshError) {
                // Both tokens are invalid, clear storage
                clearStoredAuth();
                setAuthState({
                  isAuthenticated: false,
                  user: null,
                  accessToken: null,
                  refreshToken: null,
                  isLoading: false,
                  error: null,
                });
              }
            } else {
              // No refresh token, clear storage
              clearStoredAuth();
              setAuthState({
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
                isLoading: false,
                error: null,
              });
            }
          }
        } else {
          // No stored tokens
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Clear stored authentication data
  const clearStoredAuth = useCallback(() => {
    removeStoredToken(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    removeStoredToken(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    removeStoredUser();
    authService.setAccessToken(null);
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.login(credentials);
      const { access_token, refresh_token, user } = response.data;

      // Store tokens and user data
      setStoredToken(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, access_token);
      setStoredToken(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      setStoredUser(user);

      // Update state
      setAuthState({
        isAuthenticated: true,
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message || 'Login failed',
      }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Call logout API (even if it fails, we'll clear local state)
      try {
        await authService.logout();
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }

      // Clear stored data and state
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    }
  }, [clearStoredAuth]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      const storedRefreshToken = getStoredToken(
        TOKEN_STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken({
        refresh_token: storedRefreshToken,
      });

      const newAccessToken = response.data.access_token;
      setStoredToken(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

      setAuthState(prev => ({
        ...prev,
        accessToken: newAccessToken,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [logout]);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();

      setAuthState(prev => ({
        ...prev,
        user: response.data,
      }));

      setStoredUser(response.data);
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...authState,

    // Actions
    login,
    logout,
    refreshAccessToken,
    getCurrentUser,
    clearError,
  };
}
