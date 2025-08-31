/**
 * =============================================================================
 * Authentication API Types
 * =============================================================================
 * TypeScript interfaces for authentication API requests and responses
 * Based on backend API contract
 * =============================================================================
 */

// ============================================================================
// Login Types
// ============================================================================

export interface LoginRequest {
  identifier: string; // email or phone
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  user: {
    id: string;
    full_name: string;
    role:
      | 'ADMIN'
      | 'STUDENT'
      | 'TEACHER'
      | 'PARENT'
      | 'SUPER_ADMIN'
      | 'ACCOUNTANT'
      | 'STAFF';
  };
}

// ============================================================================
// Token Refresh Types
// ============================================================================

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

// ============================================================================
// User Info Types
// ============================================================================

export interface MeResponse {
  id: string;
  email: string;
  role:
    | 'ADMIN'
    | 'STUDENT'
    | 'TEACHER'
    | 'PARENT'
    | 'SUPER_ADMIN'
    | 'ACCOUNTANT'
    | 'STAFF';
  isActive: boolean;
  full_name?: string; // Not in backend response, will need to get from other source
  phone?: string;
  permissions?: string[]; // optional future use
}

// ============================================================================
// Password Reset Types
// ============================================================================

export interface RequestPasswordResetRequest {
  identifier: string; // email or phone
}

export interface PasswordResetRequest {
  token: string; // code sent to user
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ============================================================================
// Registration Types (if self-registration is allowed)
// ============================================================================

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'student' | 'parent';
  metadata?: Record<string, any>; // optional JSONB metadata
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface AuthErrorResponse {
  statusCode: number;
  error: string; // e.g., "Unauthorized"
  message: string; // e.g., "Invalid credentials"
  code?: string; // e.g., INVALID_PASSWORD, USER_NOT_FOUND, DUPLICATE_EMAIL
}

// ============================================================================
// Authentication State Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  role:
    | 'ADMIN'
    | 'STUDENT'
    | 'TEACHER'
    | 'PARENT'
    | 'SUPER_ADMIN'
    | 'ACCOUNTANT'
    | 'STAFF';
  isActive: boolean;
  full_name?: string; // Optional - not in backend response
  phone?: string;
  permissions?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}
