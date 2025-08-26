import { Module } from '@nestjs/common';
import { LeaveRequestController } from './infrastructure/leave-request.controller';
import { LeaveUsageController } from './infrastructure/leave-usage.controller';
import { LeaveRequestService } from './application/leave-request.service';
import { LeaveRequestAttachmentService } from './application/leave-request-attachment.service';
import { TeacherLeaveUsageService } from './application/teacher-leave-usage.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [LeaveRequestController, LeaveUsageController],
  providers: [
    LeaveRequestService,
    LeaveRequestAttachmentService,
    TeacherLeaveUsageService,
    PrismaService,
    AuditService,
  ],
  exports: [
    LeaveRequestService,
    LeaveRequestAttachmentService,
    TeacherLeaveUsageService,
  ],
})
export class LeaveRequestModule {}
