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
  ForceChangePasswordSchema,
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
export class ForceChangePasswordDto extends createZodDto(
  ForceChangePasswordSchema,
) {}

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
