// backend/src/shared/error-handling/__tests__/error-handling.integration.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import * as request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { z } from 'zod';
import { GlobalExceptionFilter } from '../../filters/global-exception.filter';
import { ErrorHandlingModule } from '../error-handling.module';
import { TraceIdMiddleware } from '../../middlewares/trace-id.middleware';
import { AuditService } from '../../logger/audit.service';
import { ErrorCodes } from 'shared-types';

// Test DTO schema
const TestDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
  age: z.number().min(1, 'Age must be positive'),
  name: z.string().min(1, 'Name is required'),
});

// Use the schema to prevent unused variable error
type TestDto = z.infer<typeof TestDtoSchema>;

// Test controller for integration testing
@Controller('test')
class TestController {
  @Get('success')
  getSuccess() {
    return { message: 'Success' };
  }

  @Get('http-error')
  getHttpError() {
    throw new HttpException('Test HTTP error', HttpStatus.BAD_REQUEST);
  }

  @Get('business-error')
  getBusinessError() {
    throw new HttpException(
      {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: 'Student not found',
        code: ErrorCodes.STUDENT_NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }

  @Get('unknown-error')
  getUnknownError() {
    throw new Error('Unknown error occurred');
  }

  @Get('prisma-error')
  getPrismaError() {
    const prismaError = new Error('Prisma error') as any;
    prismaError.code = 'P2002';
    prismaError.meta = { constraint: 'unique_email' };
    throw prismaError;
  }

  @Post('validation')
  postValidation(@Body() dto: TestDto) {
    return { message: 'Validation passed', data: dto };
  }
}

describe('Error Handling Integration', () => {
  let app: INestApplication;
  let auditService: jest.Mocked<AuditService>;

  beforeAll(async () => {
    const mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ErrorHandlingModule],
      controllers: [TestController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionFilter,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    auditService = moduleFixture.get(AuditService);

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );

    // Apply trace ID middleware
    app.use((req: any, res: any, next: any) => {
      new TraceIdMiddleware().use(req, res, next);
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    it('should return success response with trace ID header', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/success')
        .expect(200);

      expect(response.body).toEqual({ message: 'Success' });
      expect(response.headers['x-trace-id']).toBeDefined();
      expect(typeof response.headers['x-trace-id']).toBe('string');
    });
  });

  describe('HTTP exceptions', () => {
    it('should handle standard HTTP exceptions with trace ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/http-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Test HTTP error',
        traceId: expect.any(String),
        timestamp: expect.any(String),
        severity: 'medium',
      });

      expect(response.headers['x-trace-id']).toBeDefined();
      expect(response.body.traceId).toBe(response.headers['x-trace-id']);
    });

    it('should handle business logic errors with detailed information', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/business-error')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: 'Student not found',
        code: ErrorCodes.STUDENT_NOT_FOUND,
        traceId: expect.any(String),
        severity: 'medium',
      });
    });

    it('should handle unknown errors with fallback response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/unknown-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unknown error occurred',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        traceId: expect.any(String),
        severity: 'critical',
      });
    });

    it('should handle Prisma errors with database-specific details', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/prisma-error')
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 409,
        error: 'Conflict',
        message: 'A record with this information already exists',
        code: ErrorCodes.DUPLICATE_VALUE,
        traceId: expect.any(String),
        severity: 'high',
        details: {
          database: {
            operation: 'UNKNOWN',
            constraint: 'unique_email',
          },
        },
      });
    });
  });

  describe('Validation errors', () => {
    it('should handle validation errors with detailed field information', async () => {
      const invalidData = {
        email: 'invalid-email',
        age: -1,
        // name is missing
      };

      const response = await request(app.getHttpServer())
        .post('/test/validation')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        traceId: expect.any(String),
        severity: 'medium',
        details: {
          validation: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              code: expect.any(String),
            }),
          ]),
        },
      });

      // Check that validation errors are properly formatted
      const validationErrors = response.body.details.validation;
      expect(validationErrors.length).toBeGreaterThan(0);

      // Should have errors for email, age, and name
      const fields = validationErrors.map(
        (err: any) => (err as { field: string }).field,
      );
      expect(fields).toContain('email');
      expect(fields).toContain('age');
      expect(fields).toContain('name');
    });

    it('should handle valid data correctly', async () => {
      const validData = {
        email: 'test@example.com',
        age: 25,
        name: 'John Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/test/validation')
        .send(validData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Validation passed',
        data: validData,
      });
    });
  });

  describe('Request context', () => {
    it('should include request context in error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/http-error')
        .set('User-Agent', 'Test-Agent')
        .expect(400);

      expect(response.body.context).toMatchObject({
        endpoint: '/test/http-error',
        method: 'GET',
        userAgent: 'Test-Agent',
        ip: expect.any(String),
        requestId: expect.any(String),
      });

      // Request ID should match trace ID
      expect(response.body.context.requestId).toBe(response.body.traceId);
    });

    it('should handle requests without user agent', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/http-error')
        .expect(400);

      expect(response.body.context).toMatchObject({
        endpoint: '/test/http-error',
        method: 'GET',
        ip: expect.any(String),
        requestId: expect.any(String),
      });
    });
  });

  describe('Audit logging', () => {
    it('should record audit trail for server errors', async () => {
      await request(app.getHttpServer()).get('/test/unknown-error').expect(500);

      // Wait for async audit recording
      await new Promise(resolve => setTimeout(resolve, 100));

      const recordMock = auditService.record as jest.MockedFunction<
        typeof auditService.record
      >;
      expect(recordMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ERROR_OCCURRED',
          module: 'ERROR_HANDLER',
          status: 'FAIL',
          details: expect.objectContaining({
            statusCode: 500,
            endpoint: '/test/unknown-error',
            method: 'GET',
          }),
        }),
      );
    });

    it('should not record audit trail for client errors', async () => {
      await request(app.getHttpServer()).get('/test/http-error').expect(400);

      // Wait for potential async audit recording
      await new Promise(resolve => setTimeout(resolve, 100));

      const recordMock = auditService.record as jest.MockedFunction<
        typeof auditService.record
      >;
      expect(recordMock).not.toHaveBeenCalled();
    });
  });

  describe('Response headers', () => {
    it('should include trace ID in response headers for all requests', async () => {
      const successResponse = await request(app.getHttpServer())
        .get('/test/success')
        .expect(200);

      const errorResponse = await request(app.getHttpServer())
        .get('/test/http-error')
        .expect(400);

      expect(successResponse.headers['x-trace-id']).toBeDefined();
      expect(errorResponse.headers['x-trace-id']).toBeDefined();
      expect(errorResponse.body.traceId).toBe(
        errorResponse.headers['x-trace-id'],
      );
    });

    it('should generate unique trace IDs for different requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/test/success')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/test/success')
        .expect(200);

      expect(response1.headers['x-trace-id']).toBeDefined();
      expect(response2.headers['x-trace-id']).toBeDefined();
      expect(response1.headers['x-trace-id']).not.toBe(
        response2.headers['x-trace-id'],
      );
    });
  });
});
