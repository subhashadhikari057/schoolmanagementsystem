/**
 * Audit DTOs for School Management System
 * DTOs for audit log operations and queries
 */

import { z } from 'zod';

/**
 * Schema for creating an audit log entry
 */
export const CreateAuditLogSchema = z.object({
  userId: z.string().optional(),
  action: z.string().min(1, 'Action is required'),
  module: z.string().optional(),
  status: z.string().default('SUCCESS'),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  traceId: z.string().optional(),
  sessionId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  executionTime: z.number().optional(),
  errorMessage: z.string().optional(),
  severity: z.string().optional(),
});

/**
 * Schema for querying audit logs
 */
export const AuditLogQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  module: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
  traceId: z.string().optional(),
  sessionId: z.string().optional(),
  resourceType: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for audit log response
 */
export const AuditLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  module: z.string().nullable(),
  status: z.string(),
  details: z.record(z.any()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  timestamp: z.string().datetime(),
  traceId: z.string().nullable(),
  sessionId: z.string().nullable(),
  resourceId: z.string().nullable(),
  resourceType: z.string().nullable(),
  endpoint: z.string().nullable(),
  method: z.string().nullable(),
  statusCode: z.number().nullable(),
  executionTime: z.number().nullable(),
  errorMessage: z.string().nullable(),
  severity: z.string().nullable(),
});

/**
 * Schema for audit statistics
 */
export const AuditStatsSchema = z.object({
  totalLogs: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  errorCount: z.number(),
  uniqueUsers: z.number(),
  topActions: z.array(z.object({
    action: z.string(),
    count: z.number(),
  })),
  topModules: z.array(z.object({
    module: z.string(),
    count: z.number(),
  })),
  timeRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
});

/**
 * Type exports
 */
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
export type AuditLogQueryDto = z.infer<typeof AuditLogQuerySchema>;
export type AuditLogResponseDto = z.infer<typeof AuditLogResponseSchema>;
export type AuditStatsDto = z.infer<typeof AuditStatsSchema>;