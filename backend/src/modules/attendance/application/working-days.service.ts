/**
 * =============================================================================
 * Working Days Service
 * =============================================================================
 * Service to calculate and manage working days based on calendar events
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CalendarEntryType } from '@prisma/client';

@Injectable()
export class WorkingDaysService {
  private readonly logger = new Logger(WorkingDaysService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate working days for a given month and year
   */
  async calculateWorkingDays(month: number, year: number): Promise<number> {
    try {
      // Get or create working days tracker
      let tracker = await this.prisma.workingDaysTracker.findUnique({
        where: { month_year: { month, year } },
      });

      if (!tracker) {
        tracker = await this.createWorkingDaysTracker(month, year);
      } else {
        // Update if calendar events have changed
        tracker = await this.updateWorkingDaysTracker(tracker.id, month, year);
      }

      return tracker.availableDays;
    } catch (error) {
      this.logger.error(
        `Error calculating working days for ${month}/${year}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new working days tracker
   */
  private async createWorkingDaysTracker(month: number, year: number) {
    const calculations = await this.performCalculations(month, year);

    return this.prisma.workingDaysTracker.create({
      data: {
        month,
        year,
        ...calculations,
      },
    });
  }

  /**
   * Update existing working days tracker
   */
  private async updateWorkingDaysTracker(
    trackerId: string,
    month: number,
    year: number,
  ) {
    const calculations = await this.performCalculations(month, year);

    return this.prisma.workingDaysTracker.update({
      where: { id: trackerId },
      data: calculations,
    });
  }

  /**
   * Perform the actual working days calculations
   */
  private async performCalculations(month: number, year: number) {
    // Calculate total days in month
    const totalDays = new Date(year, month, 0).getDate();

    // Calculate Saturdays (they are holidays)
    const saturdays = this.calculateSaturdays(month, year);

    // Get calendar events for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const calendarEvents = await this.prisma.calendarEntry.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            AND: [
              { startDate: { gte: startDate } },
              { startDate: { lte: endDate } },
            ],
          },
          {
            AND: [
              { endDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
    });

    // Count different types of events
    let holidays = 0;
    let events = 0;
    let exams = 0;

    const processedDates = new Set<string>(); // To avoid double counting

    for (const event of calendarEvents) {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      // Generate all dates in the event range within our month
      for (
        let d = new Date(eventStartDate);
        d <= eventEndDate;
        d.setDate(d.getDate() + 1)
      ) {
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          const dateStr = d.toISOString().split('T')[0];

          // Skip if already processed or if it's a Saturday (already counted)
          if (processedDates.has(dateStr) || d.getDay() === 6) {
            continue;
          }

          processedDates.add(dateStr);

          switch (event.type) {
            case CalendarEntryType.HOLIDAY:
              holidays++;
              break;
            case CalendarEntryType.EVENT:
              events++;
              break;
            case CalendarEntryType.EXAM:
              exams++;
              break;
          }
        }
      }
    }

    // Calculate available working days
    // Total days minus Saturdays, holidays, and events (exams are still working days for attendance)
    const availableDays = totalDays - saturdays - holidays - events;

    return {
      totalDays,
      saturdays,
      holidays,
      events,
      exams,
      availableDays: Math.max(0, availableDays), // Ensure non-negative
    };
  }

  /**
   * Calculate number of Saturdays in a month
   */
  private calculateSaturdays(month: number, year: number): number {
    let saturdays = 0;
    const totalDays = new Date(year, month, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === 6) {
        // Saturday
        saturdays++;
      }
    }

    return saturdays;
  }

  /**
   * Check if a specific date is a holiday, event, or Saturday
   */
  async checkDateStatus(date: string | Date): Promise<{
    isHoliday: boolean;
    isEvent: boolean;
    isExam: boolean;
    isSaturday: boolean;
    isWorkingDay: boolean;
    eventDetails?: {
      title: string;
      type: CalendarEntryType;
      description?: string;
    };
  }> {
    try {
      const checkDate = new Date(date);
      const isSaturday = checkDate.getDay() === 6;

      // Check for calendar events on this date
      const calendarEvent = await this.prisma.calendarEntry.findFirst({
        where: {
          deletedAt: null,
          AND: [
            { startDate: { lte: checkDate } },
            { endDate: { gte: checkDate } },
          ],
        },
        orderBy: { createdAt: 'desc' }, // Get most recent if multiple events
      });

      const isHoliday = calendarEvent?.type === CalendarEntryType.HOLIDAY;
      const isEvent = calendarEvent?.type === CalendarEntryType.EVENT;
      const isExam = calendarEvent?.type === CalendarEntryType.EXAM;

      // Working day = not Saturday, not holiday, not event (exams are still working days)
      const isWorkingDay = !isSaturday && !isHoliday && !isEvent;

      return {
        isHoliday,
        isEvent,
        isExam,
        isSaturday,
        isWorkingDay,
        eventDetails: calendarEvent
          ? {
              title: calendarEvent.name,
              type: calendarEvent.type,
              description: calendarEvent.examDetails || undefined,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Error checking date status for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Get working days tracker for a month
   */
  async getWorkingDaysTracker(month: number, year: number) {
    return this.prisma.workingDaysTracker.findUnique({
      where: { month_year: { month, year } },
    });
  }

  /**
   * Recalculate working days when calendar events change
   */
  async recalculateForEvent(eventStartDate: Date, eventEndDate: Date) {
    const affectedMonths = this.getAffectedMonths(eventStartDate, eventEndDate);

    for (const { month, year } of affectedMonths) {
      await this.calculateWorkingDays(month, year);
      this.logger.log(`Recalculated working days for ${month}/${year}`);
    }
  }

  /**
   * Get months affected by an event date range
   */
  private getAffectedMonths(
    startDate: Date,
    endDate: Date,
  ): Array<{ month: number; year: number }> {
    const months: Array<{ month: number; year: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      months.push({
        month: current.getMonth() + 1,
        year: current.getFullYear(),
      });

      // Move to next month
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return months;
  }
}
