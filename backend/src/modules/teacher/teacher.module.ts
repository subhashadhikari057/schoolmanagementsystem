// src/modules/teacher/teacher.module.ts

import { Module } from '@nestjs/common';
import { TeacherController } from './infrastructure/teacher.controller';
import { TeacherImportController } from './infrastructure/teacher-import.controller';
import { TeacherSalaryController } from './infrastructure/teacher-salary.controller';
import { TeacherService } from './application/teacher.service';
import { TeacherImportService } from './application/teacher-import.service';
import { TeacherSalaryService } from './application/teacher-salary.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';
import { SubjectModule } from '../subject/subject.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [LoggerModule, SubjectModule, ClassModule],
  controllers: [
    TeacherController,
    TeacherImportController,
    TeacherSalaryController,
  ],
  providers: [
    TeacherService,
    TeacherImportService,
    TeacherSalaryService,
    PrismaService,
  ],
  exports: [TeacherService, TeacherImportService],
})
export class TeacherModule {}
