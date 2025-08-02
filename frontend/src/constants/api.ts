/**
 * =============================================================================
 * API Constants & Configuration
 * =============================================================================
 * Centralized API configuration matching backend contract
 * =============================================================================
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  VERSION: 'v1',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh-token',
  },

  // Student endpoints
  STUDENTS: {
    LIST: '/students',
    CREATE: '/students',
    GET_BY_ID: (id: string) => `/students/${id}`,
    UPDATE: (id: string) => `/students/${id}`,
    DELETE: (id: string) => `/students/${id}`,
    PROFILE: (id: string) => `/students/${id}/profile`,
  },

  // Teacher endpoints
  TEACHERS: {
    LIST: '/teachers',
    CREATE: '/teachers',
    GET_BY_ID: (id: string) => `/teachers/${id}`,
    UPDATE: (id: string) => `/teachers/${id}`,
    SUBJECTS: (id: string) => `/teachers/${id}/subjects`,
  },

  // Assignment endpoints
  ASSIGNMENTS: {
    LIST: '/assignments',
    CREATE: '/assignments',
    GET_BY_ID: (id: string) => `/assignments/${id}`,
    SUBMISSIONS: (id: string) => `/assignments/${id}/submissions`,
    SUBMIT: (id: string) => `/assignments/${id}/submit`,
  },

  // Exam endpoints
  EXAMS: {
    LIST: '/exams',
    CREATE: '/exams',
    SESSIONS: '/exam_sessions',
    RESULTS: '/results',
    STUDENT_RESULTS: (id: string) => `/students/${id}/results`,
  },

  // Calendar endpoints
  CALENDAR: {
    EVENTS: '/calendar-events',
    CREATE_EVENT: '/calendar-events',
    PARTICIPANTS: (id: string) => `/calendar-events/${id}/participants`,
  },
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  API_VERSION: 'X-API-Version',
  TRACE_ID: 'X-Trace-ID',
} as const;

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
} as const;
