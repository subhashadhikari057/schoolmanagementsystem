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

// Export auth schemas specifically
export {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  MeResponseSchema,
  ChangePasswordSchema,
  RequestPasswordResetSchema,
  PasswordResetSchema,
  ForceChangePasswordSchema,
} from './schemas/auth/auth.schemas';

// Export calendar schemas specifically
export {
  // Schema exports
  CreateCalendarEntrySchema,
  UpdateCalendarEntrySchema,
  CalendarEntryResponseSchema,
  CalendarEntriesQuerySchema,
  CalendarEntriesResponseSchema,
  BulkCalendarOperationSchema,
  CalendarImportSchema
} from './dto/calendar/calendar.dto';

// Export calendar DTOs
export type {  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntryResponseDto,
  CalendarEntriesQueryDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CalendarImportDto
} from './dto/calendar/calendar.dto';

// Export calendar enums
export { CalendarEntryType } from './enums/calendar/calendar-entry-type.enum';
export { HolidayType } from './enums/calendar/holiday-type.enum';

// Export attendance types and schemas
export {
  // Schemas
  AttendanceEntrySchema,
  MarkAttendanceRequestSchema,
  GetAttendanceQuerySchema,
  UpdateAttendanceSchema,
  DailyAttendanceRequestSchema,
  BulkUpdateAttendanceSchema,
  BulkUpdateAttendanceRequestSchema,
} from './dto/attendance/attendance.dto';

// Export attendance DTO types
export type {
  AttendanceDto,
  AttendanceResponseDtoType,
  AttendanceEntryDtoType,
  MarkAttendanceRequestDtoType,
  MarkAttendanceRequestDto,
  GetAttendanceQueryDtoType,
  GetAttendanceQueryDto,
  UpdateAttendanceDtoType,
  UpdateAttendanceDto,
  DailyAttendanceRecordDtoType,
  DailyAttendanceRequestDtoType,
  DailyAttendanceRequestDto,
  BulkUpdateAttendanceDtoType,
  BulkUpdateAttendanceDto,
  BulkUpdateAttendanceRequestDtoType,
  BulkUpdateAttendanceRequestDto,
  AttendanceSummaryDtoType,
  StudentAttendanceSummaryDtoType,
  ClassAttendanceStatsDtoType,
  DailyAttendanceStatusDtoType,
  AttendanceDashboardSummaryDtoType,
} from './dto/attendance/attendance.dto';

// Export attendance enums
export { AttendanceStatus } from './enums/attendance/attendance-status.enum';

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