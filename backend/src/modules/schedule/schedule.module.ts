import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TimeslotController } from './controllers/timeslot.controller';
import { ClassTimeslotController } from './controllers/class-timeslot.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { TimetableController } from './controllers/timetable.controller';
import { TimeslotService } from './services/timeslot.service';
import { ScheduleService } from './services/schedule.service';
import { TimetableService } from './services/timetable.service';

@Module({
  controllers: [
    TimeslotController,
    ClassTimeslotController,
    ScheduleController,
    TimetableController,
  ],
  providers: [
    TimeslotService,
    ScheduleService,
    TimetableService,
    PrismaService,
  ],
  exports: [TimeslotService, ScheduleService, TimetableService],
})
export class ScheduleModule {}
