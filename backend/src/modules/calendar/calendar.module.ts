// src/modules/calendar/calendar.module.ts

import { Module } from '@nestjs/common';
import { CalendarController } from './infrastructure/calendar.controller';
import { CalendarService } from './application/calendar.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Module({
  imports: [],
  controllers: [CalendarController],
  providers: [CalendarService, PrismaService],
  exports: [CalendarService], // Export service for use in other modules
})
export class CalendarModule {}
