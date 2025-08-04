/**
 * =============================================================================
 * Constants Export Index
 * =============================================================================
 * Centralized export for all application constants
 * =============================================================================
 */

export * from './api';

// Auth configuration
export const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: 'sms_access_token',
  REFRESH_TOKEN_KEY: 'sms_refresh_token',
  USER_KEY: 'sms_user',
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  TOKEN_REFRESH_THRESHOLD: 2 * 60 * 1000, // 2 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

// Auth routes
export const AUTH_ROUTES = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  DASHBOARD: '/dashboard',
  FORBIDDEN: '/forbidden',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
] as const;

// Role based routes
export const ROLE_BASED_ROUTES = {
  Superadmin: ['/dashboard', '/admin', '/settings'],
  Admin: ['/dashboard', '/admin'],
  teacher: ['/dashboard', '/classes'],
  student: ['/dashboard', '/grades'],
  parent: ['/dashboard', '/children'],
  Accountant: ['/dashboard', '/finance'],
} as const;

// Application-wide constants
export const APP_CONFIG = {
  NAME: 'School Management System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Comprehensive school management solution',
  AUTHOR: 'SMS Development Team',
} as const;

export const UI_CONFIG = {
  // Animation durations (in milliseconds)
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Breakpoints (matching Tailwind CSS)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },

  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },
} as const;

export const STORAGE_KEYS = {
  THEME: 'sms_theme',
  LANGUAGE: 'sms_language',
  SIDEBAR_COLLAPSED: 'sms_sidebar_collapsed',
  USER_PREFERENCES: 'sms_user_preferences',
} as const;
