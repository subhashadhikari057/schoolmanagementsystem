import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ExamDateslotController } from './controllers/exam-dateslot.controller';
import { ExamScheduleController } from './controllers/exam-schedule.controller';
import { ExamTimetableController } from './controllers/exam-timetable.controller';
import { ExamDateslotService } from './services/exam-dateslot.service';
import { ExamScheduleService } from './services/exam-schedule.service';
import { ExamTimetableService } from './services/exam-timetable.service';

@Module({
  controllers: [
    ExamDateslotController,
    ExamScheduleController,
    ExamTimetableController,
  ],
  providers: [
    ExamDateslotService,
    ExamScheduleService,
    ExamTimetableService,
    PrismaService,
  ],
  exports: [ExamDateslotService, ExamScheduleService, ExamTimetableService],
})
export class ExamTimetableModule {}
