/**
 * =============================================================================
 * Error Handling Service
 * =============================================================================
 * Centralized error handling service for consistent error responses across the application.
 * Provides methods for creating and throwing different types of errors with proper structure.
 * =============================================================================
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import {
  ErrorCodes,
  ValidationErrorDetail,
  BusinessLogicErrorDetail,
  AuthErrorDetail,
  DetailedErrorResponseDto,
} from 'shared-types';
import { v4 as uuidv4 } from 'uuid';

export interface BusinessErrorParams {
  statusCode: HttpStatus;
  message: string;
  code: keyof typeof ErrorCodes;
  rule: string;
  context?: Record<string, any>;
  suggestion?: string;
  traceId?: string;
}

export interface ValidationErrorParams {
  validationErrors: ValidationErrorDetail[];
  traceId?: string;
}

export interface AuthErrorParams {
  message: string;
  reason:
    | 'INVALID_CREDENTIALS'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_INVALID'
    | 'INSUFFICIENT_PERMISSIONS'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_DISABLED'
    | '2FA_REQUIRED'
    | '2FA_INVALID';
  remainingAttempts?: number;
  traceId?: string;
}

export interface ConflictErrorParams {
  resource: string;
  field: string;
  value: any;
  traceId?: string;
}

@Injectable()
export class ErrorHandlingService {
  /**
   * Throw a business logic error
   */
  throwBusinessError(params: BusinessErrorParams): never {
    const {
      statusCode,
      message,
      code,
      rule,
      context,
      suggestion,
      traceId = this.generateTraceId(),
    } = params;

    const businessDetail: BusinessLogicErrorDetail = {
      rule,
      context,
      suggestion,
    };

    const errorResponse: DetailedErrorResponseDto = {
      success: false,
      statusCode,
      error: this.getErrorNameFromStatus(statusCode),
      message,
      code: ErrorCodes[code],
      traceId,
      severity: 'high',
      timestamp: new Date().toISOString(),
      details: {
        business: businessDetail,
      },
    };

    throw new HttpException(errorResponse, statusCode);
  }

  /**
   * Throw a validation error
   */
  throwValidationError(params: ValidationErrorParams): never {
    const { validationErrors, traceId = this.generateTraceId() } = params;

    const errorResponse: DetailedErrorResponseDto = {
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      traceId,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      details: {
        validation: validationErrors,
      },
    };

    throw new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
  }

  /**
   * Throw an authentication error
   */
  throwAuthError(params: AuthErrorParams): never {
    const {
      message,
      reason,
      remainingAttempts,
      traceId = this.generateTraceId(),
    } = params;

    const statusCode = HttpStatus.UNAUTHORIZED;
    const authDetail: AuthErrorDetail = {
      reason,
      remainingAttempts,
    };

    const errorResponse: DetailedErrorResponseDto = {
      success: false,
      statusCode,
      error: this.getErrorNameFromStatus(statusCode),
      message,
      code: reason, // Use reason as the error code
      traceId,
      severity: 'high',
      timestamp: new Date().toISOString(),
      details: {
        auth: authDetail,
      },
    };

    throw new HttpException(errorResponse, statusCode);
  }

  /**
   * Throw a not found error
   */
  throwNotFoundError(resource: string, id?: string, traceId?: string): never {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;

    this.throwBusinessError({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      code: 'STUDENT_NOT_FOUND', // This should be dynamic based on resource
      rule: 'RESOURCE_EXISTENCE_CHECK',
      context: id ? { [`${resource.toLowerCase()}Id`]: id } : {},
      suggestion: `Verify the ${resource.toLowerCase()} ID and try again`,
      traceId: traceId || this.generateTraceId(),
    });
  }

  /**
   * Throw a forbidden error
   */
  throwForbiddenError(
    action: string,
    resource: string,
    traceId?: string,
  ): never {
    this.throwAuthError({
      message: `Insufficient permissions to ${action} ${resource}`,
      reason: 'INSUFFICIENT_PERMISSIONS',
      traceId: traceId || this.generateTraceId(),
    });
  }

  /**
   * Throw a conflict error
   */
  throwConflictError(message: string, field: string, traceId?: string): never {
    this.throwBusinessError({
      statusCode: HttpStatus.CONFLICT,
      message,
      code: 'DUPLICATE_ROLL_NUMBER', // This should be dynamic
      rule: 'UNIQUENESS_CONSTRAINT',
      context: { field },
      suggestion: `Use a different ${field} value`,
      traceId: traceId || this.generateTraceId(),
    });
  }

  /**
   * Format validation errors from raw error data
   */
  formatValidationErrors(rawErrors: unknown[]): ValidationErrorDetail[] {
    return rawErrors.map((error: any) => ({
      field: (error.field as string) || 'unknown',
      message: (error.message as string) || 'Validation failed',
      code: ErrorCodes.INVALID_FORMAT,
      value: error.value as unknown,
    }));
  }

  /**
   * Check if an error is a business error
   */
  isBusinessError(error: any): boolean {
    if (!(error instanceof HttpException)) return false;
    const response = error.getResponse();
    if (typeof response !== 'object' || response === null) return false;

    const responseObj = response as Record<string, unknown>;
    return Boolean(
      'details' in responseObj &&
        responseObj.details &&
        typeof responseObj.details === 'object' &&
        responseObj.details !== null &&
        'business' in (responseObj.details as Record<string, unknown>),
    );
  }

  /**
   * Get trace ID from request or generate new one
   */
  getTraceId(request?: unknown): string {
    if (
      request &&
      typeof request === 'object' &&
      request !== null &&
      'traceId' in request
    ) {
      return (request as any).traceId as string;
    }
    return this.generateTraceId();
  }

  /**
   * Create a standardized error response
   */
  createErrorResponse(params: {
    statusCode: HttpStatus;
    message: string;
    code: keyof typeof ErrorCodes;
    traceId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: any;
  }): DetailedErrorResponseDto {
    const {
      statusCode,
      message,
      code,
      traceId = this.generateTraceId(),
      severity = 'medium',
      details,
    } = params;

    return {
      success: false,
      statusCode,
      error: this.getErrorNameFromStatus(statusCode),
      message,
      code: ErrorCodes[code],
      traceId,
      severity,
      timestamp: new Date().toISOString(),
      details,
    };
  }

  /**
   * Generate a unique trace ID
   */
  private generateTraceId(): string {
    return uuidv4();
  }

  /**
   * Get error name from HTTP status code
   */
  private getErrorNameFromStatus(statusCode: HttpStatus): string {
    const statusNames = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };

    return statusNames[statusCode] ?? 'Error';
  }
}
