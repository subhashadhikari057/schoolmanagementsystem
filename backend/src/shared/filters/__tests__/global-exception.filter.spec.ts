// backend/src/shared/filters/__tests__/global-exception.filter.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { ZodError, ZodIssue } from 'zod';
import { ThrottlerException } from '@nestjs/throttler';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { AuditService } from '../../logger/audit.service';
import { ErrorCodes } from '@sms/shared-types';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let auditService: jest.Mocked<AuditService>;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    auditService = module.get(AuditService);

    // Mock Express request and response
    mockRequest = {
      traceId: 'test-trace-id',
      url: '/api/test',
      method: 'GET',
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'test-user-agent';
        return undefined;
      }),
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      user: { id: 'user-123', role: 'student' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: (): any => mockResponse,
        getRequest: (): any => mockRequest,
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle ZodError and return validation error response', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        } as ZodIssue,
        {
          code: 'invalid_string',
          validation: 'email',
          path: ['email'],
          message: 'Invalid email format',
        } as ZodIssue,
      ]);

      filter.catch(zodError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Request validation failed',
          code: 'VALIDATION_ERROR',
          traceId: 'test-trace-id',
          severity: 'medium',
          details: {
            validation: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Expected string, received number',
                code: ErrorCodes.INVALID_FORMAT,
              }),
            ]),
          },
          context: expect.objectContaining({
            userId: 'user-123',
            userRole: 'student',
            endpoint: '/api/test',
            method: 'GET',
          }),
        }),
      );
    });

    it('should handle ThrottlerException and return rate limit error response', () => {
      const throttlerError = new ThrottlerException('Too Many Requests');

      filter.catch(throttlerError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 429,
          error: 'Too Many Requests',
          message: expect.stringContaining('Rate limit exceeded'),
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          traceId: 'test-trace-id',
          severity: 'medium',
          details: {
            rateLimit: expect.objectContaining({
              limit: 100,
              remaining: 0,
              retryAfter: 60,
            }),
          },
        }),
      );
    });

    it('should handle HttpException and return standardized error response', () => {
      const httpError = new HttpException(
        {
          message: 'Student not found',
          code: ErrorCodes.STUDENT_NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(httpError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          error: 'Not Found',
          message: 'Student not found',
          code: ErrorCodes.STUDENT_NOT_FOUND,
          traceId: 'test-trace-id',
          severity: 'medium',
        }),
      );
    });

    it('should handle Prisma P2002 error (unique constraint violation)', () => {
      const prismaError = {
        code: 'P2002',
        meta: {
          constraint: 'unique_email',
        },
        message: 'Unique constraint failed',
      };

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 409,
          error: 'Conflict',
          message: 'A record with this information already exists',
          code: ErrorCodes.DUPLICATE_VALUE,
          severity: 'high',
          details: {
            database: {
              constraint: 'unique_email',
            },
          },
        }),
      );
    });

    it('should handle Prisma P2025 error (record not found)', () => {
      const prismaError = {
        code: 'P2025',
        message: 'Record not found',
      };

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          error: 'Not Found',
          message: 'The requested record was not found',
          code: ErrorCodes.STUDENT_NOT_FOUND,
          severity: 'high',
        }),
      );
    });

    it('should handle unknown errors with fallback response', () => {
      const unknownError = new Error('Something went wrong');

      filter.catch(unknownError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Something went wrong',
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          traceId: 'test-trace-id',
          severity: 'critical',
        }),
      );
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.stringContaining('Error: Test error'),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything(),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should record audit trail for significant errors', async () => {
      const unauthorizedError = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(unauthorizedError, mockHost);

      // Wait for async audit recording
      await new Promise(resolve => setTimeout(resolve, 0));

      const recordMock = auditService.record as jest.MockedFunction<
        typeof auditService.record
      >;
      expect(recordMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          action: 'ERROR_OCCURRED',
          module: 'ERROR_HANDLER',
          status: 'FAIL',
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
          details: expect.objectContaining({
            traceId: 'test-trace-id',
            statusCode: 401,
            endpoint: '/api/test',
            method: 'GET',
          }),
        }),
      );
    });

    it('should not record audit trail for non-significant errors', async () => {
      const badRequestError = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(badRequestError, mockHost);

      // Wait for async audit recording
      await new Promise(resolve => setTimeout(resolve, 0));

      const recordMock = auditService.record as jest.MockedFunction<
        typeof auditService.record
      >;
      expect(recordMock).not.toHaveBeenCalled();
    });

    it('should handle audit service failures gracefully', async () => {
      (auditService.record as jest.Mock).mockRejectedValue(
        new Error('Audit service failed'),
      );

      const serverError = new HttpException(
        'Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      // Should not throw even if audit fails
      expect(() => filter.catch(serverError, mockHost)).not.toThrow();

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should use fallback error response when error handling fails', () => {
      // Mock a scenario where error handling itself fails
      const malformedError = {
        getStatus: () => {
          throw new Error('getStatus failed');
        },
      };

      filter.catch(malformedError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          traceId: 'test-trace-id',
          severity: 'critical',
        }),
      );
    });

    it('should extract client IP from x-forwarded-for header', () => {
      mockRequest.headers = {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      };

      const error = new Error('Test error');
      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            ip: '192.168.1.1',
          }),
        }),
      );
    });

    it('should handle request without user context', () => {
      mockRequest.user = undefined;

      const error = new Error('Test error');
      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            userId: undefined,
            userRole: undefined,
          }),
        }),
      );
    });
  });
});
