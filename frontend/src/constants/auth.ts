/**
 * =============================================================================
 * Authentication Constants
 * =============================================================================
 * Constants for JWT token management and authentication flow
 * =============================================================================
 */

export const AUTH_CONFIG = {
  // Token storage keys
  ACCESS_TOKEN_KEY: 'sms_access_token',
  REFRESH_TOKEN_KEY: 'sms_refresh_token',
  USER_KEY: 'sms_user',

  // Token expiration times (in milliseconds)
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Session management
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  TOKEN_REFRESH_THRESHOLD: 2 * 60 * 1000, // 2 minutes before expiry

  // Security settings
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  LOGOUT: '/logout',
  DASHBOARD: '/dashboard',
  UNAUTHORIZED: '/unauthorized',
  FORBIDDEN: '/forbidden',
} as const;

export const DASHBOARD_ROUTES = {
  SUPER_ADMIN: '/dashboard/admin',
  ADMIN: '/dashboard/admin',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
  PARENT: '/dashboard/parent',
} as const;

export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/forgotpassword',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/setpassword',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/forbidden',
] as const;

export const ROLE_BASED_ROUTES = {
  SUPER_ADMIN: ['/admin', '/system-settings', '/user-management'],
  ADMIN: ['/admin', '/user-management', '/reports'],
  TEACHER: ['/teacher', '/assignments', '/grades'],
  STUDENT: ['/student', '/assignments', '/results'],
  PARENT: ['/parent', '/child-progress', '/communications'],
} as const;
