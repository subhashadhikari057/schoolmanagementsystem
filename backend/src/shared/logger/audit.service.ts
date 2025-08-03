// backend/src/shared/logger/audit.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

interface RecordAuditOptions {
  userId?: string;
  action: string;
  module?: string;
  status?: 'SUCCESS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  details?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(options: RecordAuditOptions): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: options.action,
          module: options.module ?? 'SYSTEM',
          status: options.status ?? 'SUCCESS',
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          traceId: options.traceId || null,
          details: options.details
            ? JSON.parse(JSON.stringify(options.details))
            : null,
        },
      });
    } catch (error) {
      console.error('[AuditService] Failed to record audit log:', error);
    }
  }
}
