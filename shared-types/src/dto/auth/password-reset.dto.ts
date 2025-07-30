/**
 * =============================================================================
 * Auth Password Reset DTOs
 * =============================================================================
 * Data Transfer Objects for password reset functionality.
 * Based on API Contract: /api/v1/auth/password/*
 * =============================================================================
 */

import { z } from 'zod';
import { CommonValidation } from '../common/base.dto';

/**
 * Password reset request payload
 */
export interface RequestPasswordResetDto {
  /** Email or phone identifier */
  identifier: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetDto {
  /** Reset token from email/SMS */
  token: string;
  
  /** New password */
  new_password: string;
}

/**
 * Change password payload (for logged-in users)
 */
export interface ChangePasswordDto {
  /** Current password */
  current_password: string;
  
  /** New password */
  new_password: string;
}

/**
 * Zod schemas
 */
export const RequestPasswordResetSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: CommonValidation.password,
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: CommonValidation.password,
});

/**
 * Type inference
 */
export type RequestPasswordResetType = z.infer<typeof RequestPasswordResetSchema>;
export type PasswordResetType = z.infer<typeof PasswordResetSchema>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;