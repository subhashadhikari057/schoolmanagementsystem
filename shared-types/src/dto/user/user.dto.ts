/**
 * =============================================================================
 * User DTOs
 * =============================================================================
 * Data Transfer Objects for user management.
 * =============================================================================
 */

import { z } from 'zod';
import { BaseEntity, CommonValidation } from '../common/base.dto';
import { UserRole } from '../../enums/core/user-roles.enum';
import { UserStatus } from '../../enums/core/user-status.enum';

/**
 * User entity DTO
 */
export interface UserDto extends BaseEntity {
  /** Full name */
  full_name: string;
  
  /** Email address */
  email: string;
  
  /** Phone number */
  phone?: string;
  
  /** User role */
  role: UserRole;
  
  /** User status */
  status: UserStatus;
  
  /** Profile metadata */
  metadata?: Record<string, any>;
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
  /** Full name */
  full_name: string;
  
  /** Email address */
  email: string;
  
  /** Phone number */
  phone?: string;
  
  /** Password */
  password: string;
  
  /** User role */
  role: UserRole;
  
  /** Profile metadata */
  metadata?: Record<string, any>;
}

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  /** Full name */
  full_name?: string;
  
  /** Email address */
  email?: string;
  
  /** Phone number */
  phone?: string;
  
  /** User status */
  status?: UserStatus;
  
  /** Profile metadata */
  metadata?: Record<string, any>;
}

/**
 * Zod schemas
 */
export const CreateUserSchema = z.object({
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  password: CommonValidation.password,
  role: z.nativeEnum(UserRole),
  metadata: z.record(z.any()).optional(),
});

export const UpdateUserSchema = z.object({
  full_name: CommonValidation.name.optional(),
  email: CommonValidation.email.optional(),
  phone: CommonValidation.phone.optional(),
  status: z.nativeEnum(UserStatus).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Type inference
 */
export type CreateUserType = z.infer<typeof CreateUserSchema>;
export type UpdateUserType = z.infer<typeof UpdateUserSchema>;