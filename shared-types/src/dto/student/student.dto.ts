/**
 * =============================================================================
 * Student DTOs
 * =============================================================================
 * Data Transfer Objects for student management.
 * Based on API Contract: /api/v1/students
 * =============================================================================
 */

import { z } from "zod";
import { BaseEntity, CommonValidation, UuidSchema } from "../common/base.dto";

/**
 * Gender enum for students
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

/**
 * Create student request DTO
 */
export interface CreateStudentRequestDto {
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
  /** Class ID (UUID) */
  class_id: string;
  /** Section ID (UUID) */
  section_id: string;
  /** Roll number */
  roll_number: string;
  /** Date of birth (ISO date) */
  dob: string;
  /** Gender */
  gender: Gender;
  /** Additional metadata */
  additional_metadata?: Record<string, any>;
}

/**
 * Student response DTO
 */
export interface StudentResponseDto extends BaseEntity {
  /** User ID */
  user_id: string;
  /** Full name */
  full_name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
  /** Class ID */
  class_id: string;
  /** Section ID */
  section_id: string;
  /** Roll number */
  roll_number: string;
  /** Date of birth */
  dob: string;
  /** Gender */
  gender: Gender;
  /** Aggregated exam marks */
  marks_obtained?: number;
  /** Additional metadata */
  additional_metadata?: Record<string, any>;
}

/**
 * Update student request DTO
 */
export interface UpdateStudentRequestDto {
  /** Full name */
  full_name?: string;
  /** Phone number */
  phone?: string;
  /** Class ID */
  class_id?: string;
  /** Section ID */
  section_id?: string;
  /** Roll number */
  roll_number?: string;
  /** Date of birth */
  dob?: string;
  /** Gender */
  gender?: Gender;
  /** Additional metadata */
  additional_metadata?: Record<string, any>;
}

/**
 * Search students request DTO
 */
export interface SearchStudentsRequestDto {
  /** Full name search */
  full_name?: string;
  /** Class ID filter */
  class_id?: string;
  /** Section ID filter */
  section_id?: string;
  /** Roll number search */
  roll_number?: string;
  /** Gender filter */
  gender?: Gender;
  /** Date of birth from */
  dob_from?: string;
  /** Date of birth to */
  dob_to?: string;
  /** Page number */
  page?: number;
  /** Items per page (max 200) */
  limit?: number;
}

/**
 * Paginated students response DTO
 */
export interface PaginatedStudentsResponseDto {
  /** Student data */
  data: StudentResponseDto[];
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total items */
  total: number;
}

/**
 * Zod schemas for validation
 */
export const GenderSchema = z.nativeEnum(Gender);

export const CreateStudentUserSchema = z.object({
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  password: CommonValidation.password,
});

export const CreateStudentRequestSchema = z.object({
  user: CreateStudentUserSchema,
  class_id: UuidSchema.describe("Class ID"),
  section_id: UuidSchema.describe("Section ID"),
  roll_number: z.string().min(1, "Roll number is required"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  gender: GenderSchema,
  additional_metadata: z.record(z.any()).optional(),
});

export const UpdateStudentRequestSchema = z.object({
  full_name: CommonValidation.name.optional(),
  phone: CommonValidation.phone.optional(),
  class_id: UuidSchema.optional(),
  section_id: UuidSchema.optional(),
  roll_number: z.string().min(1).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  gender: GenderSchema.optional(),
  additional_metadata: z.record(z.any()).optional(),
});

export const SearchStudentsRequestSchema = z.object({
  full_name: z.string().optional(),
  class_id: UuidSchema.optional(),
  section_id: UuidSchema.optional(),
  roll_number: z.string().optional(),
  gender: GenderSchema.optional(),
  dob_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dob_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
});

/**
 * Type inference from Zod schemas
 */
export type CreateStudentRequestType = z.infer<
  typeof CreateStudentRequestSchema
>;
export type UpdateStudentRequestType = z.infer<
  typeof UpdateStudentRequestSchema
>;
export type SearchStudentsRequestType = z.infer<
  typeof SearchStudentsRequestSchema
>;
