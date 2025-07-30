/**
 * =============================================================================
 * Base Validation Schemas
 * =============================================================================
 * Centralized Zod schemas for common validation patterns used across all modules.
 * This file provides the foundation for consistent DTO generation and validation.
 * =============================================================================
 */

import { z } from 'zod';

/**
 * =============================================================================
 * PRIMITIVE VALIDATION SCHEMAS
 * =============================================================================
 */

/**
 * UUID validation schema
 */
export const UuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation schema
 */
export const EmailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters');

/**
 * Phone number validation schema (international format)
 */
export const PhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be less than 15 digits');

/**
 * Password validation schema
 */
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

/**
 * Name validation schema
 */
export const NameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods');

/**
 * Text content validation schema
 */
export const TextContentSchema = z.string()
  .min(1, 'Content is required')
  .max(5000, 'Content must be less than 5000 characters');

/**
 * Short text validation schema
 */
export const ShortTextSchema = z.string()
  .min(1, 'Text is required')
  .max(255, 'Text must be less than 255 characters');

/**
 * URL validation schema
 */
export const UrlSchema = z.string().url('Invalid URL format');

/**
 * Date string validation schema (ISO format)
 */
export const DateStringSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * DateTime string validation schema (ISO format)
 */
export const DateTimeStringSchema = z.string()
  .datetime('Invalid datetime format');

/**
 * Slug validation schema (URL-friendly strings)
 */
export const SlugSchema = z.string()
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters');

/**
 * =============================================================================
 * ENTITY VALIDATION SCHEMAS
 * =============================================================================
 */

/**
 * Base entity schema with common fields
 */
export const BaseEntitySchema = z.object({
  id: UuidSchema,
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable().optional(),
});

/**
 * Audit fields schema for entities that need audit tracking
 */
export const AuditFieldsSchema = z.object({
  created_by: UuidSchema.optional(),
  updated_by: UuidSchema.optional(),
  deleted_by: UuidSchema.optional(),
});

/**
 * Metadata schema for flexible additional data
 */
export const MetadataSchema = z.record(z.any()).optional();

/**
 * =============================================================================
 * PAGINATION VALIDATION SCHEMAS
 * =============================================================================
 */

/**
 * Pagination request schema
 */
export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(200, 'Limit cannot exceed 200').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

/**
 * =============================================================================
 * RESPONSE VALIDATION SCHEMAS
 * =============================================================================
 */

/**
 * Success response schema factory
 */
export const createSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    statusCode: z.number().int().min(200).max(299),
    traceId: z.string().optional(),
  });

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  statusCode: z.number().int().min(400).max(599),
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  traceId: z.string().optional(),
  errors: z.record(z.array(z.string())).optional(),
});

/**
 * Paginated response schema factory
 */
export const createPaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

/**
 * =============================================================================
 * VALIDATION UTILITIES
 * =============================================================================
 */

/**
 * Schema composition utilities
 */
export const SchemaUtils = {
  /**
   * Create a partial schema (all fields optional)
   */
  partial: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.partial(),

  /**
   * Create a pick schema (select specific fields)
   */
  pick: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    keys: (keyof T)[]
  ) => {
    const pickObj: Record<string, true> = {};
    keys.forEach(key => {
      pickObj[key as string] = true;
    });
    return schema.pick(pickObj as any);
  },

  /**
   * Create an omit schema (exclude specific fields)
   */
  omit: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    keys: (keyof T)[]
  ) => {
    const omitObj: Record<string, true> = {};
    keys.forEach(key => {
      omitObj[key as string] = true;
    });
    return schema.omit(omitObj as any);
  },

  /**
   * Merge multiple schemas
   */
  merge: <T extends z.ZodRawShape, U extends z.ZodRawShape>(
    schema1: z.ZodObject<T>,
    schema2: z.ZodObject<U>
  ) => schema1.merge(schema2),

  /**
   * Extend a schema with additional fields
   */
  extend: <T extends z.ZodRawShape, U extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    extension: U
  ) => schema.extend(extension),
};

/**
 * =============================================================================
 * VALIDATION ERROR HANDLING
 * =============================================================================
 */

/**
 * Format Zod validation errors for API responses
 */
export const formatValidationErrors = (error: z.ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const message = issue.message;
    
    if (!errors[path]) {
      errors[path] = [];
    }
    
    errors[path].push(message);
  }
  
  return errors;
};

/**
 * Validate data against schema and return formatted errors
 */
export const validateWithFormattedErrors = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: formatValidationErrors(result.error) };
};

/**
 * =============================================================================
 * COMMON VALIDATION PATTERNS
 * =============================================================================
 */

/**
 * Common validation patterns used across the application
 */
export const CommonValidation = {
  uuid: UuidSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  password: PasswordSchema,
  name: NameSchema,
  text: TextContentSchema,
  shortText: ShortTextSchema,
  url: UrlSchema,
  dateString: DateStringSchema,
  dateTimeString: DateTimeStringSchema,
  slug: SlugSchema,
  metadata: MetadataSchema,
  pagination: PaginationRequestSchema,
} as const;

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

// Export inferred types for use in DTOs
export type BaseEntity = z.infer<typeof BaseEntitySchema>;
export type AuditFields = z.infer<typeof AuditFieldsSchema>;
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Export generic types
export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  statusCode: number;
  traceId?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;