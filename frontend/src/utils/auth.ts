/**
 * =============================================================================
 * Authentication Utilities
 * =============================================================================
 * Helper functions for authentication, token management, and role checking
 * =============================================================================
 */

import { UserRole } from '@sms/shared-types';
import { AUTH_CONFIG, ROLE_BASED_ROUTES } from '@/constants';
import { JWTPayload, User, AuthTokens } from '@/types';

// Role hierarchy for permission checking (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.ACCOUNTANT]: 3,
  [UserRole.TEACHER]: 2,
  [UserRole.STUDENT]: 1,
  [UserRole.PARENT]: 1,
};

/**
 * Decode JWT token payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Check if token needs refresh (within threshold)
 */
export function shouldRefreshToken(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - currentTime;
  const refreshThreshold = AUTH_CONFIG.TOKEN_REFRESH_THRESHOLD / 1000; // Convert to seconds

  return timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0;
}

/**
 * Store authentication tokens
 */
export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken);
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
}

/**
 * Remove all stored authentication data
 */
export function clearAuthData(): void {
  localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
}

/**
 * Store user data
 */
export function storeUser(user: User): void {
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error('Failed to parse stored user data:', error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(
  userRole: UserRole,
  requiredRoles: UserRole | UserRole[],
): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
}

/**
 * Check if user has minimum role level
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Check if user has permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Get allowed routes for user role
 */
export function getAllowedRoutes(userRole: UserRole): string[] {
  return ROLE_BASED_ROUTES[userRole] || [];
}

/**
 * Check if route is accessible for user role
 */
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const allowedRoutes = getAllowedRoutes(userRole);
  return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute));
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format role name for display
 */
export function formatRoleName(role: UserRole): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
