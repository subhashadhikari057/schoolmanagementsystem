/**
 * =============================================================================
 * Constants Export Index
 * =============================================================================
 * Centralized export for all application constants
 * =============================================================================
 */

export * from './api';
export * from './auth';

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
