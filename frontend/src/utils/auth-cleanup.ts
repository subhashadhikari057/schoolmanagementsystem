/**
 * Authentication Cleanup Utilities
 * Professional utilities for clearing auth state and preventing issues
 */

/**
 * Clear all authentication-related data from browser storage
 * Call this when experiencing auth issues or redirect loops
 */
export function clearAllAuthData(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear localStorage auth data
    const authKeys = [
      'sms_access_token',
      'sms_refresh_token',
      'sms_user',
      'auth-storage', // Zustand persist key
    ];

    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });

    console.log('🧹 All authentication data cleared');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}

/**
 * Reset authentication state and redirect to login
 * Use this for complete auth reset
 */
export function resetAuthAndRedirect(): void {
  clearAllAuthData();

  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

/**
 * Check if user is in a redirect loop and fix it
 */
export function detectAndFixRedirectLoop(): boolean {
  if (typeof window === 'undefined') return false;

  const currentPath = window.location.pathname;
  const isInLoop =
    currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');

  if (isInLoop) {
    console.warn('🔄 Potential redirect loop detected, clearing auth data');
    resetAuthAndRedirect();
    return true;
  }

  return false;
}
