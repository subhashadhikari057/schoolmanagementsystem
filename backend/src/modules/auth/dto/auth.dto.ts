/**
 * =============================================================================
 * Auth DTOs - Using Centralized Schemas
 * =============================================================================
 * This file exports DTOs and types from the centralized shared-types package.
 * All validation logic is now centralized and consistent across the application.
 * =============================================================================
 */

import { z } from 'zod';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  MeResponseSchema,
  ChangePasswordSchema,
  RequestPasswordResetSchema,
  PasswordResetSchema,
  ForceChangePasswordSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
  ResetPasswordWithOtpSchema,
} from '@sms/shared-types';

/**
 * =============================================================================
 * LOGIN DTOs
 * =============================================================================
 */

export type LoginDto = z.infer<typeof LoginRequestSchema>;
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;

/**
 * =============================================================================
 * REGISTRATION DTOs
 * =============================================================================
 */

export type RegisterDto = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponseDto = z.infer<typeof RegisterResponseSchema>;

/**
 * =============================================================================
 * TOKEN DTOs
 * =============================================================================
 */

export type RefreshTokenDto = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponseDto = z.infer<
  typeof RefreshTokenResponseSchema
>;

/**
 * =============================================================================
 * USER PROFILE DTOs
 * =============================================================================
 */

export type MeResponseDto = z.infer<typeof MeResponseSchema>;

/**
 * =============================================================================
 * PASSWORD DTOs
 * =============================================================================
 */

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type RequestPasswordResetDto = z.infer<
  typeof RequestPasswordResetSchema
>;
export type PasswordResetDto = z.infer<typeof PasswordResetSchema>;
export type ForceChangePasswordDto = z.infer<typeof ForceChangePasswordSchema>;

/**
 * =============================================================================
 * OTP DTOs
 * =============================================================================
 */

export type RequestOtpDto = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type ResetPasswordWithOtpDto = z.infer<
  typeof ResetPasswordWithOtpSchema
>;

/**
 * =============================================================================
 * TYPE EXPORTS FOR INTERNAL USE
 * =============================================================================
 */

export type LoginDtoType = z.infer<typeof LoginRequestSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
export type RegisterDtoType = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponseType = z.infer<typeof RegisterResponseSchema>;
export type RefreshTokenDtoType = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponseType = z.infer<
  typeof RefreshTokenResponseSchema
>;
export type MeResponseType = z.infer<typeof MeResponseSchema>;
export type ChangePasswordDtoType = z.infer<typeof ChangePasswordSchema>;
export type RequestPasswordResetDtoType = z.infer<
  typeof RequestPasswordResetSchema
>;
export type PasswordResetDtoType = z.infer<typeof PasswordResetSchema>;
export type ForceChangePasswordDtoType = z.infer<
  typeof ForceChangePasswordSchema
>;
export type RequestOtpDtoType = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpDtoType = z.infer<typeof VerifyOtpSchema>;
export type ResetPasswordWithOtpDtoType = z.infer<
  typeof ResetPasswordWithOtpSchema
>;
