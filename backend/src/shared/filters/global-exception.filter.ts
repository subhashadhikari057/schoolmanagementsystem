// backend/src/shared/filters/global-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ThrottlerException } from '@nestjs/throttler';
import {
  DetailedErrorResponseDto,
  createErrorResponse,
  createValidationErrorResponse,
  createRateLimitErrorResponse,
  ErrorCodes,
  ValidationErrorDetail,
} from '@sms/shared-types';
import { AuditService } from '../logger/audit.service';

/**
 * Global exception filter that standardizes all error responses
 * Implements the error handling format defined in Pre-Documents/Dev docs/5. API Contract Documentation
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly auditService: AuditService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = (request as any).traceId as string;

    // Build request context for error response
    const context = {
      userId: (request as any).user?.id as string | undefined,
      userRole: (request as any).user?.role as string | undefined,
      endpoint: request.url,
      method: request.method as
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'PATCH'
        | 'DELETE'
        | undefined,
      userAgent: request.get('User-Agent'),
      ip: this.getClientIp(request),
      requestId: traceId,
    };

    let errorResponse: DetailedErrorResponseDto;

    try {
      errorResponse = this.handleException(exception, traceId, context);
    } catch (handlingError) {
      // Fallback error response if error handling itself fails
      this.logger.error('Error handling failed', handlingError);
      errorResponse = this.createFallbackErrorResponse(traceId, context);
    }

    // Log the error for monitoring
    this.logError(exception, errorResponse, request);

    // Record audit trail for significant errors
    this.recordAuditTrail(exception, errorResponse, request).catch(
      auditError => {
        this.logger.error('Failed to record audit trail', auditError);
      },
    );

    // Send standardized error response
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Handle different types of exceptions and convert to standardized format
   */
  private handleException(
    exception: unknown,
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    // Handle Zod validation errors
    if (exception instanceof ZodError) {
      return this.handleZodError(exception, traceId, context);
    }

    // Handle NestJS throttler (rate limiting) errors
    if (exception instanceof ThrottlerException) {
      return this.handleThrottlerError(exception, traceId, context);
    }

    // Handle standard HTTP exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, traceId, context);
    }

    // Handle Prisma database errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception, traceId, context);
    }

    // Handle unknown errors
    return this.handleUnknownError(exception, traceId, context);
  }

  /**
   * Handle Zod validation errors
   */
  private handleZodError(
    error: ZodError,
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    const validationErrors: ValidationErrorDetail[] = error.errors.map(err => ({
      field: err.path.join('.'),
      value: ((err as any).input as unknown) || undefined,
      message: err.message,
      code: this.mapZodErrorToCode(err.code),
    }));

    const result = createValidationErrorResponse({
      message: 'Validation failed',
      validationErrors,
      traceId,
    });

    return result;
  }

  /**
   * Handle rate limiting errors
   */
  private handleThrottlerError(
    error: ThrottlerException,
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    const message = `Rate limit exceeded. Try again in 60 seconds.`;
    const result = createRateLimitErrorResponse({
      limit: 100, // Default values
      remaining: 0,
      resetTime: new Date(Date.now() + 60000).toISOString(),
      retryAfter: 60,
      traceId,
    });

    return result;
  }

  /**
   * Handle standard HTTP exceptions
   */
  private handleHttpException(
    exception: HttpException,
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message = exception.message;
    let code: keyof typeof ErrorCodes = this.mapStatusToErrorCode(status);
    let details: any;

    // Extract additional information from exception response
    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      message = (responseObj.message as string) || message;
      if (responseObj.code) {
        code = responseObj.code as keyof typeof ErrorCodes;
      }
      details = responseObj.details;
    }

    return createErrorResponse({
      statusCode: status,
      error: this.getHttpStatusText(status),
      message,
      code,
      details,
      traceId,
    });
  }

  /**
   * Handle Prisma database errors
   */
  private handlePrismaError(
    error: any,
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';
    let code: keyof typeof ErrorCodes = 'INTERNAL_SERVER_ERROR';

    // Handle specific Prisma error codes
    const errorCode = error.code as string;
    if (errorCode === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      message = 'A record with this information already exists';
      code = 'DUPLICATE_VALUE' as keyof typeof ErrorCodes;
    } else if (errorCode === 'P2025') {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'The requested record was not found';
      code = 'STUDENT_NOT_FOUND' as keyof typeof ErrorCodes;
    } else if (errorCode === 'P2003') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint violation';
      code = 'VALIDATION_ERROR' as keyof typeof ErrorCodes;
    }

    const dbDetails = {
      operation: undefined,
      constraint: error.meta?.constraint as string,
    };

    return createErrorResponse({
      statusCode,
      error: this.getHttpStatusText(statusCode),
      message,
      code,
      details: { database: dbDetails },
      traceId,
    });
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: unknown,
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    const result = createErrorResponse({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message,
      code: 'INTERNAL_SERVER_ERROR' as keyof typeof ErrorCodes,
      traceId,
    });

    // Add stack trace only in development
    if (process.env.NODE_ENV === 'development') {
      (result as any).stack = error instanceof Error ? error.stack : undefined;
    }

    return result;
  }

  /**
   * Create fallback error response when error handling fails
   */
  private createFallbackErrorResponse(
    traceId: string,
    context: any,
  ): DetailedErrorResponseDto {
    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the request',
      code: 'INTERNAL_SERVER_ERROR',
      traceId,
      timestamp: new Date().toISOString(),
      severity: 'critical',
    } as DetailedErrorResponseDto;
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(
    exception: unknown,
    errorResponse: DetailedErrorResponseDto,
    request: Request,
  ): void {
    const logContext = {
      traceId: errorResponse.traceId,
      statusCode: errorResponse.statusCode,
      code: errorResponse.code,
      endpoint: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: this.getClientIp(request),
      userId: (request as any).user?.id,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `${errorResponse.message}`,
        exception instanceof Error ? exception.stack : String(exception),
        logContext,
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(`${errorResponse.message}`, logContext);
    }
  }

  /**
   * Record audit trail for significant errors
   */
  private async recordAuditTrail(
    exception: unknown,
    errorResponse: DetailedErrorResponseDto,
    request: Request,
  ): Promise<void> {
    // Only record audit trails for significant errors or security-related issues
    if (
      errorResponse.statusCode === 401 ||
      errorResponse.statusCode === 403 ||
      errorResponse.statusCode >= 500 ||
      errorResponse.code === 'RATE_LIMIT_EXCEEDED'
    ) {
      await this.auditService.record({
        userId: (request as any).user?.id as string,
        action: 'ERROR_OCCURRED',
        module: 'ERROR_HANDLER',
        status: 'FAIL',
        ipAddress: this.getClientIp(request),
        userAgent: request.get('User-Agent'),
        details: {
          traceId: errorResponse.traceId,
          statusCode: errorResponse.statusCode,
          code: errorResponse.code,
          endpoint: request.url,
          method: request.method,
          message: errorResponse.message,
        },
      });
    }
  }

  /**
   * Helper methods
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers?.['x-forwarded-for'] as string;
    const connectionRemote = (request as any).connection
      ?.remoteAddress as string;
    const socketRemote = (request as any).socket?.remoteAddress as string;

    return (
      forwardedFor?.split(',')[0] ||
      connectionRemote ||
      socketRemote ||
      'unknown'
    );
  }

  private isPrismaError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as any).code === 'string' &&
      ((error as any).code as string).startsWith('P')
    );
  }

  private mapZodErrorToCode(zodCode: string): string {
    const mapping: Record<string, string> = {
      invalid_type: 'VALIDATION_ERROR',
      too_small: 'VALIDATION_ERROR',
      too_big: 'VALIDATION_ERROR',
      invalid_string: 'VALIDATION_ERROR',
      invalid_email: 'VALIDATION_ERROR',
      invalid_uuid: 'VALIDATION_ERROR',
      invalid_date: 'VALIDATION_ERROR',
    };
    return mapping[zodCode] || 'VALIDATION_ERROR';
  }

  private mapStatusToErrorCode(status: number): keyof typeof ErrorCodes {
    const statusCodes: Record<number, keyof typeof ErrorCodes> = {
      400: 'VALIDATION_ERROR' as keyof typeof ErrorCodes,
      401: 'TOKEN_INVALID' as keyof typeof ErrorCodes,
      403: 'INSUFFICIENT_PERMISSIONS' as keyof typeof ErrorCodes,
      404: 'STUDENT_NOT_FOUND' as keyof typeof ErrorCodes,
      409: 'DUPLICATE_VALUE' as keyof typeof ErrorCodes,
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return statusCodes[status] || 'INTERNAL_SERVER_ERROR';
  }

  private getHttpStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statusTexts[status] || 'Unknown Error';
  }

  private getErrorSeverity(
    statusCode: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'medium';
    return 'low';
  }
}
