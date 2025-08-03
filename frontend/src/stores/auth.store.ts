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
import { AuthState, LoginCredentials, User, AuthTokens } from '@/types';
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
  redirectToRoleDashboard: (role: UserRole) => void;
  loadUserProfile: () => Promise<void>;

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
          const response = await apiClient.post<{
            access_token: string;
            refresh_token: string;
            expires_in: number;
            token_type: string;
            user: {
              id: string;
              full_name: string;
              email: string;
              role: string;
              status: string;
            };
          }>(API_ENDPOINTS.AUTH.LOGIN, {
            identifier: credentials.email, // Backend expects 'identifier' field
            password: credentials.password,
            remember_me: credentials.rememberMe || false,
          });

          const {
            access_token,
            refresh_token,
            expires_in,
            user: userData,
          } = response.data;

          // Transform response to match expected format
          const tokens: AuthTokens = {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: Date.now() + expires_in * 1000,
            tokenType: 'Bearer',
          };

          const user: User = {
            id: userData.id,
            email: userData.email,
            role: userData.role as UserRole,
            isActive: userData.status === 'ACTIVE',
            sessionId: '',
            firstName: userData.full_name?.split(' ')[0] || '',
            lastName: userData.full_name?.split(' ').slice(1).join(' ') || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Store tokens and user data
          storeTokens(tokens);
          storeUser(user);

          set({
            user,
            tokens,
            permissions: [], // Can be loaded later if needed
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Login successful - redirect will be handled by useAuthRedirect hook
          console.log('✅ Login successful - user authenticated:', user.role);
        } catch (error: unknown) {
          console.error('Auth store login error:', error);

          let errorMessage = 'Login failed';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            const apiError = error as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            if (apiError.response?.data?.message) {
              errorMessage = apiError.response.data.message;
            } else if (apiError.message) {
              errorMessage = apiError.message;
            }
          }

          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        // Immediately clear local state for instant UI feedback
        set({
          user: null,
          tokens: null,
          permissions: [],
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Clear local storage immediately
        clearAuthData();

        // Redirect immediately
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }

        // Call logout endpoint in background (non-blocking)
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          // Ignore logout API errors - user is already logged out locally
          console.warn('Background logout API call failed:', error);
        }
      },

      refreshToken: async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await apiClient.post<{
            access_token: string;
            refresh_token: string;
            expires_in: number;
          }>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refresh_token: refreshToken });

          const { access_token, refresh_token, expires_in } = response.data;

          const tokens: AuthTokens = {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: Date.now() + expires_in * 1000,
            tokenType: 'Bearer',
          };

          // Store new tokens
          storeTokens(tokens);

          set({ tokens });
        } catch (error: unknown) {
          // Refresh failed, clear auth data
          void get().logout();
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
            void get().loadUserProfile();
          } else if (refreshToken) {
            // Try to refresh token
            void get()
              .refreshToken()
              .catch(() => {
                // Refresh failed, clear auth
                void get().logout();
              });
          } else {
            // No valid tokens, clear auth
            void get().logout();
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

      redirectToRoleDashboard: (role: UserRole) => {
        // This method is kept for compatibility but redirects are now handled by useAuthRedirect hook
        const dashboardRoutes: Record<UserRole, string> = {
          [UserRole.SUPER_ADMIN]: '/dashboard/admin',
          [UserRole.ADMIN]: '/dashboard/admin',
          [UserRole.ACCOUNTANT]: '/dashboard/admin',
          [UserRole.TEACHER]: '/dashboard/teacher',
          [UserRole.STUDENT]: '/dashboard/student',
          [UserRole.PARENT]: '/dashboard/parent',
        };

        const targetRoute = dashboardRoutes[role] || '/dashboard/admin';

        if (typeof window !== 'undefined') {
          window.location.href = targetRoute;
        }
      },

      loadUserProfile: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);

          // Check if response exists
          if (!response || !response.data) {
            console.error('No user profile data received from server');
            return;
          }

          // Handle both wrapped and direct response formats
          let userData: unknown = response.data;

          // If response is wrapped in success/data structure, extract the data
          if (
            userData &&
            typeof userData === 'object' &&
            'success' in userData &&
            userData.success &&
            'data' in userData &&
            userData.data
          ) {
            userData = userData.data;
          }

          // Validate required fields
          if (
            !userData ||
            typeof userData !== 'object' ||
            !(userData as any).id ||
            !(userData as any).email ||
            !(userData as any).role
          ) {
            console.error(
              'Invalid user profile data - missing required fields:',
              userData,
            );
            return;
          }

          // Transform backend response to frontend User type
          const userDataAny = userData as any;
          const user: User = {
            id: userDataAny.id,
            email: userDataAny.email,
            role: userDataAny.role as UserRole,
            isActive: userDataAny.status === 'ACTIVE',
            sessionId: '', // Not provided by /me endpoint
            firstName: userDataAny.full_name?.split(' ')[0] || '',
            lastName:
              userDataAny.full_name?.split(' ').slice(1).join(' ') || '',
            createdAt: new Date(), // Not provided by /me endpoint
            updatedAt: new Date(), // Not provided by /me endpoint
          };

          set({
            user,
            permissions: Array.isArray(userDataAny.permissions)
              ? userDataAny.permissions
              : [],
          });

          storeUser(user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Don't clear auth state on profile load failure - user is still authenticated
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
