/**
 * =============================================================================
 * Centralized Schema Index
 * =============================================================================
 * This file exports all validation schemas from the centralized schema system.
 * It provides a single point of access for all Zod schemas used across the application.
 * =============================================================================
 */

// =============================================================================
// COMMON SCHEMAS
// =============================================================================
export * from './common/base.schemas';
export * from './common/error.schemas';

// =============================================================================
// MODULE SCHEMAS
// =============================================================================
export * from './auth/auth.schemas';
export * from './student/student.schemas';

// =============================================================================
// SCHEMA UTILITIES
// =============================================================================

import { z } from 'zod';
import { 
  formatValidationErrors, 
  validateWithFormattedErrors,
  SchemaUtils,
  CommonValidation,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
  ErrorResponseSchema
} from './common/base.schemas';

/**
 * =============================================================================
 * DTO GENERATION UTILITIES
 * =============================================================================
 */

/**
 * Generate consistent DTO interfaces from Zod schemas
 */
export class DTOGenerator {
  /**
   * Create a CRUD set of schemas for a given entity
   */
  static createCRUDSchemas<T extends z.ZodRawShape>(
    entityName: string,
    baseSchema: z.ZodObject<T>
  ) {
    return {
      // Create schema (omit id, timestamps)
      create: SchemaUtils.omit(baseSchema, ['id', 'created_at', 'updated_at', 'deleted_at']),
      
      // Update schema (all fields optional, omit id, timestamps)
      update: SchemaUtils.omit(baseSchema, ['id', 'created_at', 'updated_at', 'deleted_at']).partial(),
      
      // Response schema (full entity)
      response: baseSchema,
      
      // List response schema (paginated)
      list: createPaginatedResponseSchema(baseSchema),
      
      // Search/filter schema
      search: z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(200).default(10),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        // Add common search fields
        search: z.string().optional(),
        status: z.string().optional(),
        created_from: z.date().optional(),
        created_to: z.date().optional(),
      }),
    };
  }

  /**
   * Create API response schemas for an entity
   */
  static createAPIResponseSchemas<T extends z.ZodType>(dataSchema: T) {
    return {
      success: createSuccessResponseSchema(dataSchema),
      error: ErrorResponseSchema,
      paginated: createSuccessResponseSchema(createPaginatedResponseSchema(dataSchema)),
    };
  }

  /**
   * Create validation middleware schema
   */
  static createValidationMiddleware<T extends z.ZodType>(schema: T) {
    return {
      validate: (data: unknown) => validateWithFormattedErrors(schema, data),
      schema,
      safeParse: (data: unknown) => schema.safeParse(data),
      parse: (data: unknown) => schema.parse(data),
    };
  }
}

/**
 * =============================================================================
 * SCHEMA COMPOSITION UTILITIES
 * =============================================================================
 */

/**
 * Common schema patterns for reuse
 */
export const SchemaPatterns = {
  /**
   * Audit trail schema
   */
  auditTrail: z.object({
    created_by: CommonValidation.uuid.optional(),
    updated_by: CommonValidation.uuid.optional(),
    deleted_by: CommonValidation.uuid.optional(),
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable().optional(),
  }),

  /**
   * Soft delete schema
   */
  softDelete: z.object({
    deleted_at: z.date().nullable().optional(),
    deleted_by: CommonValidation.uuid.optional(),
    deletion_reason: z.string().max(500).optional(),
  }),

  /**
   * Approval workflow schema
   */
  approvalWorkflow: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
    approved_by: CommonValidation.uuid.optional(),
    approved_at: z.date().optional(),
    rejection_reason: z.string().max(500).optional(),
    approval_notes: z.string().max(1000).optional(),
  }),

  /**
   * File attachment schema
   */
  fileAttachment: z.object({
    id: CommonValidation.uuid,
    filename: z.string(),
    file_size: z.number().int().min(0),
    mime_type: z.string(),
    file_path: z.string(),
    uploaded_by: CommonValidation.uuid,
    uploaded_at: z.date(),
  }),

  /**
   * Address schema
   */
  address: z.object({
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),

  /**
   * Contact information schema
   */
  contactInfo: z.object({
    email: CommonValidation.email.optional(),
    phone: CommonValidation.phone.optional(),
    alternate_phone: CommonValidation.phone.optional(),
    emergency_contact: z.object({
      name: CommonValidation.name,
      phone: CommonValidation.phone,
      relationship: z.string().max(50),
    }).optional(),
  }),

  /**
   * Social media links schema
   */
  socialMediaLinks: z.object({
    facebook: CommonValidation.url.optional(),
    twitter: CommonValidation.url.optional(),
    linkedin: CommonValidation.url.optional(),
    instagram: CommonValidation.url.optional(),
    youtube: CommonValidation.url.optional(),
    website: CommonValidation.url.optional(),
  }),
};

/**
 * =============================================================================
 * VALIDATION MIDDLEWARE FACTORIES
 * =============================================================================
 */

/**
 * Create validation middleware for different frameworks
 */
export const ValidationMiddleware = {
  /**
   * Create Express.js validation middleware
   */
  express: <T extends z.ZodType>(schema: T) => {
    return (req: any, res: any, next: any) => {
      const result = validateWithFormattedErrors(schema, req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'Validation Error',
          message: 'Request validation failed',
          errors: result.errors,
        });
      }
      
      req.validatedData = result.data;
      next();
    };
  },

  /**
   * Create NestJS validation pipe
   */
  nestjs: <T extends z.ZodType>(schema: T) => {
    return class {
      transform(value: any) {
        const result = schema.safeParse(value);
        if (!result.success) {
          throw new Error(JSON.stringify(formatValidationErrors(result.error)));
        }
        return result.data;
      }
    };
  },

  /**
   * Create generic validation function
   */
  generic: <T extends z.ZodType>(schema: T) => {
    return (data: unknown): T['_output'] => {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new Error(`Validation failed: ${JSON.stringify(formatValidationErrors(result.error))}`);
      }
      return result.data;
    };
  },
};

/**
 * =============================================================================
 * SCHEMA REGISTRY
 * =============================================================================
 */

/**
 * Central registry for all schemas
 */
export class SchemaRegistry {
  private static schemas = new Map<string, z.ZodType>();

  /**
   * Register a schema with a name
   */
  static register<T extends z.ZodType>(name: string, schema: T): void {
    this.schemas.set(name, schema);
  }

  /**
   * Get a schema by name
   */
  static get<T extends z.ZodType>(name: string): T | undefined {
    return this.schemas.get(name) as T;
  }

  /**
   * Get all registered schema names
   */
  static getNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Check if a schema is registered
   */
  static has(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Remove a schema from registry
   */
  static unregister(name: string): boolean {
    return this.schemas.delete(name);
  }

  /**
   * Clear all schemas
   */
  static clear(): void {
    this.schemas.clear();
  }
}

/**
 * =============================================================================
 * SCHEMA TESTING UTILITIES
 * =============================================================================
 */

/**
 * Utilities for testing schemas
 */
export const SchemaTestUtils = {
  /**
   * Generate test data that matches a schema
   */
  generateTestData: <T extends z.ZodType>(schema: T): Partial<T['_output']> => {
    // This is a basic implementation - in practice, you might want to use a library like faker.js
    const shape = (schema as any)._def?.shape?.();
    if (!shape) return {} as Partial<T['_output']>;

    const testData: any = {};
    for (const [key, fieldSchema] of Object.entries(shape)) {
      if (fieldSchema instanceof z.ZodString) {
        testData[key] = `test_${key}`;
      } else if (fieldSchema instanceof z.ZodNumber) {
        testData[key] = 123;
      } else if (fieldSchema instanceof z.ZodBoolean) {
        testData[key] = true;
      } else if (fieldSchema instanceof z.ZodDate) {
        testData[key] = new Date();
      }
    }
    return testData;
  },

  /**
   * Test schema with various invalid inputs
   */
  testSchemaValidation: <T extends z.ZodType>(
    schema: T,
    validData: T['_input'],
    invalidCases: Array<{ data: any; expectedError: string }>
  ) => {
    const results = {
      validCase: schema.safeParse(validData),
      invalidCases: invalidCases.map(testCase => ({
        data: testCase.data,
        result: schema.safeParse(testCase.data),
        expectedError: testCase.expectedError,
      })),
    };

    return results;
  },
};

/**
 * =============================================================================
 * EXPORTS
 * =============================================================================
 */

// Re-export utilities for convenience
export {
  formatValidationErrors,
  validateWithFormattedErrors,
  SchemaUtils,
  CommonValidation,
};

// Export types for TypeScript
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export type SchemaType<T extends z.ZodType> = z.infer<T>;

export type CRUDSchemas<T extends z.ZodRawShape> = ReturnType<typeof DTOGenerator.createCRUDSchemas<T>>;

export type APIResponseSchemas<T extends z.ZodType> = ReturnType<typeof DTOGenerator.createAPIResponseSchemas<T>>;