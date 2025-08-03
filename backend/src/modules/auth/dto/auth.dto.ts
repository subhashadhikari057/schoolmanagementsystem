/**
 * =============================================================================
 * Auth DTOs - Using Centralized Schemas
 * =============================================================================
 * This file exports DTOs and types from the centralized shared-types package.
 * All validation logic is now centralized and consistent across the application.
 * =============================================================================
 */

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
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
} from '@sms/shared-types';

/**
 * =============================================================================
 * LOGIN DTOs
 * =============================================================================
 */

export class LoginDto extends createZodDto(LoginRequestSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

/**
 * =============================================================================
 * REGISTRATION DTOs
 * =============================================================================
 */

export class RegisterDto extends createZodDto(RegisterRequestSchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}

/**
 * =============================================================================
 * TOKEN DTOs
 * =============================================================================
 */

export class RefreshTokenDto extends createZodDto(RefreshTokenRequestSchema) {}
export class RefreshTokenResponseDto extends createZodDto(
  RefreshTokenResponseSchema,
) {}

/**
 * =============================================================================
 * USER PROFILE DTOs
 * =============================================================================
 */

export class MeResponseDto extends createZodDto(MeResponseSchema) {}

/**
 * =============================================================================
 * PASSWORD DTOs
 * =============================================================================
 */

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
export class RequestPasswordResetDto extends createZodDto(
  RequestPasswordResetSchema,
) {}
export class PasswordResetDto extends createZodDto(PasswordResetSchema) {}

/**
 * =============================================================================
 * TYPE EXPORTS
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

/**
 * 📥 Schema for force password change
 */
export const ForceChangePasswordSchema = z.object({
  tempToken: z.string({
    required_error: 'Temp token is required',
    invalid_type_error: 'Temp token must be a string',
  }).min(1, 'Temp token cannot be empty'),

  newPassword: z.string({
    required_error: 'New password is required',
    invalid_type_error: 'New password must be a string',
  })
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),

  confirmPassword: z.string({
    required_error: 'Confirm password is required',
    invalid_type_error: 'Confirm password must be a string',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export class ForceChangePasswordDto extends createZodDto(ForceChangePasswordSchema) {}

// Types for service use
export type ForceChangePasswordDtoType = z.infer<typeof ForceChangePasswordSchema>;
