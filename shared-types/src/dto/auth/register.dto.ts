/**
 * =============================================================================
 * Auth Register DTOs
 * =============================================================================
 * Data Transfer Objects for user registration functionality.
 * Based on API Contract: /api/v1/auth/register
 * =============================================================================
 */

import { z } from 'zod';
import { CommonValidation } from '../common/base.dto';
import { UserRole } from '../../enums/core/user-roles.enum';

/**
 * User registration request payload
 */
export interface RegisterRequestDto {
  /** User's full name */
  full_name: string;
  
  /** Email address */
  email: string;
  
  /** Phone number (optional) */
  phone?: string;
  
  /** Password */
  password: string;
  
  /** User role (student or parent for self-registration) */
  role: UserRole.STUDENT | UserRole.PARENT;
  
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * User registration response payload
 */
export interface RegisterResponseDto {
  /** User ID */
  id: string;
  
  /** User's full name */
  full_name: string;
  
  /** Email address */
  email: string;
  
  /** Phone number */
  phone?: string;
  
  /** User role */
  role: UserRole;
  
  /** Success message */
  message: string;
}

/**
 * Zod schema for registration request validation
 */
export const RegisterRequestSchema = z.object({
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  password: CommonValidation.password,
  role: z.enum([UserRole.STUDENT, UserRole.PARENT], {
    errorMap: () => ({ message: 'Only student and parent roles can self-register' }),
  }),
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for registration response validation
 */
export const RegisterResponseSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  role: z.nativeEnum(UserRole),
  message: z.string(),
});

/**
 * Type inference from Zod schemas
 */
export type RegisterRequestType = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponseType = z.infer<typeof RegisterResponseSchema>;