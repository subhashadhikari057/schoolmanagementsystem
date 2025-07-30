import { z } from 'zod';

/**
 * =============================================================================
 * ERROR HANDLING SCHEMAS - COMPREHENSIVE STANDARDIZATION
 * =============================================================================
 * 
 * This module provides standardized error handling schemas, types, and utilities
 * for consistent error responses across the entire School Management System.
 * 
 * Features:
 * - Standard error envelope structure
 * - Domain-specific error codes
 * - Trace ID support for request tracking
 * - Validation error formatting
 * - HTTP status code mapping
 * - Error severity levels
 * - Structured error details
 */

/**
 * =============================================================================
 * PRIMITIVE ERROR SCHEMAS
 * =============================================================================
 */

/**
 * Trace ID schema for request tracking
 */
export const TraceIdSchema = z.string()
  .uuid('Trace ID must be a valid UUID')
  .describe('Unique identifier for request tracing and debugging');

/**
 * Error code schema - domain-specific error identifiers
 */
export const ErrorCodeSchema = z.string()
  .min(1, 'Error code cannot be empty')
  .max(100, 'Error code too long')
  .regex(/^[A-Z][A-Z0-9_]*[A-Z0-9]$|^[A-Z]$/, 'Error code must be UPPER_CASE with underscores, no trailing underscore')
  .describe('Domain-specific error code for programmatic handling');

/**
 * Error severity levels
 */
export const ErrorSeveritySchema = z.enum([
  'low',      // Minor issues, user can continue
  'medium',   // Issues that affect functionality but don't break the flow
  'high',     // Critical issues that prevent normal operation
  'critical'  // System-level errors that require immediate attention
]).describe('Error severity level for monitoring and alerting');

/**
 * HTTP status code schema
 */
export const HttpStatusCodeSchema = z.number()
  .int('Status code must be an integer')
  .min(100, 'Status code must be at least 100')
  .max(599, 'Status code must be at most 599')
  .describe('HTTP status code');

/**
 * Error timestamp schema
 */
export const ErrorTimestampSchema = z.string()
  .refine((val) => {
    // Accept ISO 8601 formats including timezone offsets
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)$/;
    return isoRegex.test(val) && !isNaN(Date.parse(val));
  }, 'Timestamp must be a valid ISO 8601 datetime')
  .describe('ISO 8601 timestamp when the error occurred');

/**
 * =============================================================================
 * STRUCTURED ERROR DETAILS
 * =============================================================================
 */

/**
 * Validation error detail schema
 */
export const ValidationErrorDetailSchema = z.object({
  field: z.string().min(1, 'Field name cannot be empty').describe('Field name that failed validation'),
  value: z.any().optional().describe('The invalid value that was provided'),
  message: z.string().min(1, 'Message cannot be empty').describe('Human-readable validation error message'),
  code: ErrorCodeSchema.optional().describe('Specific validation error code'),
});

/**
 * Database error detail schema
 */
export const DatabaseErrorDetailSchema = z.object({
  table: z.string().optional().describe('Database table involved in the error'),
  constraint: z.string().optional().describe('Database constraint that was violated'),
  operation: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE']).optional().describe('Database operation that failed'),
  query: z.string().optional().describe('Sanitized query that caused the error (no sensitive data)'),
});

/**
 * Business logic error detail schema
 */
export const BusinessLogicErrorDetailSchema = z.object({
  rule: z.string().describe('Business rule that was violated'),
  context: z.record(z.any()).optional().describe('Additional context about the business rule violation'),
  suggestion: z.string().optional().describe('Suggested action to resolve the error'),
});

/**
 * Authentication error detail schema
 */
export const AuthErrorDetailSchema = z.object({
  reason: z.enum([
    'INVALID_CREDENTIALS',
    'TOKEN_EXPIRED',
    'TOKEN_INVALID',
    'INSUFFICIENT_PERMISSIONS',
    'ACCOUNT_LOCKED',
    'ACCOUNT_DISABLED',
    '2FA_REQUIRED',
    '2FA_INVALID'
  ]).describe('Specific authentication failure reason'),
  remainingAttempts: z.number().int().min(0).optional().describe('Remaining login attempts before lockout'),
  lockoutUntil: z.string().datetime().optional().describe('Account lockout expiration time'),
});

/**
 * Rate limiting error detail schema
 */
export const RateLimitErrorDetailSchema = z.object({
  limit: z.number().int().min(1).describe('Rate limit threshold'),
  remaining: z.number().int().min(0).describe('Remaining requests in current window'),
  resetTime: z.string().datetime().describe('When the rate limit window resets'),
  retryAfter: z.number().int().min(0).describe('Seconds to wait before retrying'),
});

/**
 * File operation error detail schema
 */
export const FileErrorDetailSchema = z.object({
  filename: z.string().optional().describe('Name of the file involved in the error'),
  size: z.number().int().min(0).optional().describe('File size in bytes'),
  mimeType: z.string().optional().describe('MIME type of the file'),
  maxSize: z.number().int().min(0).optional().describe('Maximum allowed file size'),
  allowedTypes: z.array(z.string()).optional().describe('List of allowed MIME types'),
});

/**
 * External service error detail schema
 */
export const ExternalServiceErrorDetailSchema = z.object({
  service: z.string().describe('Name of the external service'),
  endpoint: z.string().optional().describe('External service endpoint that failed'),
  statusCode: HttpStatusCodeSchema.optional().describe('HTTP status code from external service'),
  timeout: z.boolean().default(false).describe('Whether the error was due to timeout'),
});

/**
 * =============================================================================
 * STANDARD ERROR ENVELOPE
 * =============================================================================
 */

/**
 * Base error response schema - matches Pre-Documents standard
 */
export const BaseErrorResponseSchema = z.object({
  success: z.literal(false).describe('Always false for error responses'),
  statusCode: HttpStatusCodeSchema.describe('HTTP status code'),
  error: z.string().min(1, 'Error name cannot be empty').describe('HTTP status text or error name'),
  message: z.string().min(1, 'Error message cannot be empty').describe('Human-readable error description'),
  code: ErrorCodeSchema.optional().describe('Domain-specific error code'),
  traceId: TraceIdSchema.optional().describe('Request trace ID for debugging'),
  timestamp: ErrorTimestampSchema.optional().describe('When the error occurred'),
  severity: ErrorSeveritySchema.optional().describe('Error severity level'),
});

/**
 * Extended error response schema with detailed error information
 */
export const DetailedErrorResponseSchema = BaseErrorResponseSchema.extend({
  details: z.object({
    validation: z.array(ValidationErrorDetailSchema).optional().describe('Validation error details'),
    database: DatabaseErrorDetailSchema.optional().describe('Database error details'),
    business: BusinessLogicErrorDetailSchema.optional().describe('Business logic error details'),
    auth: AuthErrorDetailSchema.optional().describe('Authentication error details'),
    rateLimit: RateLimitErrorDetailSchema.optional().describe('Rate limiting error details'),
    file: FileErrorDetailSchema.optional().describe('File operation error details'),
    external: ExternalServiceErrorDetailSchema.optional().describe('External service error details'),
    custom: z.record(z.any()).optional().describe('Custom error details'),
  }).optional().describe('Detailed error information for debugging'),
  
  errors: z.record(z.array(z.string())).optional().describe('Field-specific error messages (legacy support)'),
  
  stack: z.string().optional().describe('Error stack trace (only in development)'),
  
  context: z.object({
    userId: z.string().uuid().optional().describe('ID of the user who triggered the error'),
    userRole: z.string().optional().describe('Role of the user who triggered the error'),
    endpoint: z.string().optional().describe('API endpoint that generated the error'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional().describe('HTTP method'),
    userAgent: z.string().optional().describe('User agent string'),
    ip: z.string().optional().describe('Client IP address (anonymized)'),
    requestId: z.string().uuid().optional().describe('Unique request identifier'),
  }).optional().describe('Request context information'),
});

/**
 * =============================================================================
 * DOMAIN-SPECIFIC ERROR CODES
 * =============================================================================
 */

/**
 * Authentication error codes
 */
export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  TWO_FA_REQUIRED: 'TWO_FA_REQUIRED',
  TWO_FA_INVALID: 'TWO_FA_INVALID',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  PASSWORD_RECENTLY_USED: 'PASSWORD_RECENTLY_USED',
} as const;

/**
 * Validation error codes
 */
export const ValidationErrorCodes = {
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  VALUE_TOO_SHORT: 'VALUE_TOO_SHORT',
  VALUE_TOO_LONG: 'VALUE_TOO_LONG',
  VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_UUID: 'INVALID_UUID',
  INVALID_DATE: 'INVALID_DATE',
  DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/**
 * Business logic error codes
 */
export const BusinessErrorCodes = {
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  TEACHER_NOT_FOUND: 'TEACHER_NOT_FOUND',
  CLASS_NOT_FOUND: 'CLASS_NOT_FOUND',
  SECTION_NOT_FOUND: 'SECTION_NOT_FOUND',
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  EXAM_NOT_FOUND: 'EXAM_NOT_FOUND',
  STUDENT_ALREADY_ENROLLED: 'STUDENT_ALREADY_ENROLLED',
  TEACHER_ALREADY_ASSIGNED: 'TEACHER_ALREADY_ASSIGNED',
  ASSIGNMENT_DEADLINE_PASSED: 'ASSIGNMENT_DEADLINE_PASSED',
  EXAM_ALREADY_STARTED: 'EXAM_ALREADY_STARTED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  DUPLICATE_ROLL_NUMBER: 'DUPLICATE_ROLL_NUMBER',
  INVALID_ACADEMIC_YEAR: 'INVALID_ACADEMIC_YEAR',
  CLASS_CAPACITY_EXCEEDED: 'CLASS_CAPACITY_EXCEEDED',
} as const;

/**
 * System error codes
 */
export const SystemErrorCodes = {
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  DATABASE_CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

/**
 * All error codes combined
 */
export const ErrorCodes = {
  ...AuthErrorCodes,
  ...ValidationErrorCodes,
  ...BusinessErrorCodes,
  ...SystemErrorCodes,
} as const;

/**
 * Error code type
 */
export type ErrorCodeType = keyof typeof ErrorCodes;

/**
 * =============================================================================
 * ERROR RESPONSE FACTORIES
 * =============================================================================
 */

/**
 * Create a standard error response
 */
export const createErrorResponse = (params: {
  statusCode: number;
  error: string;
  message: string;
  code?: ErrorCodeType;
  traceId?: string;
  severity?: z.infer<typeof ErrorSeveritySchema>;
  details?: z.infer<typeof DetailedErrorResponseSchema>['details'];
  context?: z.infer<typeof DetailedErrorResponseSchema>['context'];
}): z.infer<typeof DetailedErrorResponseSchema> => {
  const response: z.infer<typeof DetailedErrorResponseSchema> = {
    success: false,
    statusCode: params.statusCode,
    error: params.error,
    message: params.message,
    timestamp: new Date().toISOString(),
  };

  // Add optional fields only if they have values
  if (params.code !== undefined) {
    response.code = params.code;
  }
  if (params.traceId !== undefined) {
    response.traceId = params.traceId;
  }
  if (params.severity !== undefined) {
    response.severity = params.severity;
  }
  if (params.details !== undefined) {
    response.details = params.details;
  }
  if (params.context !== undefined) {
    response.context = params.context;
  }

  return response;
};

/**
 * Create a validation error response
 */
export const createValidationErrorResponse = (params: {
  message: string;
  validationErrors: z.infer<typeof ValidationErrorDetailSchema>[];
  traceId?: string;
}): z.infer<typeof DetailedErrorResponseSchema> => {
  const response = createErrorResponse({
    statusCode: 400,
    error: 'Bad Request',
    message: params.message,
    code: 'VALIDATION_ERROR',
    severity: 'medium',
    details: {
      validation: params.validationErrors,
    },
  });
  
  if (params.traceId) {
    response.traceId = params.traceId;
  }
  
  return response;
};

/**
 * Create an authentication error response
 */
export const createAuthErrorResponse = (params: {
  message: string;
  reason: z.infer<typeof AuthErrorDetailSchema>['reason'];
  traceId?: string;
  remainingAttempts?: number;
  lockoutUntil?: string;
}): z.infer<typeof DetailedErrorResponseSchema> => {
  const response = createErrorResponse({
    statusCode: 401,
    error: 'Unauthorized',
    message: params.message,
    code: params.reason as any,
    severity: 'high',
    details: {
      auth: {
        reason: params.reason,
        remainingAttempts: params.remainingAttempts,
        lockoutUntil: params.lockoutUntil,
      },
    },
  });
  
  if (params.traceId) {
    response.traceId = params.traceId;
  }
  
  return response;
};

/**
 * Create a business logic error response
 */
export const createBusinessErrorResponse = (params: {
  statusCode: number;
  message: string;
  code: ErrorCodeType;
  rule: string;
  context?: Record<string, any>;
  suggestion?: string;
  traceId?: string;
}): z.infer<typeof DetailedErrorResponseSchema> => {
  const response = createErrorResponse({
    statusCode: params.statusCode,
    error: params.statusCode === 404 ? 'Not Found' : 'Business Logic Error',
    message: params.message,
    code: params.code,
    severity: 'medium',
    details: {
      business: {
        rule: params.rule,
        context: params.context,
        suggestion: params.suggestion,
      },
    },
  });
  
  if (params.traceId) {
    response.traceId = params.traceId;
  }
  
  return response;
};

/**
 * Create a rate limit error response
 */
export const createRateLimitErrorResponse = (params: {
  limit: number;
  remaining: number;
  resetTime: string;
  retryAfter: number;
  traceId?: string;
}): z.infer<typeof DetailedErrorResponseSchema> => {
  const response = createErrorResponse({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Try again in ${params.retryAfter} seconds.`,
    code: 'RATE_LIMIT_EXCEEDED',
    severity: 'medium',
    details: {
      rateLimit: {
        limit: params.limit,
        remaining: params.remaining,
        resetTime: params.resetTime,
        retryAfter: params.retryAfter,
      },
    },
  });
  
  if (params.traceId) {
    response.traceId = params.traceId;
  }
  
  return response;
};

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

export type BaseErrorResponse = z.infer<typeof BaseErrorResponseSchema>;
export type DetailedErrorResponse = z.infer<typeof DetailedErrorResponseSchema>;
export type ValidationErrorDetail = z.infer<typeof ValidationErrorDetailSchema>;
export type DatabaseErrorDetail = z.infer<typeof DatabaseErrorDetailSchema>;
export type BusinessLogicErrorDetail = z.infer<typeof BusinessLogicErrorDetailSchema>;
export type AuthErrorDetail = z.infer<typeof AuthErrorDetailSchema>;
export type RateLimitErrorDetail = z.infer<typeof RateLimitErrorDetailSchema>;
export type FileErrorDetail = z.infer<typeof FileErrorDetailSchema>;
export type ExternalServiceErrorDetail = z.infer<typeof ExternalServiceErrorDetailSchema>;

// Error severity enum type
export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;