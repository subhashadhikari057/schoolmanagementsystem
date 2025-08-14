import { Module } from '@nestjs/common';
import { AttendanceController } from './infrastructure/attendance.controller';
import { AttendanceService } from './application/attendance.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AuditService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
