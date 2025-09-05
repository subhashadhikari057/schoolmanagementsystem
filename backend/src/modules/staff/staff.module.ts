import { Module } from '@nestjs/common';
import { StaffController } from './infrastructure/staff.controller';
import { StaffSalaryController } from './infrastructure/staff-salary.controller';
import { StaffImportController } from './infrastructure/staff-import.controller';
import { StaffService } from './application/staff.service';
import { StaffSalaryService } from './application/staff-salary.service';
import { StaffImportService } from './application/staff-import.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [StaffController, StaffSalaryController, StaffImportController],
  providers: [StaffService, StaffSalaryService, StaffImportService],
  exports: [StaffService, StaffSalaryService, StaffImportService],
})
export class StaffModule {}
