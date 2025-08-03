import { z } from 'zod';
import {
  // Primitive schemas
  TraceIdSchema,
  ErrorCodeSchema,
  ErrorSeveritySchema,
  HttpStatusCodeSchema,
  ErrorTimestampSchema,
  
  // Detail schemas
  ValidationErrorDetailSchema,
  DatabaseErrorDetailSchema,
  BusinessLogicErrorDetailSchema,
  AuthErrorDetailSchema,
  RateLimitErrorDetailSchema,
  FileErrorDetailSchema,
  ExternalServiceErrorDetailSchema,
  
  // Response schemas
  BaseErrorResponseSchema,
  DetailedErrorResponseSchema,
  
  // Error codes
  ErrorCodes,
  AuthErrorCodes,
  ValidationErrorCodes,
  BusinessErrorCodes,
  SystemErrorCodes,
  
  // Factory functions
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createBusinessErrorResponse,
  createRateLimitErrorResponse,
  
  // Types
  BaseErrorResponse,
  DetailedErrorResponse,
  ValidationErrorDetail,
  ErrorCodeType,
} from '../../../schemas/common/error.schemas';

describe('Error Handling Schemas', () => {
  describe('Primitive Error Schemas', () => {
    describe('TraceIdSchema', () => {
      test('should validate valid UUID trace IDs', () => {
        const validTraceIds = [
          '123e4567-e89b-12d3-a456-426614174000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ];

        validTraceIds.forEach(traceId => {
          expect(() => TraceIdSchema.parse(traceId)).not.toThrow();
        });
      });

      test('should reject invalid trace IDs', () => {
        const invalidTraceIds = [
          'not-a-uuid',
          '123e4567-e89b-12d3-a456',
          '123e4567-e89b-12d3-a456-426614174000-extra',
          '',
          123,
          null,
          undefined,
        ];

        invalidTraceIds.forEach(traceId => {
          expect(() => TraceIdSchema.parse(traceId)).toThrow();
        });
      });
    });

    describe('ErrorCodeSchema', () => {
      test('should validate valid error codes', () => {
        const validCodes = [
          'VALIDATION_ERROR',
          'USER_NOT_FOUND',
          'INSUFFICIENT_PERMISSIONS',
          'RATE_LIMIT_EXCEEDED',
          'DATABASE_CONNECTION_FAILED',
          'A',
          'A1',
          'A_B_C_1_2_3',
        ];

        validCodes.forEach(code => {
          expect(() => ErrorCodeSchema.parse(code)).not.toThrow();
        });
      });

      test('should reject invalid error codes', () => {
        const invalidCodes = [
          'lowercase_error',
          'Mixed_Case_Error',
          'SPACES IN CODE',
          'SPECIAL-CHARS',
          'SPECIAL@CHARS',
          'TRAILING_',
          '_LEADING',
          '',
          'a'.repeat(101), // too long
        ];

        invalidCodes.forEach(code => {
          expect(() => ErrorCodeSchema.parse(code)).toThrow();
        });
      });
    });

    describe('ErrorSeveritySchema', () => {
      test('should validate valid severity levels', () => {
        const validSeverities = ['low', 'medium', 'high', 'critical'];

        validSeverities.forEach(severity => {
          expect(() => ErrorSeveritySchema.parse(severity)).not.toThrow();
        });
      });

      test('should reject invalid severity levels', () => {
        const invalidSeverities = ['minor', 'major', 'urgent', 'info', 'warning', 'error'];

        invalidSeverities.forEach(severity => {
          expect(() => ErrorSeveritySchema.parse(severity)).toThrow();
        });
      });
    });

    describe('HttpStatusCodeSchema', () => {
      test('should validate valid HTTP status codes', () => {
        const validCodes = [100, 200, 201, 400, 401, 403, 404, 500, 502, 599];

        validCodes.forEach(code => {
          expect(() => HttpStatusCodeSchema.parse(code)).not.toThrow();
        });
      });

      test('should reject invalid HTTP status codes', () => {
        const invalidCodes = [99, 600, 0, -1, 1000, 'not-a-number', null];

        invalidCodes.forEach(code => {
          expect(() => HttpStatusCodeSchema.parse(code)).toThrow();
        });
      });
    });

    describe('ErrorTimestampSchema', () => {
      test('should validate valid ISO 8601 timestamps', () => {
        const validTimestamps = [
          '2023-12-01T10:30:00Z',
          '2023-12-01T10:30:00.000Z',
          '2023-12-01T10:30:00+00:00',
          '2023-12-01T10:30:00-05:00',
          new Date().toISOString(),
        ];

        validTimestamps.forEach(timestamp => {
          expect(() => ErrorTimestampSchema.parse(timestamp)).not.toThrow();
        });
      });

      test('should reject invalid timestamps', () => {
        const invalidTimestamps = [
          '2023-12-01',
          '10:30:00',
          'not-a-date',
          '2023/12/01 10:30:00',
          Date.now(),
          null,
        ];

        invalidTimestamps.forEach(timestamp => {
          expect(() => ErrorTimestampSchema.parse(timestamp)).toThrow();
        });
      });
    });
  });

  describe('Error Detail Schemas', () => {
    describe('ValidationErrorDetailSchema', () => {
      test('should validate complete validation error detail', () => {
        const validDetail = {
          field: 'email',
          value: 'invalid-email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL',
        };

        expect(() => ValidationErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should validate minimal validation error detail', () => {
        const minimalDetail = {
          field: 'password',
          message: 'Password too weak',
        };

        expect(() => ValidationErrorDetailSchema.parse(minimalDetail)).not.toThrow();
      });

      test('should reject invalid validation error detail', () => {
        const invalidDetails = [
          { message: 'Missing field' }, // missing field
          { field: 'email' }, // missing message
          { field: '', message: 'Empty field name' }, // empty field
          { field: 'email', message: '' }, // empty message
        ];

        invalidDetails.forEach(detail => {
          expect(() => ValidationErrorDetailSchema.parse(detail)).toThrow();
        });
      });
    });

    describe('DatabaseErrorDetailSchema', () => {
      test('should validate complete database error detail', () => {
        const validDetail = {
          table: 'users',
          constraint: 'unique_email',
          operation: 'CREATE' as const,
          query: 'INSERT INTO users (email) VALUES (?)',
        };

        expect(() => DatabaseErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should validate minimal database error detail', () => {
        const minimalDetail = {};

        expect(() => DatabaseErrorDetailSchema.parse(minimalDetail)).not.toThrow();
      });

      test('should validate valid operations', () => {
        const operations = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

        operations.forEach(operation => {
          const detail = { operation };
          expect(() => DatabaseErrorDetailSchema.parse(detail)).not.toThrow();
        });
      });

      test('should reject invalid operations', () => {
        const invalidOperations = ['INSERT', 'SELECT', 'UPSERT', 'MERGE'];

        invalidOperations.forEach(operation => {
          const detail = { operation };
          expect(() => DatabaseErrorDetailSchema.parse(detail)).toThrow();
        });
      });
    });

    describe('BusinessLogicErrorDetailSchema', () => {
      test('should validate complete business logic error detail', () => {
        const validDetail = {
          rule: 'Student must be enrolled in class before submitting assignment',
          context: { studentId: '123', classId: '456', assignmentId: '789' },
          suggestion: 'Enroll the student in the class first',
        };

        expect(() => BusinessLogicErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should validate minimal business logic error detail', () => {
        const minimalDetail = {
          rule: 'Maximum capacity exceeded',
        };

        expect(() => BusinessLogicErrorDetailSchema.parse(minimalDetail)).not.toThrow();
      });

      test('should reject missing rule', () => {
        const invalidDetail = {
          context: { limit: 100 },
          suggestion: 'Try again later',
        };

        expect(() => BusinessLogicErrorDetailSchema.parse(invalidDetail)).toThrow();
      });
    });

    describe('AuthErrorDetailSchema', () => {
      test('should validate complete auth error detail', () => {
        const validDetail = {
          reason: 'INVALID_CREDENTIALS' as const,
          remainingAttempts: 2,
          lockoutUntil: '2023-12-01T11:00:00Z',
        };

        expect(() => AuthErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should validate all auth reasons', () => {
        const reasons = [
          'INVALID_CREDENTIALS',
          'TOKEN_EXPIRED',
          'TOKEN_INVALID',
          'INSUFFICIENT_PERMISSIONS',
          'ACCOUNT_LOCKED',
          'ACCOUNT_DISABLED',
          '2FA_REQUIRED',
          '2FA_INVALID',
        ];

        reasons.forEach(reason => {
          const detail = { reason };
          expect(() => AuthErrorDetailSchema.parse(detail)).not.toThrow();
        });
      });

      test('should reject invalid auth reasons', () => {
        const invalidReasons = ['INVALID_PASSWORD', 'EXPIRED_TOKEN', 'DISABLED_ACCOUNT'];

        invalidReasons.forEach(reason => {
          const detail = { reason };
          expect(() => AuthErrorDetailSchema.parse(detail)).toThrow();
        });
      });

      test('should reject negative remaining attempts', () => {
        const invalidDetail = {
          reason: 'INVALID_CREDENTIALS' as const,
          remainingAttempts: -1,
        };

        expect(() => AuthErrorDetailSchema.parse(invalidDetail)).toThrow();
      });
    });

    describe('RateLimitErrorDetailSchema', () => {
      test('should validate complete rate limit error detail', () => {
        const validDetail = {
          limit: 100,
          remaining: 0,
          resetTime: '2023-12-01T11:00:00Z',
          retryAfter: 3600,
        };

        expect(() => RateLimitErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should reject invalid values', () => {
        const invalidDetails = [
          { limit: 0, remaining: 0, resetTime: '2023-12-01T11:00:00Z', retryAfter: 0 }, // limit must be >= 1
          { limit: 100, remaining: -1, resetTime: '2023-12-01T11:00:00Z', retryAfter: 0 }, // remaining must be >= 0
          { limit: 100, remaining: 0, resetTime: 'invalid-date', retryAfter: 0 }, // invalid date
          { limit: 100, remaining: 0, resetTime: '2023-12-01T11:00:00Z', retryAfter: -1 }, // retryAfter must be >= 0
        ];

        invalidDetails.forEach(detail => {
          expect(() => RateLimitErrorDetailSchema.parse(detail)).toThrow();
        });
      });
    });

    describe('FileErrorDetailSchema', () => {
      test('should validate complete file error detail', () => {
        const validDetail = {
          filename: 'document.pdf',
          size: 1048576,
          mimeType: 'application/pdf',
          maxSize: 10485760,
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        };

        expect(() => FileErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should validate minimal file error detail', () => {
        const minimalDetail = {};

        expect(() => FileErrorDetailSchema.parse(minimalDetail)).not.toThrow();
      });

      test('should reject negative file sizes', () => {
        const invalidDetails = [
          { size: -1 },
          { maxSize: -1 },
        ];

        invalidDetails.forEach(detail => {
          expect(() => FileErrorDetailSchema.parse(detail)).toThrow();
        });
      });
    });

    describe('ExternalServiceErrorDetailSchema', () => {
      test('should validate complete external service error detail', () => {
        const validDetail = {
          service: 'Payment Gateway',
          endpoint: 'https://api.payment.com/charge',
          statusCode: 503,
          timeout: false,
        };

        expect(() => ExternalServiceErrorDetailSchema.parse(validDetail)).not.toThrow();
      });

      test('should validate minimal external service error detail', () => {
        const minimalDetail = {
          service: 'Email Service',
        };

        expect(() => ExternalServiceErrorDetailSchema.parse(minimalDetail)).not.toThrow();
      });

      test('should apply default timeout value', () => {
        const detail = {
          service: 'SMS Service',
        };

        const parsed = ExternalServiceErrorDetailSchema.parse(detail);
        expect(parsed.timeout).toBe(false);
      });
    });
  });

  describe('Error Response Schemas', () => {
    describe('BaseErrorResponseSchema', () => {
      test('should validate complete base error response', () => {
        const validResponse = {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid input provided',
          code: 'VALIDATION_ERROR',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: '2023-12-01T10:30:00Z',
          severity: 'medium' as const,
        };

        expect(() => BaseErrorResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should validate minimal base error response', () => {
        const minimalResponse = {
          success: false,
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        };

        expect(() => BaseErrorResponseSchema.parse(minimalResponse)).not.toThrow();
      });

      test('should reject invalid base error response', () => {
        const invalidResponses = [
          { success: true, statusCode: 400, error: 'Bad Request', message: 'Error' }, // success should be false
          { success: false, error: 'Bad Request', message: 'Error' }, // missing statusCode
          { success: false, statusCode: 400, message: 'Error' }, // missing error
          { success: false, statusCode: 400, error: 'Bad Request' }, // missing message
          { success: false, statusCode: 400, error: '', message: 'Error' }, // empty error
          { success: false, statusCode: 400, error: 'Bad Request', message: '' }, // empty message
        ];

        invalidResponses.forEach(response => {
          expect(() => BaseErrorResponseSchema.parse(response)).toThrow();
        });
      });
    });

    describe('DetailedErrorResponseSchema', () => {
      test('should validate complete detailed error response', () => {
        const validResponse = {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: '2023-12-01T10:30:00Z',
          severity: 'medium' as const,
          details: {
            validation: [{
              field: 'email',
              value: 'invalid-email',
              message: 'Invalid email format',
              code: 'INVALID_EMAIL',
            }],
            database: {
              table: 'users',
              constraint: 'unique_email',
              operation: 'CREATE' as const,
            },
          },
          errors: {
            email: ['Invalid email format'],
            password: ['Password too weak'],
          },
          stack: 'Error: Validation failed\n    at ...',
          context: {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            userRole: 'student',
            endpoint: '/api/v1/users',
            method: 'POST' as const,
            userAgent: 'Mozilla/5.0 ...',
            ip: '192.168.1.1',
            requestId: '123e4567-e89b-12d3-a456-426614174000',
          },
        };

        expect(() => DetailedErrorResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should validate minimal detailed error response', () => {
        const minimalResponse = {
          success: false,
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        };

        expect(() => DetailedErrorResponseSchema.parse(minimalResponse)).not.toThrow();
      });

      test('should validate context with valid HTTP methods', () => {
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

        methods.forEach(method => {
          const response = {
            success: false,
            statusCode: 400,
            error: 'Bad Request',
            message: 'Error',
            context: { method },
          };

          expect(() => DetailedErrorResponseSchema.parse(response)).not.toThrow();
        });
      });

      test('should reject invalid HTTP methods in context', () => {
        const invalidMethods = ['HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];

        invalidMethods.forEach(method => {
          const response = {
            success: false,
            statusCode: 400,
            error: 'Bad Request',
            message: 'Error',
            context: { method },
          };

          expect(() => DetailedErrorResponseSchema.parse(response)).toThrow();
        });
      });
    });
  });

  describe('Error Codes', () => {
    test('should have all auth error codes', () => {
      const expectedAuthCodes = [
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'INSUFFICIENT_PERMISSIONS',
        'ACCOUNT_LOCKED',
        'ACCOUNT_DISABLED',
        'TWO_FA_REQUIRED',
        'TWO_FA_INVALID',
        'PASSWORD_TOO_WEAK',
        'PASSWORD_RECENTLY_USED',
      ];

      expectedAuthCodes.forEach(code => {
        expect(AuthErrorCodes).toHaveProperty(code);
        expect(ErrorCodes).toHaveProperty(code);
      });
    });

    test('should have all validation error codes', () => {
      const expectedValidationCodes = [
        'REQUIRED_FIELD_MISSING',
        'INVALID_FORMAT',
        'VALUE_TOO_SHORT',
        'VALUE_TOO_LONG',
        'VALUE_OUT_OF_RANGE',
        'INVALID_EMAIL',
        'INVALID_PHONE',
        'INVALID_UUID',
        'INVALID_DATE',
        'DUPLICATE_VALUE',
      ];

      expectedValidationCodes.forEach(code => {
        expect(ValidationErrorCodes).toHaveProperty(code);
        expect(ErrorCodes).toHaveProperty(code);
      });
    });

    test('should have all business error codes', () => {
      const expectedBusinessCodes = [
        'STUDENT_NOT_FOUND',
        'TEACHER_NOT_FOUND',
        'CLASS_NOT_FOUND',
        'SECTION_NOT_FOUND',
        'ASSIGNMENT_NOT_FOUND',
        'EXAM_NOT_FOUND',
        'STUDENT_ALREADY_ENROLLED',
        'TEACHER_ALREADY_ASSIGNED',
        'ASSIGNMENT_DEADLINE_PASSED',
        'EXAM_ALREADY_STARTED',
        'INSUFFICIENT_BALANCE',
        'PAYMENT_FAILED',
        'DUPLICATE_ROLL_NUMBER',
        'INVALID_ACADEMIC_YEAR',
        'CLASS_CAPACITY_EXCEEDED',
      ];

      expectedBusinessCodes.forEach(code => {
        expect(BusinessErrorCodes).toHaveProperty(code);
        expect(ErrorCodes).toHaveProperty(code);
      });
    });

    test('should have all system error codes', () => {
      const expectedSystemCodes = [
        'DATABASE_CONNECTION_FAILED',
        'DATABASE_CONSTRAINT_VIOLATION',
        'FILE_UPLOAD_FAILED',
        'FILE_TOO_LARGE',
        'INVALID_FILE_TYPE',
        'EXTERNAL_SERVICE_UNAVAILABLE',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'SERVICE_UNAVAILABLE',
        'CONFIGURATION_ERROR',
      ];

      expectedSystemCodes.forEach(code => {
        expect(SystemErrorCodes).toHaveProperty(code);
        expect(ErrorCodes).toHaveProperty(code);
      });
    });
  });

  describe('Error Response Factories', () => {
    describe('createErrorResponse', () => {
      test('should create basic error response', () => {
        const response = createErrorResponse({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid input',
        });

        expect(response).toMatchObject({
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid input',
        });
        expect(response.timestamp).toBeDefined();
        expect(new Date(response.timestamp!)).toBeInstanceOf(Date);
      });

      test('should create error response with all optional fields', () => {
        const traceId = '123e4567-e89b-12d3-a456-426614174000';
        const context = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          userRole: 'student',
          endpoint: '/api/v1/users',
          method: 'POST' as const,
        };

        const response = createErrorResponse({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          traceId,
          severity: 'medium',
          details: {
            validation: [{
              field: 'email',
              message: 'Invalid email format',
            }],
          },
          context,
        });

        expect(response).toMatchObject({
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          traceId,
          severity: 'medium',
          context,
        });
        expect(response.details?.validation).toHaveLength(1);
      });
    });

    describe('createValidationErrorResponse', () => {
      test('should create validation error response', () => {
        const validationErrors = [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too weak' },
        ];

        const response = createValidationErrorResponse({
          message: 'Validation failed',
          validationErrors,
          traceId: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(response).toMatchObject({
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          severity: 'medium',
        });
        expect(response.details?.validation).toEqual(validationErrors);
      });
    });

    describe('createAuthErrorResponse', () => {
      test('should create auth error response', () => {
        const response = createAuthErrorResponse({
          message: 'Invalid credentials',
          reason: 'INVALID_CREDENTIALS',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          remainingAttempts: 2,
          lockoutUntil: '2023-12-01T11:00:00Z',
        });

        expect(response).toMatchObject({
          success: false,
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          severity: 'high',
        });
        expect(response.details?.auth).toMatchObject({
          reason: 'INVALID_CREDENTIALS',
          remainingAttempts: 2,
          lockoutUntil: '2023-12-01T11:00:00Z',
        });
      });
    });

    describe('createBusinessErrorResponse', () => {
      test('should create business error response', () => {
        const response = createBusinessErrorResponse({
          statusCode: 409,
          message: 'Student already enrolled in this class',
          code: 'STUDENT_ALREADY_ENROLLED',
          rule: 'Student can only be enrolled once per class',
          context: { studentId: '123', classId: '456' },
          suggestion: 'Check enrollment status before attempting to enroll',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(response).toMatchObject({
          success: false,
          statusCode: 409,
          error: 'Business Logic Error',
          message: 'Student already enrolled in this class',
          code: 'STUDENT_ALREADY_ENROLLED',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          severity: 'medium',
        });
        expect(response.details?.business).toMatchObject({
          rule: 'Student can only be enrolled once per class',
          context: { studentId: '123', classId: '456' },
          suggestion: 'Check enrollment status before attempting to enroll',
        });
      });

      test('should use "Not Found" error for 404 status', () => {
        const response = createBusinessErrorResponse({
          statusCode: 404,
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND',
          rule: 'Student must exist in the system',
        });

        expect(response.error).toBe('Not Found');
      });
    });

    describe('createRateLimitErrorResponse', () => {
      test('should create rate limit error response', () => {
        const response = createRateLimitErrorResponse({
          limit: 100,
          remaining: 0,
          resetTime: '2023-12-01T11:00:00Z',
          retryAfter: 3600,
          traceId: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(response).toMatchObject({
          success: false,
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Try again in 3600 seconds.',
          code: 'RATE_LIMIT_EXCEEDED',
          traceId: '123e4567-e89b-12d3-a456-426614174000',
          severity: 'medium',
        });
        expect(response.details?.rateLimit).toMatchObject({
          limit: 100,
          remaining: 0,
          resetTime: '2023-12-01T11:00:00Z',
          retryAfter: 3600,
        });
      });
    });
  });

  describe('Type Safety', () => {
    test('should have proper TypeScript types', () => {
      // Test that types are properly inferred
      const errorResponse: BaseErrorResponse = {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Error message',
      };

      const detailedResponse: DetailedErrorResponse = {
        ...errorResponse,
        details: {
          validation: [{
            field: 'email',
            message: 'Invalid email',
          }],
        },
      };

      const validationError: ValidationErrorDetail = {
        field: 'password',
        message: 'Password too weak',
        code: 'PASSWORD_TOO_WEAK',
        value: 'weak',
      };

      const errorCode: ErrorCodeType = 'VALIDATION_ERROR';

      // These should not throw TypeScript errors
      expect(errorResponse.success).toBe(false);
      expect(detailedResponse.details?.validation).toHaveLength(1);
      expect(validationError.field).toBe('password');
      expect(errorCode).toBe('VALIDATION_ERROR');
    });
  });
});