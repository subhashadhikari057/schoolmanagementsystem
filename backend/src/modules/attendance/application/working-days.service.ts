/**
 * =============================================================================
 * Working Days Service
 * ==========================          switch (event.type) {
            case 'HOLIDAY':
              holidayDates.add(dateStr);
              break;
            case 'EVENT':
              // Only count events as affecting working days if they are school-wide
              if (event.eventScope === EventScope.SCHOOL_WIDE) {
                holidayDates.add(dateStr);
              }
              // Partial events don't affect working days - students still need to attend
              break;
            case 'EXAM':
              examDates.add(dateStr);
              break;
            case 'EMERGENCY_CLOSURE':
              holidayDates.add(dateStr);
              break;
          }=================================
 * Service to calculate and manage working days based on calendar events
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CalendarEntryType, EventScope } from '@prisma/client';

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
            startDate: {
              gte: new Date(year, month - 1, 1),
              lte: new Date(year, month, 0),
            },
          },
          {
            endDate: {
              gte: new Date(year, month - 1, 1),
              lte: new Date(year, month, 0),
            },
          },
        ],
      },
      select: {
        type: true,
        eventScope: true,
        emergencyReason: true,
        examDetails: true,
        startDate: true,
        endDate: true,
        name: true,
      },
    }); // Track all dates that affect working days (holidays, school-wide events, emergency closures)
    const holidayDates = new Set<string>(); // Dates that should be considered non-working days
    const examDates = new Set<string>(); // Dates with exams (for tracking but don't affect working days)

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

          // Skip if it's a Saturday (already counted in saturdays calculation)
          if (d.getDay() === 6) {
            continue;
          }

          switch (event.type as string) {
            case 'HOLIDAY':
              holidayDates.add(dateStr);
              break;
            case 'EVENT':
              // School-wide events affect working days (students don't attend)
              // Partial events don't affect working days (students still attend)
              if (event.eventScope === EventScope.SCHOOL_WIDE) {
                holidayDates.add(dateStr);
              }
              break;
            case 'EXAM':
              // Exams don't reduce working days - students must attend for exams
              examDates.add(dateStr);
              break;
            case 'EMERGENCY_CLOSURE':
              holidayDates.add(dateStr);
              break;
          }
        }
      }
    }

    // Count the different types based on unique dates
    // Note: We count by category for statistics, but use holidayDates for actual calculation
    let holidays = 0;
    let events = 0; // Count school-wide events
    const exams = examDates.size;
    let emergencyClosures = 0;

    // Count specific event types for statistics (while avoiding double counting)
    const countedDates = new Set<string>();

    for (const event of calendarEvents) {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      for (
        let d = new Date(eventStartDate);
        d <= eventEndDate;
        d.setDate(d.getDate() + 1)
      ) {
        if (
          d.getMonth() + 1 === month &&
          d.getFullYear() === year &&
          d.getDay() !== 6
        ) {
          const dateStr = d.toISOString().split('T')[0];
          const countKey = `${dateStr}-${event.type}`;

          // Count each event type only once per date
          if (!countedDates.has(countKey)) {
            countedDates.add(countKey);

            switch (event.type as string) {
              case 'HOLIDAY':
                holidays++;
                break;
              case 'EVENT':
                // Count school-wide events as affecting working days
                if (event.eventScope === EventScope.SCHOOL_WIDE) {
                  events++;
                }
                break;
              case 'EMERGENCY_CLOSURE':
                emergencyClosures++;
                break;
            }
          }
        }
      }
    }

    // Calculate available working days using unique holiday dates
    // Total days minus Saturdays and unique holiday dates (regardless of how many events overlap)
    const totalNonWorkingDays = saturdays + holidayDates.size;
    const availableDays = Math.max(0, totalDays - totalNonWorkingDays);

    return {
      totalDays,
      saturdays,
      holidays,
      events,
      exams,
      emergencyClosures,
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
   * Check the status of a specific date for attendance purposes
   * Returns information about whether attendance is required and why
   */
  async checkDateStatus(date: string): Promise<{
    isWorkingDay: boolean;
    isHoliday: boolean;
    isEmergencyClosure: boolean;
    message: string;
    eventDetails?: {
      title: string;
      type: CalendarEntryType;
      eventScope?: string;
      description: string;
    };
  }> {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      // Saturday is always a holiday
      if (dayOfWeek === 6) {
        return {
          isWorkingDay: false,
          isHoliday: true,
          isEmergencyClosure: false,
          message: 'Saturday - Weekly holiday, no attendance required',
        };
      }

      // Check for calendar events on this date
      const calendarEvent = await this.prisma.calendarEntry.findFirst({
        where: {
          deletedAt: null,
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
        },
        select: {
          id: true,
          name: true,
          type: true,
          eventScope: true,
          examDetails: true,
          emergencyReason: true,
        },
      });

      if (!calendarEvent) {
        return {
          isWorkingDay: true,
          isHoliday: false,
          isEmergencyClosure: false,
          message: 'Regular school day - attendance required',
        };
      }

      const isHoliday = calendarEvent.type === CalendarEntryType.HOLIDAY;
      const isEmergencyClosure =
        calendarEvent.type === CalendarEntryType.EMERGENCY_CLOSURE;
      const isSchoolWideEvent =
        calendarEvent.type === CalendarEntryType.EVENT &&
        calendarEvent.eventScope === EventScope.SCHOOL_WIDE;

      let message: string;
      let isWorkingDay: boolean;

      switch (calendarEvent.type) {
        case CalendarEntryType.HOLIDAY:
          message = `Holiday: ${calendarEvent.name} - no attendance required`;
          isWorkingDay = false;
          break;

        case CalendarEntryType.EMERGENCY_CLOSURE:
          message = `Emergency closure: ${calendarEvent.name} - no attendance required`;
          isWorkingDay = false;
          break;

        case CalendarEntryType.EVENT:
          if (calendarEvent.eventScope === EventScope.SCHOOL_WIDE) {
            message = `School-wide event: ${calendarEvent.name} - no attendance required`;
            isWorkingDay = false;
          } else {
            message = `Partial event: ${calendarEvent.name} - regular attendance still required`;
            isWorkingDay = true;
          }
          break;

        case CalendarEntryType.EXAM:
          message = `Exam day: ${calendarEvent.name} - attendance required`;
          isWorkingDay = true;
          break;

        default:
          message = `Event: ${calendarEvent.name} - regular attendance required`;
          isWorkingDay = true;
      }

      return {
        isWorkingDay,
        isHoliday,
        isEmergencyClosure,
        message,
        eventDetails: calendarEvent
          ? {
              title: calendarEvent.name,
              type: calendarEvent.type,
              eventScope: calendarEvent.eventScope || undefined,
              description:
                calendarEvent.examDetails ||
                calendarEvent.emergencyReason ||
                calendarEvent.name,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Error checking date status for ${date}:`, error);
      throw error;
    }
  } /**
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
