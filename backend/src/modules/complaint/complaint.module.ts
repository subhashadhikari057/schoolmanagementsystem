import { Module } from '@nestjs/common';
import { ComplaintController } from './infrastructure/complaint.controller';
import { ComplaintResponseController } from './infrastructure/complaint-response.controller';
import { ComplaintService } from './application/complaint.service';
import { ComplaintResponseService } from './application/complaint-response.service';
import { ComplaintAttachmentService } from './application/complaint-attachment.service';
import { ComplaintAccessGuard } from './guards/complaint-access.guard';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [ComplaintController, ComplaintResponseController],
  providers: [
    ComplaintService,
    ComplaintResponseService,
    ComplaintAttachmentService,
    ComplaintAccessGuard,
    PrismaService,
    AuditService,
  ],
  exports: [
    ComplaintService,
    ComplaintResponseService,
    ComplaintAttachmentService,
  ],
})
export class ComplaintModule {}
