/**
 * =============================================================================
 * Attendance Module
 * =============================================================================
 * Module configuration for attendance management functionality
 * =============================================================================
 */

import { Module } from '@nestjs/common';
import { AttendanceController } from './infrastructure/attendance.controller';
import { AttendanceService } from './application/attendance.service';
import { WorkingDaysService } from './application/working-days.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, WorkingDaysService, AuditService],
  exports: [AttendanceService, WorkingDaysService],
})
export class AttendanceModule {}
