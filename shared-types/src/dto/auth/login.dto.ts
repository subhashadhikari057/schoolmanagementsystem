/**
 * =============================================================================
 * Auth Login DTOs
 * =============================================================================
 * Data Transfer Objects for authentication login functionality.
 * Based on API Contract: /api/v1/auth/login
 * =============================================================================
 */

import { z } from "zod";
import { CommonValidation } from "../common/base.dto";
import { UserRole } from "../../enums/core/user-roles.enum";

/**
 * Login request payload
 */
export interface LoginRequestDto {
  /** Email or phone number */
  identifier: string;

  /** User password */
  password: string;
}

/**
 * User information returned in login response
 */
export interface LoginUserDto {
  /** User ID (UUID) */
  id: string;

  /** User's full name */
  full_name: string;

  /** User's role in the system */
  role: UserRole;
}

/**
 * Login response payload
 */
export interface LoginResponseDto {
  /** JWT access token */
  access_token: string;

  /** JWT refresh token */
  refresh_token: string;

  /** Token expiration time in seconds */
  expires_in: number;

  /** User information */
  user: LoginUserDto;
}

/**
 * Zod schema for login request validation
 */
export const LoginRequestSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .refine((value) => {
      // Check if it's a valid email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }, "Must be a valid email address or phone number"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

/**
 * Zod schema for login user information
 */
export const LoginUserSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
  full_name: CommonValidation.name,
  role: z.nativeEnum(UserRole).refine((val) => Object.values(UserRole).includes(val), {
    message: "Invalid user role",
  }),
});

/**
 * Zod schema for login response validation
 */
export const LoginResponseSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
  refresh_token: z.string().min(1, "Refresh token is required"),
  expires_in: z.number().positive("Expires in must be positive"),
  user: LoginUserSchema,
});

/**
 * Type inference from Zod schemas
 */
export type LoginRequestType = z.infer<typeof LoginRequestSchema>;
export type LoginUserType = z.infer<typeof LoginUserSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
