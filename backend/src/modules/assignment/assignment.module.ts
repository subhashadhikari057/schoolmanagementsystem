import { Module } from '@nestjs/common';
import { AssignmentService } from './application/assignment.service';
import { SubmissionService } from './application/submission.service';
import { AssignmentAttachmentService } from './application/assignment-attachment.service';
import { SubmissionAttachmentService } from './application/submission-attachment.service';
import { AssignmentController } from './infrastructure/assignment.controller';
import { SubmissionController } from './infrastructure/submission.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [AssignmentController, SubmissionController],
  providers: [
    AssignmentService,
    SubmissionService,
    AssignmentAttachmentService,
    SubmissionAttachmentService,
    PrismaService,
    AuditService,
  ],
  exports: [
    AssignmentService,
    SubmissionService,
    AssignmentAttachmentService,
    SubmissionAttachmentService,
  ],
})
export class AssignmentModule {}
