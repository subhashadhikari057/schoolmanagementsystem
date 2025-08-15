import { Module } from '@nestjs/common';
import { ParentController } from './infrastructure/parent.controller';
import { ParentService } from './application/parent.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [ParentController],
  providers: [ParentService, PrismaService, AuditService],
  exports: [ParentService],
})
export class ParentModule {}
