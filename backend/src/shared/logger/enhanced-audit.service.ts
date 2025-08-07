// backend/src/shared/logger/enhanced-audit.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditAction, AuditModule, AuditStatus } from '@sms/shared-types';

// Simple interfaces for audit operations
interface CreateAuditLogDto {
  userId?: string;
  action: string;
  module?: string;
  status?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  sessionId?: string;
  resourceId?: string;
  resourceType?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  executionTime?: number;
  errorMessage?: string;
  severity?: string;
  duration?: number;
  errorCode?: string;
}

interface AuditLogQueryDto {
  userId?: string;
  action?: string;
  module?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  traceId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AuditLogResponseDto {
  id: string;
  userId: string | null;
  action: string;
  module: string | null;
  status: string;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  traceId: string | null;
  sessionId: string | null;
  resourceId: string | null;
  resourceType: string | null;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  executionTime: number | null;
  errorMessage: string | null;
  severity: string | null;
  user?: { id: string; email: string; fullName: string } | null;
}

interface AuditStatsDto {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  errorCount: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topModules: Array<{ module: string; count: number }>;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  recentActivity?: AuditLogResponseDto[];
}
import { randomUUID } from 'crypto';

export interface AuditContext {
  userId?: string;
  traceId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  statusCode?: number;
  duration?: number;
  resourceId?: string;
  resourceType?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class EnhancedAuditService {
  private readonly logger = new Logger(EnhancedAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a comprehensive audit log entry
   */
  async record(
    action: AuditAction,
    module: AuditModule,
    status: AuditStatus = AuditStatus.SUCCESS,
    context: AuditContext = {},
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const auditData: CreateAuditLogDto = {
        action,
        module,
        status,
        userId: context.userId,
        traceId: context.traceId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode,
        duration: context.duration,
        resourceId: context.resourceId,
        resourceType: context.resourceType,
        errorCode: context.errorCode,
        errorMessage: context.errorMessage,
        details: details ? this.sanitizeDetails(details) : undefined,
      };

      // Clean up undefined values for Prisma while preserving required fields
      // Only include fields that exist in the AuditLog model
      const cleanAuditData: any = {
        // Required fields (always include)
        action,
        module,
        status,
        // Optional fields (only if defined and exist in schema)
        ...(auditData.userId && { userId: auditData.userId }),
        ...(auditData.ipAddress && { ipAddress: auditData.ipAddress }),
        ...(auditData.userAgent && { userAgent: auditData.userAgent }),
        ...(auditData.details && { details: auditData.details }),
      };

      await this.prisma.auditLog.create({
        data: cleanAuditData,
      });

      // Log high-priority events for monitoring
      if (this.isHighPriorityEvent(action, status)) {
        this.logger.warn(`High-priority audit event: ${action} - ${status}`, {
          userId: context.userId,
          traceId: context.traceId,
          module,
        });
      }
    } catch (error) {
      this.logger.error('Failed to record audit log', error, {
        action,
        module,
        userId: context.userId,
        traceId: context.traceId,
      });
    }
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async query(query: AuditLogQueryDto): Promise<{
    logs: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      action,
      module,
      status,
      startDate,
      endDate,
      ipAddress,
      resourceId,
      resourceType,
      traceId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (module) where.module = module;
    if (status) where.status = status;
    if (ipAddress) where.ipAddress = ipAddress;
    if (resourceId) where.resourceId = resourceId;
    if (resourceType) where.resourceType = resourceType;
    if (traceId) where.traceId = traceId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy || 'timestamp']: sortOrder,
        },
        skip: ((page || 1) - 1) * (limit || 20),
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs as unknown as AuditLogResponseDto[],
      total,
      page: page || 1,
      limit: limit || 20,
      totalPages: Math.ceil(total / (limit || 20)),
    };
  }

  /**
   * Get audit statistics for dashboard
   */
  async getStats(
    startDate?: Date,
    endDate?: Date,
    userId?: string,
  ): Promise<AuditStatsDto> {
    const where: any = {};

    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [
      totalLogs,
      successCount,
      failureCount,
      errorCount,
      uniqueUsers,
      topActions,
      topModules,
      recentActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({
        where: { ...where, status: AuditStatus.SUCCESS },
      }),
      this.prisma.auditLog.count({
        where: { ...where, status: AuditStatus.FAILURE },
      }),
      this.prisma.auditLog.count({
        where: { ...where, status: AuditStatus.ERROR },
      }),
      this.prisma.auditLog
        .findMany({
          where,
          select: { userId: true },
          distinct: ['userId'],
        })
        .then(results => results.filter(r => r.userId).length),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['module'],
        where,
        _count: { module: true },
        orderBy: { _count: { module: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      errorCount,
      uniqueUsers,
      topActions: topActions.map(item => ({
        action: item.action as AuditAction,
        count: item._count.action,
      })),
      topModules: topModules.map(item => ({
        module: item.module as AuditModule,
        count: item._count.module,
      })),
      recentActivity: recentActivity as unknown as AuditLogResponseDto[],
      timeRange: {
        startDate:
          (startDate instanceof Date ? startDate.toISOString() : startDate) ||
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (endDate instanceof Date ? endDate.toISOString() : endDate) ||
          new Date().toISOString(),
      },
    };
  }

  /**
   * Audit specific user actions
   */
  async auditUserAction(
    userId: string,
    action: AuditAction,
    module: AuditModule,
    context: Omit<AuditContext, 'userId'> = {},
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.record(
      action,
      module,
      AuditStatus.SUCCESS,
      { ...context, userId },
      details,
    );
  }

  /**
   * Audit authentication events
   */
  async auditAuth(
    action: AuditAction,
    userId: string | undefined,
    context: AuditContext = {},
    success: boolean = true,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.record(
      action,
      AuditModule.AUTH,
      success ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
      { ...context, userId },
      details,
    );
  }

  /**
   * Audit security events
   */
  async auditSecurity(
    action: AuditAction,
    context: AuditContext = {},
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.record(
      action,
      AuditModule.SECURITY,
      AuditStatus.WARNING,
      context,
      details,
    );
  }

  /**
   * Audit error events
   */
  async auditError(
    action: AuditAction,
    module: AuditModule,
    context: AuditContext = {},
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.record(action, module, AuditStatus.ERROR, context, details);
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Cleaned up ${result.count} audit logs older than ${retentionDays} days`,
    );
    return result.count;
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    query: AuditLogQueryDto,
    format: 'json' | 'csv' = 'json',
  ): Promise<string> {
    const { logs } = await this.query({ ...query, limit: 10000 }); // Max export limit

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Private helper methods
   */
  private sanitizeDetails(
    details: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'hash',
      'salt',
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private isHighPriorityEvent(
    action: AuditAction,
    status: AuditStatus,
  ): boolean {
    const highPriorityActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.PERMISSION_DENIED,
      AuditAction.SECURITY_VIOLATION,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.RATE_LIMIT_EXCEEDED,
    ];

    const highPriorityStatuses = [
      AuditStatus.FAILURE,
      AuditStatus.ERROR,
      AuditStatus.BLOCKED,
    ];

    return (
      highPriorityActions.includes(action) ||
      highPriorityStatuses.includes(status)
    );
  }

  private convertToCSV(logs: AuditLogResponseDto[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'timestamp',
      'userId',
      'userEmail',
      'action',
      'module',
      'status',
      'ipAddress',
      'userAgent',
      'endpoint',
      'method',
      'statusCode',
      'traceId',
    ];

    const rows = logs.map(log => [
      log.timestamp,
      log.userId || '',
      log.user?.email || '',
      log.action,
      log.module || '',
      log.status,
      log.ipAddress || '',
      log.userAgent || '',
      log.endpoint || '',
      log.method || '',
      log.statusCode || '',
      log.traceId || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
