import { Module } from '@nestjs/common';
import { StaffController } from './infrastructure/staff.controller';
import { StaffService } from './application/staff.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
