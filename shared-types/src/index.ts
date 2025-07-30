/**
 * =============================================================================
 * Shared Types Package - Main Export
 * =============================================================================
 * This is the main entry point for the @sms/shared-types package.
 * It exports all types, DTOs, enums, and utilities used across the application.
 * =============================================================================
 */

// Export all enums
export * from './enums';

// Export all DTOs
export * from './dto';

// Export all interfaces
export * from './interfaces';

// Export specific schemas to avoid conflicts
export {
  ErrorCodes,
  ValidationErrorCodes,
  AuthErrorCodes,
  BusinessErrorCodes,
  SystemErrorCodes,
  ErrorTimestampSchema,
  ValidationErrorDetailSchema,
  DatabaseErrorDetailSchema,
  BusinessLogicErrorDetailSchema,
  AuthErrorDetailSchema,
  RateLimitErrorDetailSchema,
  FileErrorDetailSchema,
  ExternalServiceErrorDetailSchema,
  BaseErrorResponseSchema,
  DetailedErrorResponseSchema,
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createBusinessErrorResponse,
  createRateLimitErrorResponse
} from './schemas/common/error.schemas';

// Export error types
export type {
  ErrorSeverity,
  ValidationErrorDetail,
  DatabaseErrorDetail,
  BusinessLogicErrorDetail,
  AuthErrorDetail,
  RateLimitErrorDetail,
  FileErrorDetail,
  ExternalServiceErrorDetail,
  BaseErrorResponse as BaseErrorResponseDto,
  DetailedErrorResponse as DetailedErrorResponseDto
} from './schemas/common/error.schemas';

// Export all utilities
export * from './utils';

// Package information
export const PACKAGE_INFO = {
  name: '@sms/shared-types',
  version: '1.0.0',
  description: 'Shared TypeScript types, DTOs, and enums for School Management System',
} as const;