/**
 * =============================================================================
 * Authentication Type Definitions
 * =============================================================================
 * TypeScript interfaces for authentication and user management
 * =============================================================================
 */

import { UserRole } from '@sms/shared-types';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  sessionId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  permissions: string[];
  sessionId: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  permissions: string[];
  sessionId: string;
  exp: number;
  iat: number;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  lastActivityAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}
