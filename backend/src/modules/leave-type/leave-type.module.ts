import { Module } from '@nestjs/common';
import { LeaveTypeController } from './infrastructure/leave-type.controller';
import { LeaveTypeService } from './application/leave-type.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [LeaveTypeController],
  providers: [LeaveTypeService, PrismaService],
  exports: [LeaveTypeService],
})
export class LeaveTypeModule {}
