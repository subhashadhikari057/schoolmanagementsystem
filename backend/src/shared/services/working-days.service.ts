import { PrismaClient, CalendarEntryType } from '@prisma/client';

export class WorkingDaysService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Recalculates and updates working days tracker for a specific month/year
   * based on actual calendar entries
   */
  async updateWorkingDaysForMonth(month: number, year: number): Promise<void> {
    // Calculate total days in month
    const totalDays = new Date(year, month, 0).getDate();

    // Count Saturdays in the month
    let saturdays = 0;
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === 6) {
        // Saturday is 6
        saturdays++;
      }
    }

    // Get calendar entries for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const calendarEntries = await this.prisma.calendarEntry.findMany({
      where: {
        AND: [
          { startDate: { gte: startOfMonth } },
          { startDate: { lte: endOfMonth } },
        ],
      },
      select: {
        type: true,
        startDate: true,
        endDate: true,
      },
    });

    // Count different types of calendar entries
    let holidays = 0;
    let events = 0;
    let exams = 0;
    let emergencyClosures = 0;

    calendarEntries.forEach(entry => {
      // Calculate days for this entry
      const entryStart = new Date(entry.startDate);
      const entryEnd = new Date(entry.endDate);
      const entryDays =
        Math.ceil(
          (entryEnd.getTime() - entryStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      switch (entry.type) {
        case CalendarEntryType.HOLIDAY:
          holidays += entryDays;
          break;
        case CalendarEntryType.EVENT:
          events += entryDays;
          break;
        case CalendarEntryType.EXAM:
          exams += entryDays;
          break;
        case CalendarEntryType.EMERGENCY_CLOSURE:
          emergencyClosures += entryDays;
          break;
      }
    });

    // Calculate available working days
    const availableDays =
      totalDays - saturdays - holidays - events - exams - emergencyClosures;

    // Update or create the working days tracker record
    const trackerData = {
      month,
      year,
      totalDays,
      saturdays,
      holidays,
      events,
      exams,
      availableDays,
      emergencyClosures,
    };

    await this.prisma.workingDaysTracker.upsert({
      where: {
        month_year: {
          month,
          year,
        },
      },
      update: trackerData,
      create: trackerData,
    });
  }

  /**
   * Updates working days tracker for all months that have calendar entries
   */
  async updateAllWorkingDays(): Promise<void> {
    // Get all distinct month/year combinations from calendar entries
    const distinctMonths = await this.prisma.calendarEntry.findMany({
      select: {
        startDate: true,
      },
      distinct: ['startDate'],
    });

    const monthYearSet = new Set<string>();

    distinctMonths.forEach(entry => {
      const date = new Date(entry.startDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      monthYearSet.add(`${month}-${year}`);
    });

    // Also include current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    monthYearSet.add(`${currentMonth}-${currentYear}`);

    // Update each month
    for (const monthYear of monthYearSet) {
      const [month, year] = monthYear.split('-').map(Number);
      await this.updateWorkingDaysForMonth(month, year);
    }
  }

  /**
   * Hook to call after calendar entry changes
   */
  async onCalendarEntryChange(calendarEntryDate: Date): Promise<void> {
    const month = calendarEntryDate.getMonth() + 1;
    const year = calendarEntryDate.getFullYear();
    await this.updateWorkingDaysForMonth(month, year);
  }
}
