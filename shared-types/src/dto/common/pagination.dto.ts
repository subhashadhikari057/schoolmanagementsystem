/**
 * =============================================================================
 * Pagination DTOs
 * =============================================================================
 * Data Transfer Objects for pagination functionality.
 * =============================================================================
 */

import { z } from 'zod';

/**
 * Pagination request parameters
 */
export interface PaginationRequestDto {
  /** Page number (1-based) */
  page?: number;
  
  /** Number of items per page */
  limit?: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination metadata
 */
export interface PaginationMetaDto {
  /** Current page number */
  page: number;
  
  /** Items per page */
  limit: number;
  
  /** Total number of items */
  total: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there is a next page */
  hasNext: boolean;
  
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponseDto<T> {
  /** Array of items */
  data: T[];
  
  /** Pagination metadata */
  meta: PaginationMetaDto;
}

/**
 * Zod schema for pagination request
 */
export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Type inference from Zod schema
 */
export type PaginationRequestType = z.infer<typeof PaginationRequestSchema>;