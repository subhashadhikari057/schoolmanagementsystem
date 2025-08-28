/**
 * =============================================================================
 * Attendance Module
 * =============================================================================
 * Module configuration for attendance management functionality
 * =============================================================================
 */

import { Module } from '@nestjs/common';
import { AttendanceController } from './infrastructure/attendance.controller';
import { TeacherAttendanceController } from './infrastructure/teacher-attendance.controller';
import { StaffAttendanceController } from './infrastructure/staff-attendance.controller';
import { AttendanceService } from './application/attendance.service';
import { TeacherAttendanceService } from './application/teacher-attendance.service';
import { StaffAttendanceService } from './application/staff-attendance.service';
import { WorkingDaysService } from './application/working-days.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AttendanceController,
    TeacherAttendanceController,
    StaffAttendanceController,
  ],
  providers: [
    AttendanceService,
    TeacherAttendanceService,
    StaffAttendanceService,
    WorkingDaysService,
    AuditService,
  ],
  exports: [
    AttendanceService,
    TeacherAttendanceService,
    StaffAttendanceService,
    WorkingDaysService,
  ],
})
export class AttendanceModule {}
