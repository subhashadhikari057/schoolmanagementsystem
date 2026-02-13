import { Module } from '@nestjs/common';
import { LeaveRequestController } from './infrastructure/leave-request.controller';
import { LeaveUsageController } from './infrastructure/leave-usage.controller';
import { LeaveCreditController } from './infrastructure/leave-credit.controller';
import { LeaveRequestService } from './application/leave-request.service';
import { LeaveRequestAttachmentService } from './application/leave-request-attachment.service';
import { TeacherLeaveUsageService } from './application/teacher-leave-usage.service';
import { TeacherLeaveCreditService } from './application/teacher-leave-credit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [
    LeaveRequestController,
    LeaveUsageController,
    LeaveCreditController,
  ],
  providers: [
    LeaveRequestService,
    LeaveRequestAttachmentService,
    TeacherLeaveUsageService,
    TeacherLeaveCreditService,
    PrismaService,
    AuditService,
  ],
  exports: [
    LeaveRequestService,
    LeaveRequestAttachmentService,
    TeacherLeaveUsageService,
    TeacherLeaveCreditService,
  ],
})
export class LeaveRequestModule {}
