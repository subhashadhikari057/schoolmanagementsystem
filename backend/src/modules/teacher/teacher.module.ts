// src/modules/teacher/teacher.module.ts

import { Module } from '@nestjs/common';
import { TeacherController } from './infrastructure/teacher.controller';
import { TeacherSalaryController } from './infrastructure/teacher-salary.controller';
import { TeacherService } from './application/teacher.service';
import { TeacherSalaryService } from './application/teacher-salary.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [TeacherController, TeacherSalaryController],
  providers: [TeacherService, TeacherSalaryService, PrismaService],
})
export class TeacherModule {}
