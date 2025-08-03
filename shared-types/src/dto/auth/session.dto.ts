/**
 * =============================================================================
 * Auth Session DTOs
 * =============================================================================
 * Data Transfer Objects for session management.
 * =============================================================================
 */

import { z } from 'zod';
import { UserRole } from '../../enums/core/user-roles.enum';
import { SessionStatus } from '../../enums/auth/session-status.enum';

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequestDto {
  /** Refresh token */
  refresh_token: string;
}

/**
 * Refresh token response payload
 */
export interface RefreshTokenResponseDto {
  /** New access token */
  access_token: string;
  
  /** Token expiration time in seconds */
  expires_in: number;
}

/**
 * Current user information (/me endpoint)
 */
export interface MeResponseDto {
  /** User ID */
  id: string;
  
  /** Full name */
  full_name: string;
  
  /** Email address */
  email: string;
  
  /** Phone number */
  phone?: string;
  
  /** User role */
  role: UserRole;
  
  /** User permissions */
  permissions?: string[];
}

/**
 * Session information
 */
export interface SessionDto {
  /** Session ID */
  id: string;
  
  /** User ID */
  user_id: string;
  
  /** Session status */
  status: SessionStatus;
  
  /** IP address */
  ip_address: string;
  
  /** User agent */
  user_agent: string;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last activity timestamp */
  last_activity: Date;
  
  /** Expiration timestamp */
  expires_at: Date;
}

/**
 * Zod schemas
 */
export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  expires_in: z.number().positive('Expires in must be positive'),
});

export const MeResponseSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()).optional(),
});

/**
 * Type inference
 */
export type RefreshTokenRequestType = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponseType = z.infer<typeof RefreshTokenResponseSchema>;
export type MeResponseType = z.infer<typeof MeResponseSchema>;