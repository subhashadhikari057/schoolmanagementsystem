import { Module } from '@nestjs/common';
import { NoticeController } from './infrastructure/notice.controller';
import { NoticeService } from './application/notice.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [NoticeController],
  providers: [NoticeService, PrismaService, AuditService],
  exports: [NoticeService],
})
export class NoticeModule {}
