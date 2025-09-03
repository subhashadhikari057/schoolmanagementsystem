import { Module } from '@nestjs/common';
import { ClassService } from './application/class.service';
import { ClassController } from './infrastructure/class.controller';
import { ClassSubjectService } from './services/class-subject.service';
import { ClassSubjectController } from './controllers/class-subject.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [ClassController, ClassSubjectController],
  providers: [ClassService, ClassSubjectService, PrismaService, AuditService],
  exports: [ClassService],
})
export class ClassModule {}
