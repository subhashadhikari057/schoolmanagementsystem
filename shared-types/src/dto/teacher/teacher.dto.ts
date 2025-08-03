/**
 * =============================================================================
 * Teacher DTOs
 * =============================================================================
 * Data Transfer Objects for teacher management.
 * Based on API Contract: /api/v1/teachers
 * =============================================================================
 */

import { z } from 'zod';
import { BaseEntity, CommonValidation, UuidSchema } from '../common/base.dto';

/**
 * Teacher profile information
 */
export interface TeacherProfileDto {
  /** Qualification (e.g., M.Ed, B.Ed) */
  qualification: string;
  /** Designation (optional) */
  designation?: string;
  /** Years of experience */
  experience_years?: number;
  /** Date of joining (ISO date) */
  date_of_joining: string;
  /** Biography or description */
  bio?: string;
}

/**
 * Subject summary for teacher assignments
 */
export interface SubjectSummaryDto {
  /** Subject ID */
  id: string;
  /** Subject name */
  name: string;
  /** Subject code */
  code: string;
  /** Associated class IDs */
  class_ids?: string[];
}

/**
 * Create teacher request DTO
 */
export interface CreateTeacherRequestDto {
  /** User information */
  user: {
    /** Full name */
    full_name: string;
    /** Email address */
    email: string;
    /** Phone number (optional) */
    phone?: string;
    /** Password */
    password: string;
  };
  /** Teacher profile information */
  profile: TeacherProfileDto;
}

/**
 * Teacher response DTO
 */
export interface TeacherResponseDto extends BaseEntity {
  /** User ID */
  user_id: string;
  /** Full name */
  full_name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
  /** Teacher profile */
  profile: TeacherProfileDto;
  /** Assigned subjects */
  subjects: SubjectSummaryDto[];
}

/**
 * Update teacher request DTO
 */
export interface UpdateTeacherRequestDto {
  /** Full name */
  full_name?: string;
  /** Phone number */
  phone?: string;
  /** Profile updates */
  profile?: Partial<TeacherProfileDto>;
}

/**
 * Assign subjects request DTO
 */
export interface AssignSubjectsRequestDto {
  /** Array of subject UUIDs */
  subject_ids: string[];
}

/**
 * Zod schemas for validation
 */
export const TeacherProfileSchema = z.object({
  qualification: z.string().min(1, 'Qualification is required'),
  designation: z.string().optional(),
  experience_years: z.number().int().min(0).max(50).optional(),
  date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  bio: z.string().max(1000).optional(),
});

export const CreateTeacherUserSchema = z.object({
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  password: CommonValidation.password,
});

export const CreateTeacherRequestSchema = z.object({
  user: CreateTeacherUserSchema,
  profile: TeacherProfileSchema,
});

export const UpdateTeacherRequestSchema = z.object({
  full_name: CommonValidation.name.optional(),
  phone: CommonValidation.phone.optional(),
  profile: TeacherProfileSchema.partial().optional(),
});

export const AssignSubjectsRequestSchema = z.object({
  subject_ids: z.array(UuidSchema).min(1, 'At least one subject ID is required'),
});

export const SubjectSummarySchema = z.object({
  id: UuidSchema,
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  class_ids: z.array(UuidSchema).optional(),
});

/**
 * Type inference from Zod schemas
 */
export type CreateTeacherRequestType = z.infer<typeof CreateTeacherRequestSchema>;
export type UpdateTeacherRequestType = z.infer<typeof UpdateTeacherRequestSchema>;
export type AssignSubjectsRequestType = z.infer<typeof AssignSubjectsRequestSchema>;
export type SubjectSummaryType = z.infer<typeof SubjectSummarySchema>;