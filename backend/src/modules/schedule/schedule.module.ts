import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TimeslotController } from './controllers/timeslot.controller';
import { ClassTimeslotController } from './controllers/class-timeslot.controller';
import { TimeslotService } from './services/timeslot.service';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleService } from './services/schedule.service';

@Module({
  controllers: [
    TimeslotController,
    ClassTimeslotController,
    ScheduleController,
  ],
  providers: [TimeslotService, ScheduleService, PrismaService],
  exports: [TimeslotService, ScheduleService],
})
export class ScheduleModule {}
