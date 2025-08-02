/**
 * =============================================================================
 * Auth Store Tests
 * =============================================================================
 * Comprehensive tests for Zustand authentication store
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UserRole } from '@sms/shared-types';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import * as authUtils from '@/utils/auth';

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock auth utils
vi.mock('@/utils/auth', () => ({
  storeTokens: vi.fn(),
  storeUser: vi.fn(),
  clearAuthData: vi.fn(),
  getStoredUser: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  isTokenExpired: vi.fn(),
  shouldRefreshToken: vi.fn(),
  hasRole: vi.fn(),
  hasMinRole: vi.fn(),
  hasPermission: vi.fn(),
}));

describe('Auth Store', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.TEACHER,
    isActive: true,
    sessionId: 'session-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 3600000,
    tokenType: 'Bearer' as const,
  };

  const mockLoginResponse = {
    data: {
      user: mockUser,
      tokens: mockTokens,
      permissions: ['read:students', 'write:assignments'],
      sessionId: 'session-123',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      tokens: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.permissions).toEqual([]);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('handles successful login', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.permissions).toEqual([
        'read:students',
        'write:assignments',
      ]);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      expect(authUtils.storeTokens).toHaveBeenCalledWith(mockTokens);
      expect(authUtils.storeUser).toHaveBeenCalledWith(mockUser);
    });

    it('handles login failure', async () => {
      const loginError = new Error('Invalid credentials');
      vi.mocked(apiClient.post).mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('sets loading state during login', async () => {
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      vi.mocked(apiClient.post).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!(mockLoginResponse);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout', () => {
    it('handles successful logout', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          tokens: mockTokens,
          permissions: ['read:students'],
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.permissions).toEqual([]);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();

      expect(authUtils.clearAuthData).toHaveBeenCalled();
    });

    it('clears auth data even if API call fails', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          tokens: mockTokens,
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(authUtils.clearAuthData).toHaveBeenCalled();
    });
  });

  describe('Token Refresh', () => {
    it('handles successful token refresh', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer' as const,
      };

      vi.mocked(authUtils.getRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { tokens: newTokens },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.tokens).toEqual(newTokens);
      expect(authUtils.storeTokens).toHaveBeenCalledWith(newTokens);
    });

    it('handles refresh failure', async () => {
      vi.mocked(authUtils.getRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(apiClient.post).mockRejectedValue(
        new Error('Invalid refresh token'),
      );

      const { result } = renderHook(() => useAuthStore());

      // Mock logout function
      const logoutSpy = vi.spyOn(result.current, 'logout').mockResolvedValue();

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(logoutSpy).toHaveBeenCalled();
    });

    it('throws error when no refresh token available', async () => {
      vi.mocked(authUtils.getRefreshToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(result.current.refreshToken()).rejects.toThrow(
          'No refresh token available',
        );
      });
    });
  });

  describe('Utility Methods', () => {
    it('hasPermission works correctly', () => {
      vi.mocked(authUtils.hasPermission).mockReturnValue(true);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ permissions: ['read:students'] });
      });

      const hasPermission = result.current.hasPermission('read:students');
      expect(hasPermission).toBe(true);
      expect(authUtils.hasPermission).toHaveBeenCalledWith(
        ['read:students'],
        'read:students',
      );
    });

    it('hasRole works correctly', () => {
      vi.mocked(authUtils.hasRole).mockReturnValue(true);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ user: mockUser });
      });

      const hasRole = result.current.hasRole(UserRole.TEACHER);
      expect(hasRole).toBe(true);
      expect(authUtils.hasRole).toHaveBeenCalledWith(
        UserRole.TEACHER,
        UserRole.TEACHER,
      );
    });

    it('hasMinRole works correctly', () => {
      vi.mocked(authUtils.hasMinRole).mockReturnValue(true);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ user: mockUser });
      });

      const hasMinRole = result.current.hasMinRole(UserRole.STUDENT);
      expect(hasMinRole).toBe(true);
      expect(authUtils.hasMinRole).toHaveBeenCalledWith(
        UserRole.TEACHER,
        UserRole.STUDENT,
      );
    });
  });

  describe('Error Handling', () => {
    it('clears error correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('User Updates', () => {
    it('updates user data correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ user: mockUser });
      });

      const updatedData = { firstName: 'John', lastName: 'Doe' };

      act(() => {
        result.current.updateUser(updatedData);
      });

      expect(result.current.user).toEqual({ ...mockUser, ...updatedData });
      expect(authUtils.storeUser).toHaveBeenCalledWith({
        ...mockUser,
        ...updatedData,
      });
    });

    it('does not update when no user is set', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ firstName: 'John' });
      });

      expect(result.current.user).toBeNull();
      expect(authUtils.storeUser).not.toHaveBeenCalled();
    });
  });
});
