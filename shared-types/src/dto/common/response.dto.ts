/**
 * =============================================================================
 * Response DTOs
 * =============================================================================
 * Standard response structures for all API endpoints.
 * =============================================================================
 */

import { z } from "zod";

/**
 * Standard API success response
 */
export interface ApiSuccessResponseDto<T = any> {
  /** Whether the request was successful */
  success: true;

  /** Response data */
  data: T;

  /** Optional success message */
  message?: string;

  /** HTTP status code */
  statusCode: number;

  /** Request trace ID for debugging */
  traceId?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponseDto {
  /** Whether the request was successful */
  success: false;

  /** HTTP status code */
  statusCode: number;

  /** Error type */
  error: string;

  /** Human-readable error message */
  message: string;

  /** Machine-readable error code */
  code?: string;

  /** Request trace ID */
  traceId?: string;

  /** Validation errors (if applicable) */
  errors?: Record<string, string[]>;
}

/**
 * Union type for all API responses
 */
export type ApiResponseDto<T = any> =
  | ApiSuccessResponseDto<T>
  | ApiErrorResponseDto;

/**
 * Zod schema for success response
 */
export const ApiSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    statusCode: z.number(),
    traceId: z.string().optional(),
  });

/**
 * Zod schema for error response
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  traceId: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode = 200,
  message?: string,
  traceId?: string,
): ApiSuccessResponseDto<T> {
  const response: ApiSuccessResponseDto<T> = {
    success: true,
    data,
    statusCode,
  };

  if (message !== undefined) {
    response.message = message;
  }

  if (traceId !== undefined) {
    response.traceId = traceId;
  }

  return response;
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(
  statusCode: number,
  error: string,
  message: string,
  code?: string,
  traceId?: string,
  errors?: Record<string, string[]>,
): ApiErrorResponseDto {
  const response: ApiErrorResponseDto = {
    success: false,
    statusCode,
    error,
    message,
  };

  if (code !== undefined) {
    response.code = code;
  }

  if (traceId !== undefined) {
    response.traceId = traceId;
  }

  if (errors !== undefined) {
    response.errors = errors;
  }

  return response;
}
