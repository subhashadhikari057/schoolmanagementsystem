/**
 * =============================================================================
 * School Information DTOs
 * =============================================================================
 * DTOs for managing school information settings.
 * Only SUPER_ADMIN can create/update school information.
 * =============================================================================
 */

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * =============================================================================
 * VALIDATION SCHEMAS
 * =============================================================================
 */

export const CreateSchoolInformationSchema = z.object({
  schoolName: z
    .string()
    .min(1, 'School name is required')
    .max(255, 'School name is too long'),
  schoolCode: z
    .string()
    .min(1, 'School code is required')
    .max(50, 'School code is too long'),
  establishedYear: z
    .number()
    .int()
    .min(1800, 'Invalid establishment year')
    .max(
      new Date().getFullYear(),
      'Establishment year cannot be in the future',
    ),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(1000, 'Address is too long'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  emails: z
    .array(z.string().email('Invalid email format'))
    .optional()
    .default([]),
  contactNumbers: z
    .array(z.string().min(1, 'Contact number cannot be empty'))
    .optional()
    .default([]),
  logo: z.string().optional(),
});

export const UpdateSchoolInformationSchema = z.object({
  schoolName: z
    .string()
    .min(1, 'School name is required')
    .max(255, 'School name is too long')
    .optional(),
  schoolCode: z
    .string()
    .min(1, 'School code is required')
    .max(50, 'School code is too long')
    .optional(),
  establishedYear: z
    .number()
    .int()
    .min(1800, 'Invalid establishment year')
    .max(new Date().getFullYear(), 'Establishment year cannot be in the future')
    .optional(),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(1000, 'Address is too long')
    .optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  emails: z.array(z.string().email('Invalid email format')).optional(),
  contactNumbers: z
    .array(z.string().min(1, 'Contact number cannot be empty'))
    .optional(),
  logo: z.string().optional(),
});

export const SchoolInformationResponseSchema = z.object({
  id: z.string(),
  schoolName: z.string(),
  schoolCode: z.string(),
  establishedYear: z.number(),
  address: z.string(),
  website: z.string().nullable(),
  emails: z.array(z.string()),
  contactNumbers: z.array(z.string()),
  logo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
});

/**
 * =============================================================================
 * DTO CLASSES
 * =============================================================================
 */

export class CreateSchoolInformationDto extends createZodDto(
  CreateSchoolInformationSchema,
) {}
export class UpdateSchoolInformationDto extends createZodDto(
  UpdateSchoolInformationSchema,
) {}
export class SchoolInformationResponseDto extends createZodDto(
  SchoolInformationResponseSchema,
) {}

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

export type CreateSchoolInformationDtoType = z.infer<
  typeof CreateSchoolInformationSchema
>;
export type UpdateSchoolInformationDtoType = z.infer<
  typeof UpdateSchoolInformationSchema
>;
export type SchoolInformationResponseDtoType = z.infer<
  typeof SchoolInformationResponseSchema
>;
