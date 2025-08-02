/**
 * =============================================================================
 * useAuth Hook Tests
 * =============================================================================
 * Comprehensive tests for authentication hook functionality
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@sms/shared-types';
import { useAuth, useRequireAuth, useGuestOnly } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuth Hook', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

  const mockAuthStore = {
    user: null,
    tokens: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    clearError: vi.fn(),
    updateUser: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
    hasMinRole: vi.fn(),
    isTokenValid: vi.fn(),
    needsTokenRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('returns auth state and actions', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toEqual({
      user: null,
      tokens: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: expect.any(Function),
      logout: expect.any(Function),
      refreshToken: expect.any(Function),
      clearError: expect.any(Function),
      updateUser: expect.any(Function),
      hasPermission: expect.any(Function),
      hasRole: expect.any(Function),
      hasMinRole: expect.any(Function),
      isTokenValid: expect.any(Function),
      needsTokenRefresh: expect.any(Function),
    });
  });

  it('auto-refreshes token when needed', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.needsTokenRefresh = vi.fn().mockReturnValue(true);
    mockAuthStore.refreshToken = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useAuth());

    expect(mockAuthStore.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('redirects to login on refresh failure', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.needsTokenRefresh = vi.fn().mockReturnValue(true);
    mockAuthStore.refreshToken = vi
      .fn()
      .mockRejectedValue(new Error('Refresh failed'));

    renderHook(() => useAuth());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('validates token periodically', async () => {
    vi.useFakeTimers();

    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isTokenValid = vi.fn().mockReturnValue(false);

    renderHook(() => useAuth());

    // Fast forward time to trigger interval
    act(() => {
      vi.advanceTimersByTime(60000); // 1 minute
    });

    expect(mockAuthStore.logout).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/login');

    vi.useRealTimers();
  });
});

describe('useRequireAuth Hook', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

  const mockAuthStore = {
    user: {
      id: '1',
      role: UserRole.TEACHER,
      email: 'teacher@test.com',
      name: 'Test Teacher',
    },
    tokens: null,
    permissions: [],
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    clearError: vi.fn(),
    updateUser: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
    hasMinRole: vi.fn(),
    isTokenValid: vi.fn(),
    needsTokenRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.clearAllMocks();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthStore.isAuthenticated = false;

    renderHook(() => useRequireAuth());

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('redirects to forbidden when role is required but not met', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.hasRole = vi.fn().mockReturnValue(false);

    renderHook(() => useRequireAuth(UserRole.ADMIN));

    expect(mockRouter.push).toHaveBeenCalledWith('/forbidden');
  });

  it('allows access when authenticated and has required role', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.hasRole = vi.fn().mockReturnValue(true);

    renderHook(() => useRequireAuth(UserRole.TEACHER));

    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

describe('useGuestOnly Hook', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

  const mockAuthStore = {
    user: null,
    tokens: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    clearError: vi.fn(),
    updateUser: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
    hasMinRole: vi.fn(),
    isTokenValid: vi.fn(),
    needsTokenRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.clearAllMocks();
  });

  it('allows access when not authenticated', () => {
    mockAuthStore.isAuthenticated = false;

    renderHook(() => useGuestOnly());

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('redirects to dashboard when authenticated', () => {
    mockAuthStore.isAuthenticated = true;

    renderHook(() => useGuestOnly());

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});
