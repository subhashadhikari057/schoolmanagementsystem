import { Module } from '@nestjs/common';
import { StaffController } from './infrastructure/staff.controller';
import { StaffSalaryController } from './infrastructure/staff-salary.controller';
import { StaffService } from './application/staff.service';
import { StaffSalaryService } from './application/staff-salary.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [StaffController, StaffSalaryController],
  providers: [StaffService, StaffSalaryService],
  exports: [StaffService, StaffSalaryService],
})
export class StaffModule {}
