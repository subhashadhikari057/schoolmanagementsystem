// backend/src/shared/logger/audit.module.ts

import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { EnhancedAuditService } from './enhanced-audit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AuditService, // Keep legacy service for backward compatibility
    EnhancedAuditService, // New enhanced service
    {
      provide: 'AUDIT_SERVICE',
      useExisting: EnhancedAuditService,
    },
  ],
  exports: [AuditService, EnhancedAuditService, 'AUDIT_SERVICE'],
})
export class AuditModule {}
