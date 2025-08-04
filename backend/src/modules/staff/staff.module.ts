// src/modules/staff/staff.module.ts

import { Module } from '@nestjs/common';
import { StaffController } from './infrastructure/staff.controller';
import { StaffService } from './application/staff.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [StaffController],
  providers: [StaffService, PrismaService],
  exports: [StaffService], // Export service for other modules to use
})
export class StaffModule {}
