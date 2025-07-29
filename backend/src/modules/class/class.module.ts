import { Module } from '@nestjs/common';
import { ClassService } from './application/class.service';
import { ClassController } from './infrastructure/class.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [ClassController],
  providers: [ClassService, PrismaService, AuditService],
})
export class ClassModule {}

