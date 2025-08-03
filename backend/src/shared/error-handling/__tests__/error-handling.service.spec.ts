// backend/src/shared/error-handling/__tests__/error-handling.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorHandlingService } from '../error-handling.service';
import { ErrorCodes, ValidationErrorDetail } from '@sms/shared-types';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorHandlingService],
    }).compile();

    service = module.get<ErrorHandlingService>(ErrorHandlingService);
  });

  describe('throwBusinessError', () => {
    it('should throw HttpException with business error details', () => {
      const params = {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Student not found',
        code: ErrorCodes.STUDENT_NOT_FOUND,
        rule: 'RESOURCE_EXISTENCE_CHECK',
        context: { studentId: 'test-id' },
        suggestion: 'Verify the student ID',
        traceId: 'test-trace-id',
      };

      expect(() => service.throwBusinessError(params)).toThrow(HttpException);

      try {
        service.throwBusinessError(params);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);

        const response = httpError.getResponse() as any;
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
        expect(response.message).toBe('Student not found');
        expect(response.code).toBe(ErrorCodes.STUDENT_NOT_FOUND);
        expect(response.traceId).toBe('test-trace-id');
        expect(response.details.business.rule).toBe('RESOURCE_EXISTENCE_CHECK');
        expect(response.details.business.context).toEqual({
          studentId: 'test-id',
        });
        expect(response.details.business.suggestion).toBe(
          'Verify the student ID',
        );
      }
    });
  });

  describe('throwValidationError', () => {
    it('should throw HttpException with validation error details', () => {
      const validationErrors: ValidationErrorDetail[] = [
        {
          field: 'email',
          value: 'invalid-email',
          message: 'Invalid email format',
          code: ErrorCodes.INVALID_EMAIL,
        },
        {
          field: 'age',
          value: -1,
          message: 'Age must be positive',
          code: ErrorCodes.VALUE_OUT_OF_RANGE,
        },
      ];

      const params = {
        message: 'Validation failed',
        validationErrors,
        traceId: 'test-trace-id',
      };

      expect(() => service.throwValidationError(params)).toThrow(HttpException);

      try {
        service.throwValidationError(params);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);

        const response = httpError.getResponse() as any;
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(response.message).toBe('Validation failed');
        expect(response.details.validation).toHaveLength(2);
        expect(response.details.validation[0].field).toBe('email');
        expect(response.details.validation[1].field).toBe('age');
      }
    });
  });

  describe('throwAuthError', () => {
    it('should throw HttpException with authentication error details', () => {
      const params = {
        message: 'Invalid credentials',
        reason: 'INVALID_CREDENTIALS' as const,
        traceId: 'test-trace-id',
        remainingAttempts: 2,
      };

      expect(() => service.throwAuthError(params)).toThrow(HttpException);

      try {
        service.throwAuthError(params);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.UNAUTHORIZED);

        const response = (error as HttpException).getResponse() as any;
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.message).toBe('Invalid credentials');
        expect(response.code).toBe('INVALID_CREDENTIALS');
        expect(response.details.auth.reason).toBe('INVALID_CREDENTIALS');
        expect(response.details.auth.remainingAttempts).toBe(2);
      }
    });
  });

  describe('throwNotFoundError', () => {
    it('should throw not found error for student resource', () => {
      expect(() =>
        service.throwNotFoundError('Student', 'test-id', 'trace-123'),
      ).toThrow(HttpException);

      try {
        service.throwNotFoundError('Student', 'test-id', 'trace-123');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);

        const response = (error as HttpException).getResponse() as any;
        expect(response.message).toBe("Student with ID 'test-id' not found");
        expect(response.code).toBe(ErrorCodes.STUDENT_NOT_FOUND);
        expect(response.details.business.context).toEqual({
          studentId: 'test-id',
        });
      }
    });

    it('should throw not found error without identifier', () => {
      expect(() => service.throwNotFoundError('Teacher')).toThrow(
        HttpException,
      );

      try {
        service.throwNotFoundError('Teacher');
      } catch (error) {
        const response = (error as HttpException).getResponse() as any;
        expect(response.message).toBe('Teacher not found');
        expect(response.code).toBe(ErrorCodes.STUDENT_NOT_FOUND);
      }
    });
  });

  describe('throwForbiddenError', () => {
    it('should throw forbidden error with proper details', () => {
      expect(() =>
        service.throwForbiddenError('delete', 'student records', 'trace-123'),
      ).toThrow(HttpException);

      try {
        service.throwForbiddenError('delete', 'student records', 'trace-123');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.UNAUTHORIZED);

        const response = (error as HttpException).getResponse() as any;
        expect(response.message).toBe(
          'Insufficient permissions to delete student records',
        );
        expect(response.code).toBe(ErrorCodes.INSUFFICIENT_PERMISSIONS);
        expect(response.details.auth.reason).toBe('INSUFFICIENT_PERMISSIONS');
      }
    });
  });

  describe('throwConflictError', () => {
    it('should throw conflict error with proper mapping', () => {
      expect(() =>
        service.throwConflictError(
          'Roll number already exists',
          'roll_number',
          'trace-123',
        ),
      ).toThrow(HttpException);

      try {
        service.throwConflictError(
          'Roll number already exists',
          'roll_number',
          'trace-123',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.CONFLICT);

        const response = (error as HttpException).getResponse() as any;
        expect(response.message).toBe('Roll number already exists');
        expect(response.code).toBe(ErrorCodes.DUPLICATE_ROLL_NUMBER);
        expect(response.details.business.rule).toBe('UNIQUENESS_CONSTRAINT');
      }
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const rawErrors = [
        {
          field: 'email',
          value: 'invalid',
          message: 'Invalid email',
        },
        {
          property: 'name',
          constraints: {
            isNotEmpty: 'Name should not be empty',
          },
        },
      ];

      const formatted = service.formatValidationErrors(rawErrors);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toEqual({
        field: 'email',
        value: 'invalid',
        message: 'Invalid email',
        code: ErrorCodes.INVALID_FORMAT,
      });
      expect(formatted[1]).toEqual({
        field: 'unknown',
        value: undefined,
        message: 'Validation failed',
        code: ErrorCodes.INVALID_FORMAT,
      });
    });
  });

  describe('isBusinessError', () => {
    it('should identify business errors correctly', () => {
      const businessError = new HttpException(
        {
          success: false,
          statusCode: 404,
          error: 'Not Found',
          message: 'Student not found',
          code: ErrorCodes.STUDENT_NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );

      const regularError = new HttpException(
        'Regular error',
        HttpStatus.BAD_REQUEST,
      );

      expect(service.isBusinessError(businessError)).toBe(false);
      expect(service.isBusinessError(regularError)).toBe(false);
      expect(service.isBusinessError(new Error('Regular error'))).toBe(false);
    });
  });

  describe('getTraceId', () => {
    it('should return trace ID from request if available', () => {
      const request = { traceId: 'existing-trace-id' };
      expect(service.getTraceId(request)).toBe('existing-trace-id');
    });

    it('should generate new trace ID if not in request', () => {
      const traceId = service.getTraceId();
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(traceId.length).toBeGreaterThan(0);
    });

    it('should generate new trace ID for empty request', () => {
      const traceId = service.getTraceId({});
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const params = {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid input data',
        code: ErrorCodes.INVALID_FORMAT,
        traceId: 'test-trace-id',
        severity: 'medium' as const,
      };

      const response = service.createErrorResponse(params);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.error).toBe('Bad Request');
      expect(response.message).toBe('Invalid input data');
      expect(response.code).toBe(ErrorCodes.INVALID_FORMAT);
      expect(response.traceId).toBe('test-trace-id');
      expect(response.severity).toBe('medium');
      expect(response.timestamp).toBeDefined();
    });
  });
});
