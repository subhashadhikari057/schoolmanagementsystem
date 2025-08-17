/**
 * =============================================================================
 * Authentication Hook
 * =============================================================================
 * React hook for managing authentication state and actions
 * =============================================================================
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/api/services/auth.service';
import {
  LoginRequest,
  AuthUser,
  AuthState,
  ChangePasswordRequest,
} from '@/api/types/auth';
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
  const router = useRouter();
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  // Clear stored authentication data
  const clearStoredAuth = useCallback(() => {
    removeStoredToken(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    removeStoredToken(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    removeStoredUser();
    authService.setAccessToken(null);
  }, []);

  // Login function
  const login = useCallback(
    async (
      credentials: LoginRequest,
    ): Promise<{
      requirePasswordChange?: boolean;
      tempToken?: string;
      userInfo?: { id: string; fullName: string; email: string };
    } | void> => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        // Backend sets cookies automatically on successful login or returns password change info
        const loginResponse = await authService.login(credentials);

        // Check if password change is required
        if (
          loginResponse.data &&
          'requirePasswordChange' in loginResponse.data &&
          loginResponse.data.requirePasswordChange
        ) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return {
            requirePasswordChange: true,
            tempToken: loginResponse.data.tempToken,
            userInfo: loginResponse.data.userInfo,
          };
        }

        // Normal login flow - get user data after successful login
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;

        // Transform MeResponse to AuthUser
        const user: AuthUser = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          full_name: userData.full_name,
          phone: userData.phone,
          permissions: userData.permissions,
        };

        // Store user data locally for faster app initialization
        setStoredUser(user);

        // Update state
        setAuthState({
          isAuthenticated: true,
          user,
          accessToken: null, // Tokens are in cookies
          refreshToken: null, // Tokens are in cookies
          isLoading: false,
          error: null,
        });

        return; // Normal login completed
      } catch (error) {
        const apiError = error as ApiError;
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: apiError.message || 'Login failed',
        }));
        throw error;
      }
    },
    [],
  );

  // Force change password function for first-time users
  const forceChangePassword = useCallback(
    async (
      data: {
        temp_token: string;
        new_password: string;
        confirm_password: string;
      },
      userEmail?: string,
    ) => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        await authService.forceChangePassword(data);

        // After successful password change, the backend should set auth cookies automatically
        // or we can login with the user's email and new password
        if (userEmail) {
          const loginCredentials: LoginRequest = {
            identifier: userEmail,
            password: data.new_password,
          };

          // This will be a normal login now since password is changed
          await login(loginCredentials);
        } else {
          // If backend sets cookies automatically, just get user data
          const userResponse = await authService.getCurrentUser();
          const userData = userResponse.data;

          // Transform MeResponse to AuthUser
          const user: AuthUser = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            isActive: userData.isActive,
            full_name: userData.full_name,
            phone: userData.phone,
            permissions: userData.permissions,
          };

          // Store user data locally for faster app initialization
          setStoredUser(user);

          // Update state
          setAuthState({
            isAuthenticated: true,
            user,
            accessToken: null, // Tokens are in cookies
            refreshToken: null, // Tokens are in cookies
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        const apiError = error as ApiError;
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: apiError.message || 'Password change failed',
        }));
        throw error;
      }
    },
    [login],
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Call logout API (backend will clear cookies)
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
      router.push('/auth/login');
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
      router.push('/auth/login');
    }
  }, [clearStoredAuth, router]);

  // Initialize authentication state from stored data (don't call API)
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check if we have stored user data from previous session
        const storedUser = getStoredUser();

        if (storedUser) {
          // User was previously authenticated, try to verify session
          setAuthState({
            isAuthenticated: true,
            user: storedUser,
            accessToken: null, // Tokens are in cookies
            refreshToken: null, // Tokens are in cookies
            isLoading: false,
            error: null,
          });
        } else {
          // No stored user data, user is not authenticated
          setAuthState({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.log('Auth initialization error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
        });
      }
    };

    // Listen for session expiry events from HTTP client
    const handleSessionExpired = () => {
      console.log('🔄 Session expired event received, logging out user');
      // Call logout directly to avoid dependency issues
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    };

    // Set up event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session-expired', handleSessionExpired);
    }

    initializeAuth();

    // Cleanup event listener
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'auth:session-expired',
          handleSessionExpired,
        );
      }
    };
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

  // Verify session function - call this when you need to check if session is still valid
  const verifySession = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      const userData = response.data;

      // Transform MeResponse to AuthUser
      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive,
        full_name: userData.full_name,
        phone: userData.phone,
        permissions: userData.permissions,
      };

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
      }));

      setStoredUser(user);
      return user;
    } catch (error) {
      // Session expired or invalid, logout user
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
      throw error;
    }
  }, [clearStoredAuth]);

  // Change password
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      await authService.changePassword(data);
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  }, []);

  return {
    // State
    ...authState,

    // Actions
    login,
    logout,
    forceChangePassword,
    refreshAccessToken,
    getCurrentUser,
    verifySession,
    clearError,
    changePassword,
  };
}
