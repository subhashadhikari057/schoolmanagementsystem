import { Module } from '@nestjs/common';
import { AttendanceController } from './infrastructure/attendance.controller';
import { AttendanceService } from './application/attendance.service';
import { ClassTeacherService } from './application/class-teacher.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/logger/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, ClassTeacherService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
