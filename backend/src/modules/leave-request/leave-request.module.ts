import { Module } from '@nestjs/common';
import { LeaveRequestController } from './infrastructure/leave-request.controller';
import { LeaveRequestService } from './application/leave-request.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService, PrismaService, AuditService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
