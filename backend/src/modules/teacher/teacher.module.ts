// src/modules/teacher/teacher.module.ts

import { Module } from '@nestjs/common';
import { TeacherController } from './infrastructure/teacher.controller';
import { TeacherService } from './application/teacher.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [TeacherController],
  providers: [TeacherService, PrismaService],
})
export class TeacherModule {}
