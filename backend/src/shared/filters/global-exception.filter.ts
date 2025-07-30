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
} from 'shared-types';
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
      method: request.method,
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
    context: DetailedErrorResponseDto['context'],
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
    context: DetailedErrorResponseDto['context'],
  ): DetailedErrorResponseDto {
    const validationErrors: ValidationErrorDetail[] = error.errors.map(err => ({
      field: err.path.join('.'),
      value: ((err as any).input as unknown) || undefined,
      message: err.message,
      code: this.mapZodErrorToCode(err.code),
    }));

    return {
      ...createValidationErrorResponse({
        message: 'Request validation failed',
        validationErrors,
        traceId,
      }),
      context,
    };
  }

  /**
   * Handle rate limiting errors
   */
  private handleThrottlerError(
    error: ThrottlerException,
    traceId: string,
    context: DetailedErrorResponseDto['context'],
  ): DetailedErrorResponseDto {
    const resetTime = new Date(Date.now() + 60000).toISOString(); // 1 minute from now

    return {
      ...createRateLimitErrorResponse({
        limit: 100, // Default limit - should be configurable
        remaining: 0,
        resetTime,
        retryAfter: 60,
        traceId,
      }),
      context,
    };
  }

  /**
   * Handle standard HTTP exceptions
   */
  private handleHttpException(
    exception: HttpException,
    traceId: string,
    context: DetailedErrorResponseDto['context'],
  ): DetailedErrorResponseDto {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message = exception.message;
    let code: string | undefined;
    let details: DetailedErrorResponseDto['details'];

    // Extract additional information from exception response
    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      message = (responseObj.message as string) || message;
      code = responseObj.code as string;
      details = responseObj.details as DetailedErrorResponseDto['details'];
    }

    return {
      ...createErrorResponse({
        statusCode: status,
        error: this.getHttpStatusText(status),
        message,
        code: code as any,
        traceId,
        severity: this.getErrorSeverity(status),
        details,
      }),
      context,
    };
  }

  /**
   * Handle Prisma database errors
   */
  private handlePrismaError(
    error: any,
    traceId: string,
    context: DetailedErrorResponseDto['context'],
  ): DetailedErrorResponseDto {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';
    let code: string = ErrorCodes.DATABASE_CONNECTION_FAILED;

    // Handle specific Prisma error codes
    const errorCode = error.code as string;
    if (errorCode === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      message = 'A record with this information already exists';
      code = ErrorCodes.DUPLICATE_VALUE;
    } else if (errorCode === 'P2025') {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'The requested record was not found';
      code = ErrorCodes.STUDENT_NOT_FOUND; // Generic - should be more specific based on context
    } else if (errorCode === 'P2003') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint violation';
      code = ErrorCodes.DATABASE_CONSTRAINT_VIOLATION;
    }

    return {
      ...createErrorResponse({
        statusCode,
        error: this.getHttpStatusText(statusCode),
        message,
        code: code as any,
        traceId,
        severity: 'high',
        details: {
          database: {
            operation: undefined,
            constraint: error.meta?.constraint as string,
          },
        },
      }),
      context,
    };
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: unknown,
    traceId: string,
    context: DetailedErrorResponseDto['context'],
  ): DetailedErrorResponseDto {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return {
      ...createErrorResponse({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        traceId,
        severity: 'critical',
      }),
      context,
      // Include stack trace only in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }

  /**
   * Create fallback error response when error handling fails
   */
  private createFallbackErrorResponse(
    traceId: string,
    context: DetailedErrorResponseDto['context'],
  ): DetailedErrorResponseDto {
    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the request',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      traceId,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      context,
    };
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
        `${errorResponse.error}: ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : String(exception),
        logContext,
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(
        `${errorResponse.error}: ${errorResponse.message}`,
        logContext,
      );
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
      errorResponse.code === ErrorCodes.RATE_LIMIT_EXCEEDED
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
      invalid_type: ErrorCodes.INVALID_FORMAT,
      too_small: ErrorCodes.VALUE_TOO_SHORT,
      too_big: ErrorCodes.VALUE_TOO_LONG,
      invalid_string: ErrorCodes.INVALID_FORMAT,
      invalid_email: ErrorCodes.INVALID_EMAIL,
      invalid_uuid: ErrorCodes.INVALID_UUID,
      invalid_date: ErrorCodes.INVALID_DATE,
    };
    return mapping[zodCode] || ErrorCodes.INVALID_FORMAT;
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
