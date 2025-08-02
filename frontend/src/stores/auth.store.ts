/**
 * =============================================================================
 * Authentication Store (Zustand)
 * =============================================================================
 * Global state management for authentication using Zustand
 * =============================================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole } from '@sms/shared-types';
import {
  AuthState,
  LoginCredentials,
  LoginResponse,
  User,
  AuthTokens,
} from '@/types';
import {
  storeTokens,
  storeUser,
  clearAuthData,
  getStoredUser,
  getAccessToken,
  getRefreshToken,
  hasRole,
  hasMinRole,
  hasPermission,
  isTokenExpired,
  shouldRefreshToken,
} from '@/utils';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  updateUser: (user: Partial<User>) => void;

  // Selectors
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
  isTokenValid: () => boolean;
  needsTokenRefresh: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<LoginResponse>(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials,
          );

          const { user, tokens, permissions } = response.data;

          // Store tokens and user data
          storeTokens(tokens);
          storeUser(user);

          set({
            user,
            tokens,
            permissions,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          // Call logout endpoint to invalidate session
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        } finally {
          // Clear all auth data
          clearAuthData();

          set({
            user: null,
            tokens: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await apiClient.post<{ tokens: AuthTokens }>(
            API_ENDPOINTS.AUTH.REFRESH_TOKEN,
            { refreshToken },
          );

          const { tokens } = response.data;

          // Store new tokens
          storeTokens(tokens);

          set({ tokens });
        } catch (error: unknown) {
          // Refresh failed, clear auth data
          get().logout();
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: () => {
        const user = getStoredUser();
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (user && accessToken && refreshToken) {
          const tokens: AuthTokens = {
            accessToken,
            refreshToken,
            expiresAt: 0, // Will be set by token decode
            tokenType: 'Bearer',
          };

          // Check if token is still valid
          if (!isTokenExpired(accessToken)) {
            set({
              user,
              tokens,
              permissions: [], // Will be loaded from user profile
              isAuthenticated: true,
            });

            // Load fresh user data and permissions
            get().loadUserProfile();
          } else if (refreshToken) {
            // Try to refresh token
            get()
              .refreshToken()
              .catch(() => {
                // Refresh failed, clear auth
                get().logout();
              });
          } else {
            // No valid tokens, clear auth
            get().logout();
          }
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          storeUser(updatedUser);
          set({ user: updatedUser });
        }
      },

      loadUserProfile: async () => {
        try {
          const response = await apiClient.get<{
            user: User;
            permissions: string[];
          }>(API_ENDPOINTS.AUTH.ME);

          const { user, permissions } = response.data;

          set({
            user,
            permissions,
          });

          storeUser(user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      },

      // Selectors
      hasPermission: (permission: string) => {
        const { permissions } = get();
        return hasPermission(permissions, permission);
      },

      hasRole: (role: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return hasRole(user.role, role);
      },

      hasMinRole: (minRole: UserRole) => {
        const { user } = get();
        if (!user) return false;
        return hasMinRole(user.role, minRole);
      },

      isTokenValid: () => {
        const accessToken = getAccessToken();
        return accessToken ? !isTokenExpired(accessToken) : false;
      },

      needsTokenRefresh: () => {
        const accessToken = getAccessToken();
        return accessToken ? shouldRefreshToken(accessToken) : false;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Only persist essential data
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        // Initialize auth after rehydration
        if (state) {
          state.initializeAuth();
        }
      },
    },
  ),
);
